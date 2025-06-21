/**
 * ENVIRONMENT CONFIGURATION
 * 
 * Centralized configuration management with validation
 * and type safety for the chart microservice
 */

import * as dotenv from 'dotenv';
import { AppConfig } from '../types/index';

// Load environment variables
dotenv.config();

/**
 * Get environment variable with default value and type conversion
 */
function getEnvVar(key: string, defaultValue: string): string;
function getEnvVar(key: string, defaultValue: number): number;
function getEnvVar(key: string, defaultValue: boolean): boolean;
function getEnvVar(key: string, defaultValue: string[]): string[];
function getEnvVar(key: string, defaultValue: any): any {
  const value = process.env[key];
  
  if (value === undefined) {
    return defaultValue;
  }
  
  // Type conversion based on default value type
  if (typeof defaultValue === 'number') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  if (typeof defaultValue === 'boolean') {
    return value.toLowerCase() === 'true';
  }
  
  if (Array.isArray(defaultValue)) {
    return value.split(',').map(item => item.trim());
  }
  
  return value;
}

/**
 * Validate required environment variables
 */
function validateConfig(): void {
  const requiredVars = [
    'PORT',
    'REDIS_URL',
    'COINGECKO_BASE_URL'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Validate configuration on startup
validateConfig();

/**
 * Application configuration object
 */
export const config: AppConfig = {
  // Server Configuration
  port: getEnvVar('PORT', 4000),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  apiVersion: getEnvVar('API_VERSION', 'v1'),
  
  // Redis Configuration
  redis: {
    url: getEnvVar('REDIS_URL', 'redis://localhost:6379'),
    password: process.env.REDIS_PASSWORD,
    db: getEnvVar('REDIS_DB', 0),
    keyPrefix: getEnvVar('REDIS_KEY_PREFIX', 'chart_api:'),
    retryDelayOnFailover: getEnvVar('REDIS_RETRY_DELAY', 100),
    maxRetriesPerRequest: getEnvVar('REDIS_MAX_RETRIES', 3),
  },
  
  // Cache Configuration
  cache: {
    ttl: getEnvVar('CACHE_TTL_SECONDS', 300),
    maxSize: getEnvVar('CACHE_MAX_SIZE', 1000),
    fallbackTtl: getEnvVar('FALLBACK_CACHE_TTL_SECONDS', 900),
    compressionEnabled: getEnvVar('CACHE_COMPRESSION_ENABLED', true),
  },
  
  // CoinGecko API Configuration
  coingecko: {
    baseUrl: getEnvVar('COINGECKO_BASE_URL', 'https://api.coingecko.com/api/v3'),
    apiKey: process.env.COINGECKO_API_KEY,
    rateLimitPerMinute: getEnvVar('COINGECKO_RATE_LIMIT_PER_MINUTE', 50),
    timeout: getEnvVar('COINGECKO_TIMEOUT_MS', 10000),
    retryAttempts: getEnvVar('COINGECKO_RETRY_ATTEMPTS', 3),
    retryDelay: getEnvVar('COINGECKO_RETRY_DELAY_MS', 2000),
  },
  
  // Circuit Breaker Configuration
  circuitBreaker: {
    threshold: getEnvVar('CIRCUIT_BREAKER_THRESHOLD', 5),
    timeout: getEnvVar('CIRCUIT_BREAKER_TIMEOUT_MS', 60000),
    resetTimeout: getEnvVar('CIRCUIT_BREAKER_RESET_TIMEOUT_MS', 30000),
    monitoringPeriod: getEnvVar('CIRCUIT_BREAKER_MONITORING_PERIOD_MS', 60000),
  },
  
  // Queue Configuration
  queue: {
    concurrency: getEnvVar('QUEUE_CONCURRENCY', 5),
    delay: getEnvVar('QUEUE_DELAY_MS', 100),
    debounceDelay: getEnvVar('DEBOUNCE_DELAY_MS', 300),
    maxRetries: getEnvVar('QUEUE_MAX_RETRIES', 3),
    backoffDelay: getEnvVar('QUEUE_BACKOFF_DELAY_MS', 1000),
  },
  
  // Rate Limiting Configuration
  rateLimit: {
    windowMs: getEnvVar('RATE_LIMIT_WINDOW_MS', 60000),
    maxRequests: getEnvVar('RATE_LIMIT_MAX_REQUESTS', 100),
    skipSuccessfulRequests: getEnvVar('RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS', false),
    standardHeaders: getEnvVar('RATE_LIMIT_STANDARD_HEADERS', true),
    legacyHeaders: getEnvVar('RATE_LIMIT_LEGACY_HEADERS', false),
  },
  
  // Logging Configuration
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info'),
    format: getEnvVar('LOG_FORMAT', 'json'),
    filePath: process.env.LOG_FILE_PATH,
    maxFiles: getEnvVar('LOG_MAX_FILES', 5),
    maxSize: getEnvVar('LOG_MAX_SIZE', '10m'),
  },
  
  // Health Check Configuration
  health: {
    checkInterval: getEnvVar('HEALTH_CHECK_INTERVAL_MS', 30000),
    timeout: getEnvVar('HEALTH_CHECK_TIMEOUT_MS', 5000),
    retryAttempts: getEnvVar('HEALTH_CHECK_RETRY_ATTEMPTS', 3),
  },
  
  // CORS Configuration
  cors: {
    origin: getEnvVar('CORS_ORIGIN', ['http://localhost:3001', 'http://localhost:3000']),
    credentials: getEnvVar('CORS_CREDENTIALS', true),
    methods: getEnvVar('CORS_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
    allowedHeaders: getEnvVar('CORS_ALLOWED_HEADERS', ['Content-Type', 'Authorization', 'X-Requested-With']),
  },
};

/**
 * Environment-specific configurations
 */
export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
export const isTest = config.nodeEnv === 'test';

/**
 * Export individual config sections for convenience
 */
export const {
  redis: redisConfig,
  cache: cacheConfig,
  coingecko: coinGeckoConfig,
  circuitBreaker: circuitBreakerConfig,
  queue: queueConfig,
  rateLimit: rateLimitConfig,
  logging: loggingConfig,
  health: healthConfig,
  cors: corsConfig,
} = config;
