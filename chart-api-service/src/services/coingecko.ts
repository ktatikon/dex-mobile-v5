/**
 * ENHANCED COINGECKO API SERVICE
 * 
 * Enterprise-level CoinGecko API wrapper with circuit breaker patterns,
 * exponential backoff, rate limiting, and intelligent error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '../config/environment';
import { log } from '../utils/logger';
import { cacheService } from '../utils/cache';
import { circuitBreakerService } from './circuitBreaker';
import { OHLCDataPoint, CandlestickData } from '../types/index';

/**
 * Rate limiter for CoinGecko API
 */
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(): boolean {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // Check if we're under the limit
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }

  /**
   * Get time until next request is allowed
   */
  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    const timeUntilReset = this.windowMs - (Date.now() - oldestRequest);
    
    return Math.max(0, timeUntilReset);
  }

  /**
   * Get current request count
   */
  getCurrentCount(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length;
  }
}

/**
 * CoinGecko API Service
 */
class CoinGeckoService {
  private client!: AxiosInstance;
  private rateLimiter: RateLimiter;
  private readonly serviceId = 'coingecko';

  constructor() {
    this.rateLimiter = new RateLimiter(
      config.coingecko.rateLimitPerMinute,
      60000 // 1 minute window
    );
    
    this.initializeClient();
  }

  /**
   * Initialize axios client
   */
  private initializeClient(): void {
    this.client = axios.create({
      baseURL: config.coingecko.baseUrl,
      timeout: config.coingecko.timeout,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DEX-Mobile-Chart-Service/1.0',
        ...(config.coingecko.apiKey && {
          'x-cg-demo-api-key': config.coingecko.apiKey,
        }),
      },
    });

