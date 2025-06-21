/**
 * ENTERPRISE CHART API TYPE DEFINITIONS
 * 
 * Comprehensive type definitions for the chart microservice
 * with enterprise-level features and performance optimization
 */

// Core Chart Data Types
export interface OHLCDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ChartDataResponse {
  tokenId: string;
  symbol: string;
  timeframe: string;
  data: CandlestickData[];
  lastUpdated: string;
  source: 'cache' | 'api' | 'fallback';
  cacheHit: boolean;
  requestId: string;
}

// API Request/Response Types
export interface ChartDataRequest {
  tokenId: string;
  days: string;
  forceRefresh?: boolean;
  requestId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId: string;
  cacheHit?: boolean;
  source?: string;
}

// Cache Types
export interface CacheEntry {
  data: CandlestickData[];
  timestamp: number;
  ttl: number;
  tokenId: string;
  timeframe: string;
  source: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRatio: number;
  totalEntries: number;
  memoryUsage: number;
}

// Circuit Breaker Types
export interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
  nextAttempt: number;
  successCount: number;
}

export interface CircuitBreakerConfig {
  threshold: number;
  timeout: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

// Queue Types
export interface QueueJob {
  id: string;
  tokenId: string;
  days: string;
  priority: number;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface QueueStats {
  pending: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

// Health Check Types
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    redis: ServiceHealth;
    coingecko: ServiceHealth;
    queue: ServiceHealth;
  };
  metrics: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRatio: number;
  };
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

// Configuration Types
export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiVersion: string;
  redis: RedisConfig;
  cache: CacheConfig;
  coingecko: CoinGeckoConfig;
  circuitBreaker: CircuitBreakerConfig;
  queue: QueueConfig;
  rateLimit: RateLimitConfig;
  logging: LoggingConfig;
  health: HealthConfig;
  cors: CorsConfig;
}

export interface RedisConfig {
  url: string;
  password?: string;
  db: number;
  keyPrefix: string;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
}

export interface CacheConfig {
  ttl: number;
  maxSize: number;
  fallbackTtl: number;
  compressionEnabled: boolean;
}

export interface CoinGeckoConfig {
  baseUrl: string;
  apiKey?: string;
  rateLimitPerMinute: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface QueueConfig {
  concurrency: number;
  delay: number;
  debounceDelay: number;
  maxRetries: number;
  backoffDelay: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

export interface LoggingConfig {
  level: string;
  format: string;
  filePath?: string;
  maxFiles: number;
  maxSize: string;
}

export interface HealthConfig {
  checkInterval: number;
  timeout: number;
  retryAttempts: number;
}

export interface CorsConfig {
  origin: string | string[];
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
}

// Error Types
export interface ChartApiError extends Error {
  code: string;
  statusCode: number;
  details?: any;
  requestId?: string;
}

// Metrics Types
export interface MetricsData {
  requestCount: number;
  responseTime: number[];
  errorCount: number;
  cacheHits: number;
  cacheMisses: number;
  circuitBreakerTrips: number;
  queueSize: number;
  activeConnections: number;
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'price_update' | 'chart_update' | 'error' | 'heartbeat';
  tokenId?: string;
  data?: any;
  timestamp: number;
  requestId?: string;
}

export interface WebSocketClient {
  id: string;
  socket: any;
  subscriptions: Set<string>;
  lastActivity: number;
  isAlive: boolean;
}
