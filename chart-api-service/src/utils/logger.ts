/**
 * ENTERPRISE-GRADE WINSTON LOGGER
 *
 * Structured logging with file output, log levels, and performance monitoring
 */

import * as winston from 'winston';
import { config, isDevelopment } from '../config/environment';

// Custom log levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  },
};

// Add colors to winston
winston.addColors(customLevels.colors);

/**
 * Create console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

/**
 * Create JSON format for production
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create transports array
 */
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: isDevelopment ? consoleFormat : jsonFormat,
  }),
];

// Add file transport if configured
if (config.logging.filePath) {
  transports.push(
    new winston.transports.File({
      filename: config.logging.filePath,
      format: jsonFormat,
      maxsize: parseInt(config.logging.maxSize) * 1024 * 1024, // Convert MB to bytes
      maxFiles: config.logging.maxFiles,
    })
  );
}

/**
 * Create winston logger instance
 */
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true })
  ),
  transports,
  exitOnError: false,
});

/**
 * Enhanced logging interface with context
 */
interface LogContext {
  requestId?: string;
  tokenId?: string;
  userId?: string;
  operation?: string;
  duration?: number;
  error?: Error;
  [key: string]: any;
}

/**
 * Logger class with enhanced functionality
 */
class Logger {
  private winston: winston.Logger;

  constructor(winstonLogger: winston.Logger) {
    this.winston = winstonLogger;
  }

  /**
   * Log error with context
   */
  error(message: string, context?: LogContext): void {
    this.winston.error(message, this.formatContext(context));
  }

  /**
   * Log warning with context
   */
  warn(message: string, context?: LogContext): void {
    this.winston.warn(message, this.formatContext(context));
  }

  /**
   * Log info with context
   */
  info(message: string, context?: LogContext): void {
    this.winston.info(message, this.formatContext(context));
  }

  /**
   * Log HTTP request with context
   */
  http(message: string, context?: LogContext): void {
    this.winston.http(message, this.formatContext(context));
  }

  /**
   * Log debug with context
   */
  debug(message: string, context?: LogContext): void {
    this.winston.debug(message, this.formatContext(context));
  }

  /**
   * Log API request start
   */
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${url}`, {
      ...context,
      type: 'api_request',
      method,
      url,
    });
  }

  /**
   * Log API response
   */
  apiResponse(method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    this.info(`API Response: ${method} ${url} - ${statusCode} (${duration}ms)`, {
      ...context,
      type: 'api_response',
      method,
      url,
      statusCode,
      duration,
    });
  }

  /**
   * Log cache operation
   */
  cache(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, context?: LogContext): void {
    this.debug(`Cache ${operation}: ${key}`, {
      ...context,
      type: 'cache_operation',
      operation,
      key,
    });
  }

  /**
   * Log circuit breaker event
   */
  circuitBreaker(event: 'open' | 'close' | 'half-open' | 'trip', service: string, context?: LogContext): void {
    this.warn(`Circuit Breaker ${event}: ${service}`, {
      ...context,
      type: 'circuit_breaker',
      event,
      service,
    });
  }

  /**
   * Log queue operation
   */
  queue(operation: 'add' | 'process' | 'complete' | 'fail', jobId: string, context?: LogContext): void {
    this.debug(`Queue ${operation}: ${jobId}`, {
      ...context,
      type: 'queue_operation',
      operation,
      jobId,
    });
  }

  /**
   * Log performance metric
   */
  performance(metric: string, value: number, unit: string, context?: LogContext): void {
    this.info(`Performance: ${metric} = ${value}${unit}`, {
      ...context,
      type: 'performance',
      metric,
      value,
      unit,
    });
  }

  /**
   * Log security event
   */
  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext): void {
    this.warn(`Security Event: ${event} (${severity})`, {
      ...context,
      type: 'security',
      event,
      severity,
    });
  }

  /**
   * Format context for logging
   */
  private formatContext(context?: LogContext): LogContext {
    if (!context) return {};

    // Add timestamp if not present
    if (!context.timestamp) {
      context.timestamp = new Date().toISOString();
    }

    // Format error if present
    if (context.error && context.error instanceof Error) {
      context.error = {
        name: context.error.name,
        message: context.error.message,
        stack: context.error.stack,
      };
    }

    return context;
  }

  /**
   * Create child logger with default context
   */
  child(defaultContext: LogContext): Logger {
    const childLogger = this.winston.child(defaultContext);
    return new Logger(childLogger);
  }
}

// Export singleton logger instance
export const log = new Logger(logger);

// Export logger class for creating child loggers
export { Logger };

// Export winston logger for direct access if needed
export { logger as winstonLogger };