    // Request interceptor for logging and rate limiting
    this.client.interceptors.request.use(
      (config) => {
        log.apiRequest(config.method?.toUpperCase() || 'GET', config.url || '');
        return config;
      },
      (error) => {
        log.error('CoinGecko request interceptor error', { error });
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        log.apiResponse(
          response.config.method?.toUpperCase() || 'GET',
          response.config.url || '',
          response.status,
          Date.now() - (response.config as any).startTime || 0
        );
        return response;
      },
      (error) => {
        const status = error.response?.status || 0;
        const url = error.config?.url || '';
        const method = error.config?.method?.toUpperCase() || 'GET';
        
        log.error('CoinGecko API error', {
          method,
          url,
          status,
          message: error.message,
          data: error.response?.data,
        });
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Make rate-limited request with circuit breaker protection
   */
  private async makeRequest<T>(
    requestConfig: AxiosRequestConfig,
    fallbackData?: T
  ): Promise<T> {
    // Check rate limit
    if (!this.rateLimiter.isAllowed()) {
      const waitTime = this.rateLimiter.getTimeUntilReset();
      log.warn('CoinGecko rate limit exceeded', {
        waitTime,
        currentCount: this.rateLimiter.getCurrentCount(),
        maxRequests: config.coingecko.rateLimitPerMinute,
      });
      
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    // Execute with circuit breaker protection
    return circuitBreakerService.execute(
      this.serviceId,
      async () => {
        const startTime = Date.now();
        (requestConfig as any).startTime = startTime;
        
        const response: AxiosResponse<T> = await this.client.request(requestConfig);
        
        log.performance('coingecko_request_duration', Date.now() - startTime, 'ms', {
          url: requestConfig.url,
          status: response.status,
        });
        
        return response.data;
      },
      fallbackData ? async () => fallbackData : undefined
    );
  }

  /**
   * Fetch OHLC data for a token
   */
  async fetchOHLCData(
    tokenId: string,
    days: string = '1',
    forceRefresh: boolean = false
  ): Promise<CandlestickData[]> {
    const requestId = `${tokenId}_${days}_${Date.now()}`;
    
    log.info('Fetching OHLC data', {
      tokenId,
      days,
      forceRefresh,
      requestId,
    });

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = await cacheService.get(tokenId, days);
      if (cachedData) {
        log.info('OHLC data served from cache', {
          tokenId,
          days,
          dataPoints: cachedData.length,
          requestId,
        });
        return cachedData;
      }
    }

    try {
      // Fetch from CoinGecko API
      const ohlcData: number[][] = await this.makeRequest({
        method: 'GET',
        url: `/coins/${tokenId}/ohlc`,
        params: {
          vs_currency: 'usd',
          days,
        },
      });

      // Validate response
      if (!Array.isArray(ohlcData) || ohlcData.length === 0) {
        throw new Error('Invalid OHLC data received from CoinGecko');
      }

      // Transform to CandlestickData format
      const candlestickData: CandlestickData[] = ohlcData.map((item: number[]) => {
        if (!Array.isArray(item) || item.length < 5) {
          throw new Error('Invalid OHLC data point format');
        }
        
        return {
          time: Math.floor(item[0] / 1000), // Convert to seconds
          open: item[1],
          high: item[2],
          low: item[3],
          close: item[4],
        };
      });

      // Validate data quality
      this.validateDataQuality(candlestickData, tokenId);

      // Cache the data
      await cacheService.set(tokenId, days, candlestickData);

      log.info('OHLC data fetched successfully', {
        tokenId,
        days,
        dataPoints: candlestickData.length,
        requestId,
        source: 'api',
      });

      return candlestickData;
    } catch (error) {
      log.error('Failed to fetch OHLC data', {
        tokenId,
        days,
        requestId,
        error: error instanceof Error ? error : new Error(String(error)),
      });

      // Try to return cached data as fallback
      const fallbackData = await cacheService.get(tokenId, days);
      if (fallbackData) {
        log.warn('Returning cached data as fallback', {
          tokenId,
          days,
          dataPoints: fallbackData.length,
          requestId,
        });
        return fallbackData;
      }

      throw error;
    }
  }

  /**
   * Validate data quality
   */
  private validateDataQuality(data: CandlestickData[], tokenId: string): void {
    if (data.length === 0) {
      throw new Error('No data points received');
    }

    let validPoints = 0;
    let invalidPoints = 0;

    for (const point of data) {
      if (
        typeof point.time === 'number' &&
        typeof point.open === 'number' &&
        typeof point.high === 'number' &&
        typeof point.low === 'number' &&
        typeof point.close === 'number' &&
        point.open > 0 &&
        point.high > 0 &&
        point.low > 0 &&
        point.close > 0 &&
        point.high >= point.low &&
        point.high >= Math.max(point.open, point.close) &&
        point.low <= Math.min(point.open, point.close)
      ) {
        validPoints++;
      } else {
        invalidPoints++;
      }
    }

    const qualityScore = validPoints / (validPoints + invalidPoints);
    
    log.info('Data quality validation', {
      tokenId,
      totalPoints: data.length,
      validPoints,
      invalidPoints,
      qualityScore: Math.round(qualityScore * 100),
    });

    // Require at least 70% data quality
    if (qualityScore < 0.7) {
      throw new Error(`Data quality too low: ${Math.round(qualityScore * 100)}%`);
    }
  }

  /**
   * Fetch token price
   */
  async fetchTokenPrice(tokenId: string): Promise<number> {
    try {
      const response: any = await this.makeRequest({
        method: 'GET',
        url: `/simple/price`,
        params: {
          ids: tokenId,
          vs_currencies: 'usd',
        },
      });

      const price = response[tokenId]?.usd;
      if (typeof price !== 'number') {
        throw new Error('Invalid price data received');
      }

      return price;
    } catch (error) {
      log.error('Failed to fetch token price', {
        tokenId,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime?: number;
    rateLimitStatus: {
      currentCount: number;
      maxRequests: number;
      timeUntilReset: number;
    };
    circuitBreakerStatus: any;
  }> {
    const startTime = Date.now();
    
    try {
      // Test with a simple ping request
      await this.makeRequest({
        method: 'GET',
        url: '/ping',
        timeout: 5000,
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < 2000 ? 'healthy' : 'degraded',
        responseTime,
        rateLimitStatus: {
          currentCount: this.rateLimiter.getCurrentCount(),
          maxRequests: config.coingecko.rateLimitPerMinute,
          timeUntilReset: this.rateLimiter.getTimeUntilReset(),
        },
        circuitBreakerStatus: circuitBreakerService.getStatus(this.serviceId),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        rateLimitStatus: {
          currentCount: this.rateLimiter.getCurrentCount(),
          maxRequests: config.coingecko.rateLimitPerMinute,
          timeUntilReset: this.rateLimiter.getTimeUntilReset(),
        },
        circuitBreakerStatus: circuitBreakerService.getStatus(this.serviceId),
      };
    }
  }
}

// Export singleton instance
export const coinGeckoService = new CoinGeckoService();

// Export class for testing
export { CoinGeckoService };
