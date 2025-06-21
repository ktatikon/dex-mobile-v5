/**
 * HEALTH CHECK ROUTES
 * 
 * Comprehensive health monitoring endpoints for service status,
 * dependency health, and performance metrics
 */

import { Router, Request, Response } from 'express';
import { cacheService } from '../utils/cache';
import { queueService } from '../services/queue';
import { coinGeckoService } from '../services/coingecko';
import { circuitBreakerService } from '../services/circuitBreaker';
import { log } from '../utils/logger';
import { HealthStatus, ServiceHealth, ApiResponse } from '../types/index';

const router = Router();

/**
 * Service start time for uptime calculation
 */
const startTime = Date.now();

/**
 * GET /api/v1/health
 * Basic health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string || `health_${Date.now()}`;
  
  try {
    const uptime = Date.now() - startTime;
    
    // Quick health checks
    const redisHealthy = cacheService.isHealthy();
    const queueHealth = await queueService.getHealthStatus();
    
    const isHealthy = redisHealthy && queueHealth.status !== 'unhealthy';
    
    const response: ApiResponse<{ status: string; uptime: number }> = {
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'degraded',
        uptime,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
    
    res.status(isHealthy ? 200 : 503).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Health Check Error',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      requestId,
    };
    
    res.status(503).json(response);
  }
});

/**
 * GET /api/v1/health/detailed
 * Detailed health check with all service dependencies
 */
router.get('/detailed', async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string || `health_detailed_${Date.now()}`;
  const startTime = Date.now();
  
  try {
    log.info('Detailed health check requested', { requestId });
    
    // Parallel health checks for better performance
    const [
      redisHealth,
      queueHealth,
      coinGeckoHealth,
      circuitBreakerMetrics,
      cacheStats,
      queueStats,
    ] = await Promise.allSettled([
      checkRedisHealth(),
      queueService.getHealthStatus(),
      coinGeckoService.getHealthStatus(),
      circuitBreakerService.getMetrics(),
      cacheService.getStats(),
      queueService.getStats(),
    ]);
    
    const uptime = Date.now() - startTime;
    
    // Process results
    const redis = redisHealth.status === 'fulfilled' ? redisHealth.value : {
      status: 'down' as const,
      error: redisHealth.status === 'rejected' ?
        (redisHealth.reason instanceof Error ? redisHealth.reason.message : String(redisHealth.reason)) :
        'Unknown error',
      lastCheck: new Date().toISOString(),
    };
    
    const queue = queueHealth.status === 'fulfilled' ? {
      status: queueHealth.value.status === 'healthy' ? 'up' as const : 
              queueHealth.value.status === 'degraded' ? 'degraded' as const : 'down' as const,
      lastCheck: new Date().toISOString(),
      stats: queueHealth.value.stats,
    } : {
      status: 'down' as const,
      error: queueHealth.status === 'rejected' ?
        (queueHealth.reason instanceof Error ? queueHealth.reason.message : String(queueHealth.reason)) :
        'Unknown error',
      lastCheck: new Date().toISOString(),
    };
    
    const coingecko = coinGeckoHealth.status === 'fulfilled' ? {
      status: coinGeckoHealth.value.status === 'healthy' ? 'up' as const :
              coinGeckoHealth.value.status === 'degraded' ? 'degraded' as const : 'down' as const,
      responseTime: coinGeckoHealth.value.responseTime,
      lastCheck: new Date().toISOString(),
      rateLimitStatus: coinGeckoHealth.value.rateLimitStatus,
      circuitBreakerStatus: coinGeckoHealth.value.circuitBreakerStatus,
    } : {
      status: 'down' as const,
      error: coinGeckoHealth.status === 'rejected' ?
        (coinGeckoHealth.reason instanceof Error ? coinGeckoHealth.reason.message : String(coinGeckoHealth.reason)) :
        'Unknown error',
      lastCheck: new Date().toISOString(),
    };
    
    // Calculate overall health status
    const services = [redis, queue, coingecko];
    const healthyServices = services.filter(s => s.status === 'up').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === services.length) {
      overallStatus = 'healthy';
    } else if (healthyServices + degradedServices === services.length) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }
    
    // Calculate performance metrics
    const totalRequests = queueStats.status === 'fulfilled' ? 
      queueStats.value.completed + queueStats.value.failed : 0;
    const errorRate = totalRequests > 0 && queueStats.status === 'fulfilled' ? 
      queueStats.value.failed / totalRequests : 0;
    const cacheHitRatio = cacheStats.status === 'fulfilled' ? 
      cacheStats.value.hitRatio : 0;
    
    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        redis,
        coingecko,
        queue,
      },
      metrics: {
        requestsPerMinute: totalRequests, // This could be enhanced with actual RPM calculation
        averageResponseTime: coingecko.responseTime || 0,
        errorRate,
        cacheHitRatio,
      },
    };
    
    const response: ApiResponse<HealthStatus> = {
      success: true,
      data: healthStatus,
      timestamp: new Date().toISOString(),
      requestId,
    };
    
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;
    
    log.info('Detailed health check completed', {
      requestId,
      status: overallStatus,
      duration: Date.now() - startTime,
      healthyServices,
      degradedServices,
      downServices: services.length - healthyServices - degradedServices,
    });
    
    res.status(statusCode).json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    log.error('Detailed health check failed', {
      requestId,
      error: error instanceof Error ? error : new Error(errorMessage),
      duration: Date.now() - startTime,
    });

    const response: ApiResponse = {
      success: false,
      error: 'Health Check Error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
      requestId,
    };
    
    res.status(503).json(response);
  }
});

/**
 * GET /api/v1/health/ready
 * Readiness probe for Kubernetes/Docker deployments
 */
router.get('/ready', async (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string || `ready_${Date.now()}`;
  
  try {
    // Check if all critical services are ready
    const redisReady = cacheService.isHealthy();
    const queueHealth = await queueService.getHealthStatus();
    const queueReady = queueHealth.status !== 'unhealthy';
    
    const isReady = redisReady && queueReady;
    
    const response: ApiResponse<{ ready: boolean; services: any }> = {
      success: true,
      data: {
        ready: isReady,
        services: {
          redis: redisReady,
          queue: queueReady,
        },
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
    
    res.status(isReady ? 200 : 503).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Readiness Check Error',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      requestId,
    };
    
    res.status(503).json(response);
  }
});

/**
 * GET /api/v1/health/live
 * Liveness probe for Kubernetes/Docker deployments
 */
router.get('/live', (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string || `live_${Date.now()}`;
  
  const response: ApiResponse<{ alive: boolean; uptime: number }> = {
    success: true,
    data: {
      alive: true,
      uptime: Date.now() - startTime,
    },
    timestamp: new Date().toISOString(),
    requestId,
  };
  
  res.json(response);
});

/**
 * Check Redis health
 */
async function checkRedisHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const isHealthy = cacheService.isHealthy();
    const pingResult = await cacheService.ping();
    const responseTime = Date.now() - startTime;
    
    return {
      status: isHealthy && pingResult ? 'up' : 'down',
      responseTime,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export default router;
