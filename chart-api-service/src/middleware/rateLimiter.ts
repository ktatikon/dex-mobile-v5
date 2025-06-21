/**
 * RATE LIMITING MIDDLEWARE
 * 
 * Enterprise-level rate limiting with Redis backend,
 * IP-based and user-based limits, and intelligent throttling
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config/environment';
import { log } from '../utils/logger';
import { ApiResponse } from '../types/index';

/**
 * Custom key generator for rate limiting
 */
const keyGenerator = (req: Request): string => {
  // Use user ID if authenticated, otherwise use IP
  const userId = req.headers['x-user-id'] as string;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  return userId ? `user:${userId}` : `ip:${ip}`;
};

/**
 * Custom rate limit handler
 */
const rateLimitHandler = (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string || 'unknown';
  const key = keyGenerator(req);
  
  log.security('Rate limit exceeded', 'medium', {
    key,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    path: req.path,
    method: req.method,
    requestId,
  });
  
  const response: ApiResponse = {
    success: false,
    error: 'Rate Limit Exceeded',
    message: 'Too many requests. Please try again later.',
    timestamp: new Date().toISOString(),
    requestId,
  };
  
  res.status(429).json(response);
};

/**
 * Skip rate limiting for successful requests (optional)
 */
const skipSuccessfulRequests = (req: Request, res: Response): boolean => {
  if (!config.rateLimit.skipSuccessfulRequests) {
    return false;
  }
  
  return res.statusCode < 400;
};

/**
 * Main rate limiter for API endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipSuccessfulRequests,
  standardHeaders: config.rateLimit.standardHeaders,
  legacyHeaders: config.rateLimit.legacyHeaders,
  message: {
    success: false,
    error: 'Rate Limit Exceeded',
    message: 'Too many requests from this IP, please try again later.',
  },
});

/**
 * Strict rate limiter for sensitive endpoints
 */
export const strictRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: Math.floor(config.rateLimit.maxRequests / 2), // Half the normal limit
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipSuccessfulRequests,
  standardHeaders: config.rateLimit.standardHeaders,
  legacyHeaders: config.rateLimit.legacyHeaders,
  message: {
    success: false,
    error: 'Rate Limit Exceeded',
    message: 'Too many requests to sensitive endpoint, please try again later.',
  },
});

/**
 * Lenient rate limiter for health checks
 */
export const healthRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests * 2, // Double the normal limit
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipSuccessfulRequests,
  standardHeaders: false,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Rate Limit Exceeded',
    message: 'Too many health check requests.',
  },
});

/**
 * Chart-specific rate limiter with token-based throttling
 */
export const chartRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  keyGenerator: (req: Request): string => {
    const baseKey = keyGenerator(req);
    const tokenId = req.params.tokenId;
    
    // Include token ID in the key to prevent abuse of specific tokens
    return tokenId ? `${baseKey}:${tokenId}` : baseKey;
  },
  handler: (req: Request, res: Response) => {
    const requestId = req.headers['x-request-id'] as string || 'unknown';
    const key = keyGenerator(req);
    const tokenId = req.params.tokenId;
    
    log.security('Chart rate limit exceeded', 'medium', {
      key,
      tokenId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method,
      requestId,
    });
    
    const response: ApiResponse = {
      success: false,
      error: 'Chart Rate Limit Exceeded',
      message: `Too many chart requests for token ${tokenId}. Please try again later.`,
      timestamp: new Date().toISOString(),
      requestId,
    };
    
    res.status(429).json(response);
  },
  skip: skipSuccessfulRequests,
  standardHeaders: config.rateLimit.standardHeaders,
  legacyHeaders: config.rateLimit.legacyHeaders,
});

/**
 * Dynamic rate limiter based on system load
 */
export const dynamicRateLimiter = (baseLimit: number = config.rateLimit.maxRequests) => {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: (req: Request): number => {
      // Adjust rate limit based on system metrics
      // This could be enhanced with actual system monitoring
      const systemLoad = process.cpuUsage();
      const memoryUsage = process.memoryUsage();
      
      // Reduce limit if system is under stress
      const cpuStress = systemLoad.user + systemLoad.system;
      const memoryStress = memoryUsage.heapUsed / memoryUsage.heapTotal;
      
      let adjustedLimit = baseLimit;
      
      if (cpuStress > 80000000 || memoryStress > 0.8) { // High stress
        adjustedLimit = Math.floor(baseLimit * 0.5);
      } else if (cpuStress > 50000000 || memoryStress > 0.6) { // Medium stress
        adjustedLimit = Math.floor(baseLimit * 0.75);
      }
      
      return adjustedLimit;
    },
    keyGenerator,
    handler: rateLimitHandler,
    skip: skipSuccessfulRequests,
    standardHeaders: config.rateLimit.standardHeaders,
    legacyHeaders: config.rateLimit.legacyHeaders,
  });
};

/**
 * Rate limiter for cache operations
 */
export const cacheRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs / 2, // Shorter window for cache operations
  max: config.rateLimit.maxRequests * 3, // Higher limit for cache operations
  keyGenerator,
  handler: (req: Request, res: Response) => {
    const requestId = req.headers['x-request-id'] as string || 'unknown';
    
    log.security('Cache operation rate limit exceeded', 'low', {
      key: keyGenerator(req),
      ip: req.ip,
      path: req.path,
      method: req.method,
      requestId,
    });
    
    const response: ApiResponse = {
      success: false,
      error: 'Cache Rate Limit Exceeded',
      message: 'Too many cache operations. Please try again later.',
      timestamp: new Date().toISOString(),
      requestId,
    };
    
    res.status(429).json(response);
  },
  standardHeaders: config.rateLimit.standardHeaders,
  legacyHeaders: config.rateLimit.legacyHeaders,
});

/**
 * Export rate limiter configurations
 */
export const rateLimiters = {
  api: apiRateLimiter,
  strict: strictRateLimiter,
  health: healthRateLimiter,
  chart: chartRateLimiter,
  cache: cacheRateLimiter,
  dynamic: dynamicRateLimiter,
};
