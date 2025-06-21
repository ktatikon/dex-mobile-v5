/**
 * REDIS CACHING LAYER
 * 
 * Enterprise-level caching with Redis backend,
 * intelligent TTL management, and performance monitoring
 */

import Redis from 'ioredis';
import { config } from '../config/environment';
import { log } from './logger';
import { CacheEntry, CacheStats, CandlestickData } from '../types/index';

/**
 * Redis Cache Service
 */
class CacheService {
  private redis!: Redis;
  private stats: CacheStats;
  private isConnected: boolean = false;

  constructor() {
    this.stats = {
      hits: 0,
      misses: 0,
      hitRatio: 0,
      totalEntries: 0,
      memoryUsage: 0,
    };

    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  private initializeRedis(): void {
    try {
      this.redis = new Redis(config.redis.url, {
        password: config.redis.password,
        db: config.redis.db,
        keyPrefix: config.redis.keyPrefix,
        maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
        lazyConnect: true,
        reconnectOnError: (err: Error) => {
          log.error('Redis reconnect on error', { error: err });
          return err.message.includes('READONLY');
        },
      });

      this.setupEventHandlers();
      this.connect();
    } catch (error) {
      log.error('Failed to initialize Redis', { error: error instanceof Error ? error : new Error(String(error)) });
      throw error;
    }
  }

  /**
   * Setup Redis event handlers
   */
  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      log.info('Redis connected successfully');
      this.isConnected = true;
    });

    this.redis.on('ready', () => {
      log.info('Redis ready for operations');
    });

    this.redis.on('error', (error) => {
      log.error('Redis connection error', { error });
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      log.warn('Redis connection closed');
      this.isConnected = false;
    });

    this.redis.on('reconnecting', (delay: number) => {
      log.info('Redis reconnecting', { delay });
    });
  }

  /**
   * Connect to Redis
   */
  private async connect(): Promise<void> {
    try {
      await this.redis.connect();
      log.info('Redis connection established');
    } catch (error) {
      log.error('Failed to connect to Redis', { error: error instanceof Error ? error : new Error(String(error)) });
      throw error;
    }
  }

  /**
   * Generate cache key
   */
  private generateKey(tokenId: string, timeframe: string): string {
    return `chart:${tokenId}:${timeframe}`;
  }

  /**
   * Get data from cache
   */
  async get(tokenId: string, timeframe: string): Promise<CandlestickData[] | null> {
    if (!this.isConnected) {
      log.warn('Redis not connected, cache miss');
      this.stats.misses++;
      return null;
    }

    const key = this.generateKey(tokenId, timeframe);
    const startTime = Date.now();

    try {
      const cached = await this.redis.get(key);
      const duration = Date.now() - startTime;

      if (cached) {
        const entry: CacheEntry = JSON.parse(cached);
        
        // Check if cache entry is still valid
        if (Date.now() - entry.timestamp < entry.ttl * 1000) {
          this.stats.hits++;
          this.updateHitRatio();
          
          log.cache('hit', key, {
            tokenId,
            timeframe,
            duration,
            dataPoints: entry.data.length,
          });

          return entry.data;
        } else {
          // Cache expired, remove it
          await this.redis.del(key);
          log.cache('delete', key, { reason: 'expired' });
        }
      }

      this.stats.misses++;
      this.updateHitRatio();
      
      log.cache('miss', key, {
        tokenId,
        timeframe,
        duration,
      });

      return null;
    } catch (error) {
      log.error('Cache get error', { error: error instanceof Error ? error : new Error(String(error)), key, tokenId, timeframe });
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set data in cache
   */
  async set(
    tokenId: string,
    timeframe: string,
    data: CandlestickData[],
    ttl?: number
  ): Promise<boolean> {
    if (!this.isConnected) {
      log.warn('Redis not connected, cache set failed');
      return false;
    }

    const key = this.generateKey(tokenId, timeframe);
    const cacheTtl = ttl || config.cache.ttl;
    const startTime = Date.now();

    try {
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        ttl: cacheTtl,
        tokenId,
        timeframe,
        source: 'api',
      };

      await this.redis.setex(key, cacheTtl, JSON.stringify(entry));
      const duration = Date.now() - startTime;

      log.cache('set', key, {
        tokenId,
        timeframe,
        duration,
        ttl: cacheTtl,
        dataPoints: data.length,
      });

      return true;
    } catch (error) {
      log.error('Cache set error', { error: error instanceof Error ? error : new Error(String(error)), key, tokenId, timeframe });
      return false;
    }
  }

  /**
   * Delete data from cache
   */
  async delete(tokenId: string, timeframe?: string): Promise<boolean> {
    if (!this.isConnected) {
      log.warn('Redis not connected, cache delete failed');
      return false;
    }

    try {
      if (timeframe) {
        // Delete specific cache entry
        const key = this.generateKey(tokenId, timeframe);
        const result = await this.redis.del(key);
        
        log.cache('delete', key, { tokenId, timeframe });
        return result > 0;
      } else {
        // Delete all cache entries for token
        const pattern = this.generateKey(tokenId, '*');
        const keys = await this.redis.keys(pattern);
        
        if (keys.length > 0) {
          const result = await this.redis.del(...keys);
          log.cache('delete', `${keys.length} keys`, { tokenId, pattern });
          return result > 0;
        }
        
        return true;
      }
    } catch (error) {
      log.error('Cache delete error', { error: error instanceof Error ? error : new Error(String(error)), tokenId, timeframe });
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    if (!this.isConnected) {
      log.warn('Redis not connected, cache clear failed');
      return false;
    }

    try {
      const pattern = 'chart:*';
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        log.info('Cache cleared', { keysDeleted: keys.length });
      }
      
      return true;
    } catch (error) {
      log.error('Cache clear error', { error: error instanceof Error ? error : new Error(String(error)) });
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      if (this.isConnected) {
        const info = await this.redis.info('memory');
        const memoryMatch = info.match(/used_memory:(\d+)/);
        this.stats.memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

        const keyCount = await this.redis.dbsize();
        this.stats.totalEntries = keyCount;
      }
    } catch (error) {
      log.error('Failed to get cache stats', { error: error instanceof Error ? error : new Error(String(error)) });
    }

    return { ...this.stats };
  }

  /**
   * Update hit ratio
   */
  private updateHitRatio(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRatio = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Check if Redis is connected
   */
  isHealthy(): boolean {
    return this.isConnected && this.redis.status === 'ready';
  }

  /**
   * Get Redis connection status
   */
  getConnectionStatus(): string {
    return this.redis.status;
  }

  /**
   * Ping Redis
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      log.error('Redis ping failed', { error: error instanceof Error ? error : new Error(String(error)) });
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    try {
      await this.redis.quit();
      log.info('Redis connection closed gracefully');
    } catch (error) {
      log.error('Error closing Redis connection', { error: error instanceof Error ? error : new Error(String(error)) });
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Export class for testing
export { CacheService };
