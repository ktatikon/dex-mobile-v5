/**
 * ENTERPRISE REAL-TIME DATA MANAGEMENT SYSTEM
 * 
 * Provides vigorous real-time data validation, intelligent caching,
 * and seamless fallback mechanisms for enterprise-scale applications
 */

import { BehaviorSubject, Observable, interval, combineLatest } from 'rxjs';
import { map, filter, catchError, retry, shareReplay, distinctUntilChanged } from 'rxjs/operators';
import { fetchOHLCData } from '@/services/chartDataService';
import { ChartData, TimeInterval } from '@/types/chart';

export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  confidence: number; // 0-1
}

export interface CacheStrategy {
  key: string;
  ttl: number;
  refreshInterval: number;
  preloadNext: boolean;
  compressionEnabled: boolean;
}

export interface DataSource {
  id: string;
  type: 'chart' | 'market' | 'wallet' | 'transaction';
  endpoint: string;
  validator: (data: any) => DataValidationResult;
  fallbackStrategy: 'cache' | 'mock' | 'alternative' | 'none';
  priority: number; // 1-10, higher = more important
}

export interface RealTimeDataState {
  data: any;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: number;
  validationResult: DataValidationResult | null;
  source: 'primary' | 'fallback' | 'cache';
  retryCount: number;
}

/**
 * Enterprise Real-Time Data Manager
 * Manages data consistency, validation, and intelligent caching
 */
class RealTimeDataManager {
  private dataStreams = new Map<string, BehaviorSubject<RealTimeDataState>>();
  private cacheStrategies = new Map<string, CacheStrategy>();
  private dataValidators = new Map<string, (data: any) => DataValidationResult>();
  private refreshIntervals = new Map<string, NodeJS.Timeout>();
  private healthMetrics = new BehaviorSubject({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    lastHealthCheck: Date.now()
  });

  constructor() {
    this.initializeHealthMonitoring();
    this.setupDefaultValidators();
  }

  /**
   * Register a data source with validation and caching strategy
   */
  public registerDataSource(
    sourceId: string,
    cacheStrategy: CacheStrategy,
    validator: (data: any) => DataValidationResult
  ): void {
    // Initialize data stream
    this.dataStreams.set(sourceId, new BehaviorSubject<RealTimeDataState>({
      data: null,
      isLoading: false,
      error: null,
      lastUpdated: 0,
      validationResult: null,
      source: 'primary',
      retryCount: 0
    }));

    // Store cache strategy and validator
    this.cacheStrategies.set(sourceId, cacheStrategy);
    this.dataValidators.set(sourceId, validator);

    // Setup automatic refresh if configured
    if (cacheStrategy.refreshInterval > 0) {
      this.setupAutoRefresh(sourceId, cacheStrategy.refreshInterval);
    }

    console.log(`📊 Registered data source: ${sourceId} with ${cacheStrategy.ttl}ms TTL`);
  }

  /**
   * Get real-time data stream for a source
   */
  public getDataStream(sourceId: string): Observable<RealTimeDataState> {
    const stream = this.dataStreams.get(sourceId);
    if (!stream) {
      throw new Error(`Data source ${sourceId} not registered`);
    }

    return stream.asObservable().pipe(
      distinctUntilChanged((a, b) => 
        a.data === b.data && 
        a.isLoading === b.isLoading && 
        a.error === b.error
      ),
      shareReplay(1)
    );
  }

