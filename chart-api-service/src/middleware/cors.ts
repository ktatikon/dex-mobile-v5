/**
 * CORS MIDDLEWARE CONFIGURATION
 * 
 * Enterprise-level CORS configuration with environment-specific
 * origins, security headers, and request validation
 */

const cors = require('cors');
import { CorsOptions } from 'cors';
import { Request } from 'express';
import { config, isDevelopment, isProduction } from '../config/environment';
import { log } from '../utils/logger';

/**
 * Dynamic origin validation
 */
const originValidator = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Allow requests with no origin (mobile apps, Postman, etc.)
  if (!origin) {
    return callback(null, true);
  }

  const allowedOrigins = Array.isArray(config.cors.origin) ? config.cors.origin : [config.cors.origin];
  
  // In development, be more permissive
  if (isDevelopment) {
    // Allow localhost with any port
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow dev tunnels
    if (origin.includes('.devtunnels.ms') || origin.includes('.github.dev')) {
      return callback(null, true);
    }
  }
  
  // Check against configured origins
  const isAllowed = allowedOrigins.some(allowedOrigin => {
    if (allowedOrigin === '*') return true;
    if (allowedOrigin === origin) return true;
    
    // Support wildcard subdomains
    if (allowedOrigin.startsWith('*.')) {
      const domain = allowedOrigin.slice(2);
      return origin.endsWith(domain);
    }
    
    return false;
  });
  
  if (isAllowed) {
    callback(null, true);
  } else {
    log.security('CORS origin blocked', 'medium', {
      origin,
      allowedOrigins,
      userAgent: 'unknown', // Will be filled by request context
    });
    
    callback(new Error(`CORS policy violation: Origin ${origin} not allowed`), false);
  }
};

/**
 * Main CORS configuration
 */
const corsOptions: CorsOptions = {
  origin: originValidator,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders,
  credentials: config.cors.credentials,
  
  // Additional security headers
  exposedHeaders: [
    'X-Request-ID',
    'X-Response-Time',
    'X-Rate-Limit-Limit',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
  ],
  
  // Preflight cache duration (24 hours)
  maxAge: 86400,
  
  // Enable preflight for all routes
  preflightContinue: false,
  
  // Pass the CORS preflight response to the next handler
  optionsSuccessStatus: 204,
};

/**
 * Development CORS configuration (more permissive)
 */
const devCorsOptions: CorsOptions = {
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Request-ID',
    'X-User-ID',
    'Cache-Control',
  ],
  credentials: true,
  exposedHeaders: [
    'X-Request-ID',
    'X-Response-Time',
    'X-Rate-Limit-Limit',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
  ],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

/**
 * Production CORS configuration (strict)
 */
const prodCorsOptions: CorsOptions = {
  origin: originValidator,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders,
  credentials: config.cors.credentials,
  exposedHeaders: [
    'X-Request-ID',
    'X-Response-Time',
  ],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

/**
 * CORS middleware with logging
 */
const corsWithLogging = (options: CorsOptions) => {
  const corsMiddleware = cors(options);
  
  return (req: Request, res: any, next: any) => {
    const origin = req.headers.origin;
    const method = req.method;
    const path = req.path;
    
    // Log CORS requests
    if (method === 'OPTIONS') {
      log.http('CORS preflight request', {
        origin,
        method,
        path,
        userAgent: req.headers['user-agent'],
        requestId: Array.isArray(req.headers['x-request-id']) ? req.headers['x-request-id'][0] : req.headers['x-request-id'],
      });
    } else if (origin) {
      log.http('CORS request', {
        origin,
        method,
        path,
        requestId: Array.isArray(req.headers['x-request-id']) ? req.headers['x-request-id'][0] : req.headers['x-request-id'],
      });
    }
    
    corsMiddleware(req, res, next);
  };
};

/**
 * Export CORS middleware based on environment
 */
export const corsMiddleware = corsWithLogging(
  isDevelopment ? devCorsOptions : 
  isProduction ? prodCorsOptions : 
  corsOptions
);

/**
 * Strict CORS for sensitive endpoints
 */
export const strictCorsMiddleware = corsWithLogging({
  origin: (origin, callback) => {
    // Only allow configured origins for sensitive endpoints
    if (!origin) {
      return callback(new Error('Origin required for sensitive endpoints'), false);
    }
    
    originValidator(origin, callback);
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true,
  maxAge: 3600, // Shorter cache for sensitive endpoints
});

/**
 * Public CORS for health checks and public endpoints
 */
export const publicCorsMiddleware = corsWithLogging({
  origin: '*',
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Request-ID'],
  credentials: false,
  maxAge: 86400,
});

/**
 * Export CORS configurations
 */
export const corsConfigurations = {
  default: corsMiddleware,
  strict: strictCorsMiddleware,
  public: publicCorsMiddleware,
  development: corsWithLogging(devCorsOptions),
  production: corsWithLogging(prodCorsOptions),
};
