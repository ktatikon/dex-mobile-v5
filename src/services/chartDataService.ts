/**
 * ENTERPRISE CHART DATA SERVICE
 *
 * Enhanced chart data service that integrates with the Chart API Microservice
 * with intelligent caching, circuit breaker patterns, and performance optimization
 * for 50,000+ concurrent users.
 */

import { CandlestickData, Time } from 'lightweight-charts';
import { ChartDataCache, ChartDataServiceConfig, ChartError } from '@/types/chart';

// Microservice configuration - Dynamic getters to avoid caching issues
const getChartApiBaseUrl = () => process.env.REACT_APP_CHART_API_URL || 'http://localhost:4000/api/v1';
const getFeatureFlagUseMicroservice = () => {
  const value = process.env.REACT_APP_USE_CHART_MICROSERVICE === 'true';
  console.log('📊 Dynamic Feature Flag Check:', {
    REACT_APP_USE_CHART_MICROSERVICE: process.env.REACT_APP_USE_CHART_MICROSERVICE,
    parsed: value,
    timestamp: new Date().toISOString()
  });
  return value;
};

// Debug logging for environment variables at module load
console.log('📊 ChartDataService Module Load Environment Configuration:', {
  REACT_APP_CHART_API_URL: process.env.REACT_APP_CHART_API_URL,
  REACT_APP_USE_CHART_MICROSERVICE: process.env.REACT_APP_USE_CHART_MICROSERVICE,
  CHART_API_BASE_URL: getChartApiBaseUrl(),
  FEATURE_FLAG_USE_MICROSERVICE: getFeatureFlagUseMicroservice(),
  timestamp: new Date().toISOString()
});

interface MicroserviceResponse {
  success: boolean;
  data?: {
    tokenId: string;
    symbol: string;
    timeframe: string;
    data: CandlestickData[];
    lastUpdated: string;
    source: 'cache' | 'api' | 'fallback';
    cacheHit: boolean;
    requestId: string;
  };
  error?: string;
  message?: string;
  timestamp: string;
  requestId: string;
}

class ChartDataService {
  private cache: ChartDataCache = {};
  private abortControllers: Map<string, AbortController> = new Map();
  private circuitBreaker: Map<string, { failures: number; lastFailure: number; isOpen: boolean }> = new Map();
  private requestQueue: Map<string, Promise<CandlestickData[]>> = new Map();
  private microserviceHealthy: boolean = true;
  private lastHealthCheck: number = 0;

  private readonly config: ChartDataServiceConfig = {
    cacheTTL: 5 * 60 * 1000, // 5 minutes - matches microservice cache
    maxCacheSize: 100,
    retryAttempts: 3,
    retryDelay: 1000, // Reduced since microservice handles retries
    circuitBreakerThreshold: 3,
    debounceDelay: 300, // Reduced since microservice handles debouncing
  };

  /**
   * Enhanced fetchCandles method with microservice integration
   * Falls back to direct CoinGecko API if microservice is unavailable
   */
  async fetchCandles(
    tokenId: string,
    days: string = '1',
    forceRefresh = false
  ): Promise<CandlestickData[]> {
    const cacheKey = `${tokenId}_${days}`;

    // Check local cache first (unless force refresh)
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      console.log(`📊 Local cache hit for ${cacheKey}`);
      return this.cache[cacheKey].data;
    }

    // Check if request is already in progress
    if (this.requestQueue.has(cacheKey)) {
      console.log(`📊 Request already in progress for ${cacheKey}, waiting...`);
      return this.requestQueue.get(cacheKey)!;
    }

    // Decide whether to use microservice or fallback
    const featureFlag = getFeatureFlagUseMicroservice();
    const shouldUseMicroservice = featureFlag && await this.checkMicroserviceHealth();

    console.log(`📊 Service selection for ${cacheKey}: microservice=${shouldUseMicroservice}, feature_flag=${featureFlag}, health=${this.microserviceHealthy}`);

