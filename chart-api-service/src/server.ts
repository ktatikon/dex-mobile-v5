/**
 * CHART API MICROSERVICE SERVER
 * 
 * Enterprise-level Express server with comprehensive middleware,
 * error handling, monitoring, and graceful shutdown
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config, isDevelopment } from './config/environment';
import { log } from './utils/logger';
import { corsMiddleware } from './middleware/cors';
import { rateLimiters } from './middleware/rateLimiter';
import { ApiResponse } from './types';

// Import routes
import chartRoutes from './routes/chart';
import healthRoutes from './routes/health';

// Import services for initialization
import { cacheService } from './utils/cache';
import { queueService } from './services/queue';

/**
 * Chart API Server Class
 */
class ChartApiServer {
  private app: Application;
  private server: any;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize middleware stack
   */
  private initializeMiddleware(): void {
    // Trust proxy for accurate IP addresses
    if (config.nodeEnv === 'production') {
      this.app.set('trust proxy', 1);
    }

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }));

    // Compression middleware
    this.app.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req: Request, res: Response) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
    }));

    // CORS middleware
    this.app.use(corsMiddleware);

    // Request parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    const morganFormat = isDevelopment ? 'dev' : 'combined';
    this.app.use(morgan(morganFormat, {
      stream: {
        write: (message: string) => {
          log.http(message.trim());
        },
      },
    }));

    // Request ID middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      if (!req.headers['x-request-id']) {
        req.headers['x-request-id'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      res.setHeader('X-Request-ID', req.headers['x-request-id'] as string);
      next();
    });

    // Response time middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - startTime;

        // Only set header if response hasn't been sent
        if (!res.headersSent) {
          res.setHeader('X-Response-Time', `${duration}ms`);
        }

        log.performance('request_duration', duration, 'ms', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          requestId: req.headers['x-request-id'] as string,
        });
      });

      next();
    });

    log.info('Middleware initialized successfully');
  }

  /**
   * Initialize API routes
   */
  private initializeRoutes(): void {
    // Health check routes (no rate limiting for basic health)
    this.app.use('/api/v1/health', healthRoutes);

    // Chart API routes with rate limiting
    this.app.use('/api/v1/chart', rateLimiters.chart, chartRoutes);

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      const response: ApiResponse = {
        success: true,
        data: {
          service: 'Chart API Microservice',
          version: process.env.npm_package_version || '1.0.0',
          environment: config.nodeEnv,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.json(response);
    });

    // API documentation endpoint
    this.app.get('/api', (req: Request, res: Response) => {
      const response: ApiResponse = {
        success: true,
        data: {
          name: 'Chart API Microservice',
          version: config.apiVersion,
          endpoints: {
            'GET /api/v1/health': 'Basic health check',
            'GET /api/v1/health/detailed': 'Detailed health status',
            'GET /api/v1/health/ready': 'Readiness probe',
            'GET /api/v1/health/live': 'Liveness probe',
            'GET /api/v1/chart/:tokenId/:days': 'Get chart data',
            'GET /api/v1/chart/:tokenId': 'Get chart data (1 day default)',
            'DELETE /api/v1/chart/cache/:tokenId': 'Clear token cache',
            'DELETE /api/v1/chart/cache': 'Clear all cache',
            'GET /api/v1/chart/stats': 'Get service statistics',
          },
          documentation: 'https://github.com/your-org/chart-api-service',
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.json(response);
    });

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      const response: ApiResponse = {
        success: false,
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };
      
      res.status(404).json(response);
    });

    log.info('Routes initialized successfully');
  }

  /**
   * Initialize error handling middleware
   */
  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      const requestId = req.headers['x-request-id'] as string;
      
      log.error('Unhandled error', {
        error: error,
        stack: error.stack,
        path: req.path,
        method: req.method,
        requestId,
      });

      const response: ApiResponse = {
        success: false,
        error: 'Internal Server Error',
        message: isDevelopment ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId,
      };

      res.status(500).json(response);
    });

    log.info('Error handling initialized successfully');
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Initialize services
      await this.initializeServices();

      // Start HTTP server
      this.server = this.app.listen(config.port, () => {
        log.info('Chart API Microservice started successfully', {
          port: config.port,
          environment: config.nodeEnv,
          version: process.env.npm_package_version || '1.0.0',
          pid: process.pid,
        });
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      log.error('Failed to start server', { error: error instanceof Error ? error : new Error(String(error)) });
      process.exit(1);
    }
  }

  /**
   * Initialize external services
   */
  private async initializeServices(): Promise<void> {
    try {
      log.info('Initializing services...');

      // Services are initialized automatically when imported
      // Just verify they're healthy
      const cacheHealthy = cacheService.isHealthy();
      const queueHealth = await queueService.getHealthStatus();

      if (!cacheHealthy) {
        log.warn('Cache service not healthy at startup');
      }

      if (queueHealth.status === 'unhealthy') {
        log.warn('Queue service not healthy at startup');
      }

      log.info('Services initialization completed', {
        cache: cacheHealthy ? 'healthy' : 'unhealthy',
        queue: queueHealth.status,
      });

    } catch (error) {
      log.error('Service initialization failed', { error: error instanceof Error ? error : new Error(String(error)) });
      throw error;
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      log.info(`Received ${signal}, starting graceful shutdown...`);

      // Stop accepting new connections
      if (this.server) {
        this.server.close(async () => {
          log.info('HTTP server closed');

          try {
            // Close services
            await queueService.close();
            await cacheService.close();

            log.info('All services closed successfully');
            process.exit(0);
          } catch (error) {
            log.error('Error during graceful shutdown', { error: error instanceof Error ? error : new Error(String(error)) });
            process.exit(1);
          }
        });
      }

      // Force exit after 30 seconds
      setTimeout(() => {
        log.error('Graceful shutdown timeout, forcing exit');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      log.error('Uncaught exception', { error });
      shutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      log.error('Unhandled promise rejection', { reason, promise });
      shutdown('unhandledRejection');
    });
  }

  /**
   * Get Express app instance
   */
  public getApp(): Application {
    return this.app;
  }
}

// Create and start server
const server = new ChartApiServer();

// Start server automatically
server.start().catch((error) => {
  log.error('Failed to start Chart API Microservice', { error });
  process.exit(1);
});

export default server;
