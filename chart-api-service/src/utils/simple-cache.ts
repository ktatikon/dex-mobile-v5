/**
 * SIMPLIFIED REDIS CACHE SERVICE
 * 
 * In-memory cache with Redis-like interface for development
 */

import { log } from './logger';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  uptime: number;
}

class SimpleCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    uptime: Date.now()
  };
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);

    log.info('Simple cache service initialized', {
      type: 'in-memory',
      cleanupInterval: '5min'
    });
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      log.cache('miss', key);
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.deletes++;
      log.cache('miss', key, { reason: 'expired' });
      return null;
    }

    this.stats.hits++;
    log.cache('hit', key);
    return entry.data;
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    const entry: CacheEntry = {
      data: value,
      timestamp: Date.now(),
      ttl: ttlSeconds
    };

    this.cache.set(key, entry);
    this.stats.sets++;
    this.stats.size = this.cache.size;

    log.cache('set', key, { 
      ttl: ttlSeconds,
      size: JSON.stringify(value).length 
    });
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
      log.cache('delete', key);
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
    this.stats.size = 0;
    log.info('Cache cleared', { entriesRemoved: size });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.uptime,
      size: this.cache.size
    };
  }

  /**
   * Check if cache is healthy
   */
  isHealthy(): boolean {
    return true; // Simple cache is always healthy
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.stats.deletes += cleaned;
      this.stats.size = this.cache.size;
      log.info('Cache cleanup completed', { 
        entriesRemoved: cleaned,
        remainingEntries: this.cache.size 
      });
    }
  }

  /**
   * Close cache service
   */
  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
    log.info('Simple cache service closed');
  }
}

// Export singleton instance
export const cacheService = new SimpleCacheService();