  /**
   * Fetch data with comprehensive error handling and validation
   */
  public async fetchData(
    sourceId: string,
    fetchFunction: () => Promise<any>,
    fallbackFunction?: () => Promise<any>
  ): Promise<any> {
    const stream = this.dataStreams.get(sourceId);
    const validator = this.dataValidators.get(sourceId);
    const cacheStrategy = this.cacheStrategies.get(sourceId);

    if (!stream || !validator || !cacheStrategy) {
      throw new Error(`Data source ${sourceId} not properly configured`);
    }

    const startTime = Date.now();
    let currentState = stream.value;

    // Update loading state
    stream.next({
      ...currentState,
      isLoading: true,
      error: null
    });

    try {
      // Check cache first
      const cachedData = this.getCachedData(cacheStrategy.key);
      if (cachedData && this.isCacheValid(cacheStrategy.key, cacheStrategy.ttl)) {
        const validationResult = validator(cachedData);
        
        if (validationResult.isValid) {
          stream.next({
            data: cachedData,
            isLoading: false,
            error: null,
            lastUpdated: Date.now(),
            validationResult,
            source: 'cache',
            retryCount: 0
          });

          this.updateHealthMetrics(true, Date.now() - startTime, true);
          return cachedData;
        }
      }

      // Fetch fresh data
      const data = await this.fetchWithRetry(fetchFunction, 3, 1000);
      const validationResult = validator(data);

      if (!validationResult.isValid) {
        console.warn(`⚠️ Data validation failed for ${sourceId}:`, validationResult.errors);
        
        // Try fallback if validation fails
        if (fallbackFunction) {
          const fallbackData = await fallbackFunction();
          const fallbackValidation = validator(fallbackData);
          
          if (fallbackValidation.isValid) {
            stream.next({
              data: fallbackData,
              isLoading: false,
              error: null,
              lastUpdated: Date.now(),
              validationResult: fallbackValidation,
              source: 'fallback',
              retryCount: currentState.retryCount + 1
            });

            this.updateHealthMetrics(true, Date.now() - startTime, false);
            return fallbackData;
          }
        }

        throw new Error(`Data validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Cache valid data
      this.setCachedData(cacheStrategy.key, data, cacheStrategy.compressionEnabled);

      // Update stream with successful data
      stream.next({
        data,
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
        validationResult,
        source: 'primary',
        retryCount: 0
      });

      this.updateHealthMetrics(true, Date.now() - startTime, false);
      console.log(`✅ Successfully fetched and validated data for ${sourceId}`);
      return data;

    } catch (error) {
      console.error(`❌ Failed to fetch data for ${sourceId}:`, error);

      // Try to use stale cache as last resort
      const staleCache = this.getCachedData(cacheStrategy.key);
      if (staleCache) {
        console.log(`🔄 Using stale cache for ${sourceId}`);
        
        stream.next({
          data: staleCache,
          isLoading: false,
          error: error as Error,
          lastUpdated: Date.now(),
          validationResult: validator(staleCache),
          source: 'cache',
          retryCount: currentState.retryCount + 1
        });

        this.updateHealthMetrics(false, Date.now() - startTime, true);
        return staleCache;
      }

      // Update stream with error
      stream.next({
        ...currentState,
        isLoading: false,
        error: error as Error,
        retryCount: currentState.retryCount + 1
      });

      this.updateHealthMetrics(false, Date.now() - startTime, false);
      throw error;
    }
  }

  /**
   * Fetch chart data with time window support
   */
  public async fetchChartData(
    tokenId: string,
    timeInterval: TimeInterval,
    forceRefresh = false
  ): Promise<ChartData> {
    const sourceId = `chart_${tokenId}_${timeInterval}`;
    
    // Register if not exists
    if (!this.dataStreams.has(sourceId)) {
      this.registerDataSource(
        sourceId,
        {
          key: sourceId,
          ttl: this.getChartCacheTTL(timeInterval),
          refreshInterval: this.getChartRefreshInterval(timeInterval),
          preloadNext: true,
          compressionEnabled: true
        },
        this.validateChartData
      );
    }

    const fetchFunction = () => fetchOHLCData(tokenId, timeInterval);
    const fallbackFunction = () => this.generateFallbackChartData(tokenId, timeInterval);

    if (forceRefresh) {
      this.invalidateCache(sourceId);
    }

    return this.fetchData(sourceId, fetchFunction, fallbackFunction);
  }

  /**
   * Setup automatic refresh for a data source
   */
  private setupAutoRefresh(sourceId: string, intervalMs: number): void {
    const existingInterval = this.refreshIntervals.get(sourceId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const stream = this.dataStreams.get(sourceId);
        if (stream && !stream.value.isLoading) {
          console.log(`🔄 Auto-refreshing data for ${sourceId}`);
          // Trigger refresh without updating loading state
          // Implementation depends on specific data source
        }
      } catch (error) {
        console.error(`❌ Auto-refresh failed for ${sourceId}:`, error);
      }
    }, intervalMs);

    this.refreshIntervals.set(sourceId, interval);
  }

  /**
   * Fetch with exponential backoff retry
   */
  private async fetchWithRetry(
    fetchFunction: () => Promise<any>,
    maxRetries: number,
    baseDelay: number
  ): Promise<any> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fetchFunction();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`⏳ Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Cache management
   */
  private getCachedData(key: string): any | null {
    try {
      const cached = localStorage.getItem(`rtdm_${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private setCachedData(key: string, data: any, compress: boolean): void {
    try {
      const serialized = JSON.stringify({
        data,
        timestamp: Date.now(),
        compressed: compress
      });
      localStorage.setItem(`rtdm_${key}`, serialized);
    } catch (error) {
      console.warn(`⚠️ Failed to cache data for ${key}:`, error);
    }
  }

  private isCacheValid(key: string, ttl: number): boolean {
    try {
      const cached = localStorage.getItem(`rtdm_${key}`);
      if (!cached) return false;

      const { timestamp } = JSON.parse(cached);
      return Date.now() - timestamp < ttl;
    } catch {
      return false;
    }
  }

  private invalidateCache(key: string): void {
    localStorage.removeItem(`rtdm_${key}`);
  }

  /**
   * Data validation functions
   */
  private setupDefaultValidators(): void {
    this.dataValidators.set('chart', this.validateChartData);
    this.dataValidators.set('market', this.validateMarketData);
    this.dataValidators.set('wallet', this.validateWalletData);
  }

  private validateChartData = (data: ChartData): DataValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || !data.data || !Array.isArray(data.data)) {
      errors.push('Invalid chart data structure');
    } else {
      if (data.data.length === 0) {
        warnings.push('Empty chart data');
      }

      // Validate OHLC data points
      const invalidPoints = data.data.filter(point => 
        !point.timestamp || 
        point.high < point.low || 
        point.open < 0 || 
        point.close < 0
      );

      if (invalidPoints.length > 0) {
        errors.push(`${invalidPoints.length} invalid OHLC data points`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      confidence: errors.length === 0 ? (warnings.length === 0 ? 1 : 0.8) : 0
    };
  };

  private validateMarketData = (data: any): DataValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(data)) {
      errors.push('Market data must be an array');
    } else {
      const invalidTokens = data.filter(token => 
        !token.id || 
        !token.symbol || 
        typeof token.price !== 'number' ||
        token.price < 0
      );

      if (invalidTokens.length > 0) {
        errors.push(`${invalidTokens.length} invalid token entries`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      confidence: errors.length === 0 ? 1 : 0
    };
  };

  private validateWalletData = (data: any): DataValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Invalid wallet data structure');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      confidence: errors.length === 0 ? 1 : 0
    };
  };

  /**
   * Generate fallback chart data
   */
  private async generateFallbackChartData(tokenId: string, timeInterval: TimeInterval): Promise<ChartData> {
    console.log(`🔄 Generating fallback chart data for ${tokenId} ${timeInterval}`);
    
    // Return empty chart data instead of mock data
    return {
      symbol: tokenId.toUpperCase(),
      interval: timeInterval,
      data: [],
      lastUpdated: Date.now(),
      error: 'No data available - API temporarily unavailable'
    };
  }

  /**
   * Get cache TTL based on time interval
   */
  private getChartCacheTTL(interval: TimeInterval): number {
    switch (interval) {
      case '1D': return 5 * 60 * 1000; // 5 minutes
      case '7D': return 15 * 60 * 1000; // 15 minutes
      case '30D': return 30 * 60 * 1000; // 30 minutes
      case '90D': return 60 * 60 * 1000; // 1 hour
      case '180D': return 2 * 60 * 60 * 1000; // 2 hours
      default: return 15 * 60 * 1000;
    }
  }

  /**
   * Get refresh interval based on time interval
   */
  private getChartRefreshInterval(interval: TimeInterval): number {
    switch (interval) {
      case '1D': return 2 * 60 * 1000; // 2 minutes
      case '7D': return 5 * 60 * 1000; // 5 minutes
      case '30D': return 15 * 60 * 1000; // 15 minutes
      case '90D': return 30 * 60 * 1000; // 30 minutes
      case '180D': return 60 * 60 * 1000; // 1 hour
      default: return 5 * 60 * 1000;
    }
  }

  /**
   * Health monitoring
   */
  private initializeHealthMonitoring(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Every minute
  }

  private performHealthCheck(): void {
    const metrics = this.healthMetrics.value;
    console.log(`📊 Health Check - Success Rate: ${
      metrics.totalRequests > 0 
        ? ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1)
        : 0
    }%, Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
  }

  private updateHealthMetrics(success: boolean, responseTime: number, fromCache: boolean): void {
    const current = this.healthMetrics.value;
    const newMetrics = {
      totalRequests: current.totalRequests + 1,
      successfulRequests: current.successfulRequests + (success ? 1 : 0),
      failedRequests: current.failedRequests + (success ? 0 : 1),
      averageResponseTime: (current.averageResponseTime + responseTime) / 2,
      cacheHitRate: fromCache 
        ? (current.cacheHitRate * current.totalRequests + 1) / (current.totalRequests + 1)
        : (current.cacheHitRate * current.totalRequests) / (current.totalRequests + 1),
      lastHealthCheck: Date.now()
    };

    this.healthMetrics.next(newMetrics);
  }

  /**
   * Get health metrics
   */
  public getHealthMetrics(): Observable<any> {
    return this.healthMetrics.asObservable();
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.refreshIntervals.forEach(interval => clearInterval(interval));
    this.refreshIntervals.clear();
    
    this.dataStreams.forEach(stream => stream.complete());
    this.dataStreams.clear();
    
    this.healthMetrics.complete();
  }
}

// Singleton instance
export const realTimeDataManager = new RealTimeDataManager();