    if (shouldUseMicroservice) {
      console.log(`📊 Using microservice for ${cacheKey}`);
      return this.fetchFromMicroservice(tokenId, days, forceRefresh);
    } else {
      console.log(`📊 Using fallback CoinGecko API for ${cacheKey}`);
      return this.fetchFromCoinGecko(tokenId, days, forceRefresh);
    }
  }

  /**
   * Fetch data from Chart API Microservice
   */
  private async fetchFromMicroservice(
    tokenId: string,
    days: string,
    forceRefresh: boolean
  ): Promise<CandlestickData[]> {
    const cacheKey = `${tokenId}_${days}`;

    // Cancel any existing request for this token
    this.cancelRequest(cacheKey);

    // Create new AbortController
    const controller = new AbortController();
    this.abortControllers.set(cacheKey, controller);

    // Create and queue the request
    const requestPromise = this.executeMicroserviceRequest(tokenId, days, forceRefresh, controller.signal);
    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const data = await requestPromise;

      // Cache the successful result locally
      this.cacheData(cacheKey, data);

      // Reset circuit breaker on success
      this.resetCircuitBreaker(cacheKey);

      console.log(`📊 Successfully fetched data from microservice for ${cacheKey}`);
      return data;

    } catch (error) {
      console.error(`📊 Microservice request failed for ${cacheKey}:`, error);

      // Mark microservice as unhealthy
      this.microserviceHealthy = false;
      this.lastHealthCheck = Date.now();

      // Check if we have cached data to return instead of failing
      if (this.cache[cacheKey] && this.cache[cacheKey].data.length > 0) {
        console.log(`📊 Microservice failed, returning cached data for ${cacheKey}`);
        return this.cache[cacheKey].data;
      }

      // Try fallback to direct CoinGecko API
      console.log(`📊 Falling back to CoinGecko API for ${cacheKey}`);
      return this.fetchFromCoinGecko(tokenId, days, forceRefresh);

    } finally {
      // Cleanup
      this.abortControllers.delete(cacheKey);
      this.requestQueue.delete(cacheKey);
    }
  }

  /**
   * Fetch data directly from CoinGecko API (fallback method)
   */
  private async fetchFromCoinGecko(
    tokenId: string,
    days: string,
    forceRefresh: boolean
  ): Promise<CandlestickData[]> {
    const cacheKey = `${tokenId}_${days}`;

    // Check circuit breaker
    if (this.isCircuitBreakerOpen(cacheKey)) {
      console.warn(`⚡ Circuit breaker open for ${cacheKey}, using cached data or throwing error`);
      if (this.cache[cacheKey]) {
        return this.cache[cacheKey].data;
      }
      throw new Error(`Circuit breaker open for ${tokenId}, service temporarily unavailable`);
    }

    // Cancel any existing request for this token
    this.cancelRequest(cacheKey);

    // Create new AbortController
    const controller = new AbortController();
    this.abortControllers.set(cacheKey, controller);

    // Create and queue the request
    const requestPromise = this.executeDirectRequest(tokenId, days, controller.signal);
    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const data = await requestPromise;

      // Cache the successful result
      this.cacheData(cacheKey, data);

      // Reset circuit breaker on success
      this.resetCircuitBreaker(cacheKey);

      console.log(`📊 Successfully fetched data from CoinGecko for ${cacheKey}`);
      return data;

    } catch (error) {
      // Handle circuit breaker
      this.recordFailure(cacheKey);

      // Check if it's a rate limiting error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        console.warn(`📊 CoinGecko rate limited for ${cacheKey}, checking cache...`);

        // Return cached data if available, even if expired
        if (this.cache[cacheKey] && this.cache[cacheKey].data.length > 0) {
          console.log(`📊 Returning cached data due to rate limiting for ${cacheKey}`);
          return this.cache[cacheKey].data;
        }
      }

      // Try to return cached data as fallback for any error
      if (this.cache[cacheKey]) {
        console.warn(`📊 CoinGecko API failed for ${cacheKey}, returning cached data`, error);
        return this.cache[cacheKey].data;
      }

      console.error(`📊 Failed to fetch data from CoinGecko for ${cacheKey}:`, error);
      throw error;

    } finally {
      // Cleanup
      this.abortControllers.delete(cacheKey);
      this.requestQueue.delete(cacheKey);
    }
  }

  /**
   * Execute microservice API request
   */
  private async executeMicroserviceRequest(
    tokenId: string,
    days: string,
    forceRefresh: boolean,
    signal: AbortSignal
  ): Promise<CandlestickData[]> {
    const url = `${getChartApiBaseUrl()}/chart/${tokenId}/${days}`;
    const params = new URLSearchParams();

    if (forceRefresh) {
      params.append('force_refresh', 'true');
    }

    const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;

    try {
      if (signal.aborted) {
        throw new Error('Request aborted');
      }

      console.log(`📊 Fetching data from microservice: ${fullUrl}`);

      const response = await fetch(fullUrl, {
        signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Request-ID': `frontend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(`Microservice rate limited: ${response.statusText}`);
        }
        if (response.status === 404) {
          throw new Error(`Token not found in microservice: ${tokenId}`);
        }
        if (response.status >= 500) {
          throw new Error(`Microservice server error: ${response.status}`);
        }
        throw new Error(`Microservice error: ${response.status} ${response.statusText}`);
      }

      const responseData: MicroserviceResponse = await response.json();

      if (!responseData.success || !responseData.data) {
        throw new Error(responseData.message || 'Invalid response from microservice');
      }

      console.log(`📊 Microservice response: ${responseData.data.data.length} data points, source: ${responseData.data.source}`);

      return responseData.data.data;

    } catch (error) {
      console.error(`📊 Microservice request failed:`, error);
      throw error;
    }
  }

  /**
   * Execute direct CoinGecko API request with retry logic
   */
  private async executeDirectRequest(
    tokenId: string,
    days: string,
    signal: AbortSignal
  ): Promise<CandlestickData[]> {
    const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/ohlc?vs_currency=usd&days=${days}`;

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        if (signal.aborted) {
          throw new Error('Request aborted');
        }

        console.log(`📊 Fetching OHLC data for ${tokenId} (attempt ${attempt}/${this.config.retryAttempts})`);
        
        const response = await fetch(url, {
          signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'x-cg-demo-api-key': 'CG-NChZphXHW5fgeAauutarcXF5', // Add API key
          },
        });

        if (!response.ok) {
          // Enhanced error handling for rate limiting
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After') || '60';
            throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
          }
          if (response.status === 404) {
            throw new Error(`Token not found: ${tokenId}`);
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const rawData = await response.json();
        
        if (!Array.isArray(rawData) || rawData.length === 0) {
          throw new Error('Invalid or empty data received from API');
        }

        // Transform data using scaffold logic
        const candleData: CandlestickData[] = rawData.map(([time, open, high, low, close]: number[]) => ({
          time: Math.floor(time / 1000) as Time,
          open: Number(open),
          high: Number(high),
          low: Number(low),
          close: Number(close),
        }));

        // Validate data quality
        const qualityScore = this.calculateDataQuality(candleData);
        if (qualityScore < 0.7) {
          console.warn(`📊 Low data quality (${qualityScore}) for ${tokenId}`);
        }

        return candleData;

      } catch (error) {
        lastError = error as Error;
        console.warn(`📊 Attempt ${attempt} failed for ${tokenId}:`, error);
        
        if (attempt < this.config.retryAttempts && !signal.aborted) {
          // Exponential backoff with jitter for rate limiting
          const baseDelay = this.config.retryDelay;
          const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
          const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
          const totalDelay = exponentialDelay + jitter;

          console.log(`📊 Retrying in ${Math.round(totalDelay)}ms (attempt ${attempt})`);
          await this.delay(totalDelay);
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Check microservice health
   */
  private async checkMicroserviceHealth(): Promise<boolean> {
    // Cache health check for 30 seconds
    const now = Date.now();
    if (this.microserviceHealthy && now - this.lastHealthCheck < 30000) {
      return true;
    }

    if (!this.microserviceHealthy && now - this.lastHealthCheck < 10000) {
      return false; // Don't check too frequently when unhealthy
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const baseUrl = getChartApiBaseUrl();
      console.log(`📊 Checking microservice health at: ${baseUrl}/health`);
      const response = await fetch(`${baseUrl}/health`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        this.microserviceHealthy = true;
        this.lastHealthCheck = now;
        console.log('📊 Microservice health check: healthy');
        return true;
      } else {
        this.microserviceHealthy = false;
        this.lastHealthCheck = now;
        console.warn(`📊 Microservice health check failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      this.microserviceHealthy = false;
      this.lastHealthCheck = now;
      console.warn('📊 Microservice health check error:', error);
      return false;
    }
  }

  /**
   * Cancel ongoing request for a specific cache key
   */
  cancelRequest(cacheKey: string): void {
    const controller = this.abortControllers.get(cacheKey);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(cacheKey);
      console.log(`📊 Cancelled request for ${cacheKey}`);
    }
  }

  /**
   * Invalidate cache for specific token or pattern
   */
  invalidateCache(pattern: string): void {
    const keysToDelete = Object.keys(this.cache).filter(key => 
      key.includes(pattern) || key.startsWith(pattern)
    );
    
    keysToDelete.forEach(key => {
      delete this.cache[key];
      this.cancelRequest(key);
    });
    
    console.log(`📊 Invalidated ${keysToDelete.length} cache entries for pattern: ${pattern}`);
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache[cacheKey];
    if (!cached) return false;
    
    const now = Date.now();
    const isExpired = now - cached.timestamp > cached.ttl;
    
    return !isExpired && cached.data.length > 0;
  }

  /**
   * Cache data with metadata
   */
  private cacheData(cacheKey: string, data: CandlestickData[]): void {
    // Implement LRU cache eviction if needed
    if (Object.keys(this.cache).length >= this.config.maxCacheSize) {
      this.evictOldestCache();
    }

    this.cache[cacheKey] = {
      data,
      timestamp: Date.now(),
      ttl: this.config.cacheTTL,
      quality: this.calculateDataQuality(data),
    };
  }

  /**
   * Calculate data quality score (0-1)
   */
  private calculateDataQuality(data: CandlestickData[]): number {
    if (!data || data.length === 0) return 0;
    
    let validPoints = 0;
    let totalPoints = data.length;
    
    for (const point of data) {
      if (
        typeof point.open === 'number' &&
        typeof point.high === 'number' &&
        typeof point.low === 'number' &&
        typeof point.close === 'number' &&
        point.high >= point.low &&
        point.high >= Math.max(point.open, point.close) &&
        point.low <= Math.min(point.open, point.close) &&
        point.open > 0 &&
        point.close > 0
      ) {
        validPoints++;
      }
    }
    
    return validPoints / totalPoints;
  }

  /**
   * Circuit breaker implementation
   */
  private isCircuitBreakerOpen(cacheKey: string): boolean {
    const breaker = this.circuitBreaker.get(cacheKey);
    if (!breaker) return false;
    
    // Reset circuit breaker after timeout
    if (breaker.isOpen && Date.now() - breaker.lastFailure > 60000) {
      breaker.isOpen = false;
      breaker.failures = 0;
    }
    
    return breaker.isOpen;
  }

  private recordFailure(cacheKey: string): void {
    const breaker = this.circuitBreaker.get(cacheKey) || { failures: 0, lastFailure: 0, isOpen: false };
    breaker.failures++;
    breaker.lastFailure = Date.now();
    
    if (breaker.failures >= this.config.circuitBreakerThreshold) {
      breaker.isOpen = true;
      console.warn(`⚡ Circuit breaker opened for ${cacheKey} after ${breaker.failures} failures`);
    }
    
    this.circuitBreaker.set(cacheKey, breaker);
  }

  private resetCircuitBreaker(cacheKey: string): void {
    this.circuitBreaker.delete(cacheKey);
  }

  /**
   * Evict oldest cache entry (LRU)
   */
  private evictOldestCache(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, value] of Object.entries(this.cache)) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      delete this.cache[oldestKey];
      console.log(`📊 Evicted oldest cache entry: ${oldestKey}`);
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if cache exists for a specific key
   */
  hasCachedData(cacheKey: string): boolean {
    return this.isCacheValid(cacheKey);
  }

  /**
   * Get comprehensive cache statistics
   */
  getCacheStats(): any {
    const entries = Object.values(this.cache);
    const now = Date.now();
    const totalEntries = Object.keys(this.cache).length;
    const activeRequests = this.requestQueue.size;
    const openCircuitBreakers = Array.from(this.circuitBreaker.values()).filter(cb => cb.isOpen).length;

    return {
      totalEntries,
      validEntries: entries.filter(entry => now - entry.timestamp < entry.ttl).length,
      totalSize: entries.reduce((size, entry) => size + entry.data.length, 0),
      activeRequests,
      openCircuitBreakers,
      maxCacheSize: this.config.maxCacheSize,
      averageQuality: entries.length > 0
        ? entries.reduce((sum, entry) => sum + entry.quality, 0) / entries.length
        : 0,
      oldestEntry: entries.length > 0
        ? Math.min(...entries.map(entry => entry.timestamp))
        : null,
      newestEntry: entries.length > 0
        ? Math.max(...entries.map(entry => entry.timestamp))
        : null,
    };
  }

  /**
   * Clear all cache and reset state
   */
  clearAll(): void {
    // Cancel all ongoing requests
    this.abortControllers.forEach(controller => controller.abort());
    
    // Clear all data structures
    this.cache = {};
    this.abortControllers.clear();
    this.circuitBreaker.clear();
    this.requestQueue.clear();
    
    console.log('📊 Cleared all chart data service state');
  }
}

// Export singleton instance
export const chartDataService = new ChartDataService();
