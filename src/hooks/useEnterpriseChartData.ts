/**
 * ENTERPRISE CHART DATA HOOK
 * 
 * Enhanced chart data management with enterprise-level loading orchestration,
 * real-time data validation, and comprehensive error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChartData, TimeInterval, ChartError } from '@/types/chart';
import { loadingOrchestrator } from '@/services/enterprise/loadingOrchestrator';
import { realTimeDataManager } from '@/services/enterprise/realTimeDataManager';
import { fetchOHLCData } from '@/services/chartDataService';

interface UseEnterpriseChartDataProps {
  tokenId: string;
  tokenSymbol: string;
  currentPrice?: number;
  initialInterval?: TimeInterval;
  enableAutoRefresh?: boolean;
  enablePreloading?: boolean;
}

interface UseEnterpriseChartDataReturn {
  chartData: ChartData | null;
  isLoading: boolean;
  error: ChartError | null;
  timeInterval: TimeInterval;
  setTimeInterval: (interval: TimeInterval) => void;
  refreshData: () => Promise<void>;
  lastUpdated: Date | null;
  loadingProgress: number;
  loadingStage: string;
  dataSource: 'primary' | 'fallback' | 'cache';
  validationResult: any;
}

export const useEnterpriseChartData = ({
  tokenId,
  tokenSymbol,
  currentPrice,
  initialInterval = '7D',
  enableAutoRefresh = true,
  enablePreloading = false
}: UseEnterpriseChartDataProps): UseEnterpriseChartDataReturn => {
  // State management
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ChartError | null>(null);
  const [timeInterval, setTimeInterval] = useState<TimeInterval>(initialInterval);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('idle');
  const [dataSource, setDataSource] = useState<'primary' | 'fallback' | 'cache'>('primary');
  const [validationResult, setValidationResult] = useState<any>(null);

  // Refs for cleanup and preventing race conditions
  const isMounted = useRef(true);
  const componentId = useRef(`chart_${tokenId}_${Date.now()}`);

  // Register component with loading orchestrator
  useEffect(() => {
    const config = {
      componentId: componentId.current,
      timeout: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 1000,
      dependencies: [],
      priority: 'high' as const
    };

    loadingOrchestrator.registerComponent(config);

    // Subscribe to loading state updates
    const subscription = loadingOrchestrator.getLoadingState(componentId.current).subscribe(
      (state) => {
        setIsLoading(state.isLoading);
        setLoadingProgress(state.progress);
        setLoadingStage(state.stage);
        if (state.error) {
          setError({
            message: state.error.message,
            code: 'LOADING_ERROR',
            timestamp: Date.now()
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [tokenId]);

  // Register data source with real-time data manager
  useEffect(() => {
    const sourceId = `chart_${tokenId}_${timeInterval}`;
    
    realTimeDataManager.registerDataSource(
      sourceId,
      {
        key: sourceId,
        ttl: getChartCacheTTL(timeInterval),
        refreshInterval: enableAutoRefresh ? getChartRefreshInterval(timeInterval) : 0,
        preloadNext: enablePreloading,
        compressionEnabled: true
      },
      validateChartData
    );

    // Subscribe to real-time data updates
    const subscription = realTimeDataManager.getDataStream(sourceId).subscribe(
      (state) => {
        if (state.data) {
          setChartData(state.data);
          setLastUpdated(new Date());
        }
        setDataSource(state.source);
        setValidationResult(state.validationResult);
        if (state.error && !state.data) {
          setError({
            message: state.error.message,
            code: 'DATA_ERROR',
            timestamp: Date.now()
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [tokenId, timeInterval, enableAutoRefresh, enablePreloading]);

  // Fetch chart data function with enterprise orchestration
  const fetchChartData = useCallback(async (
    targetTokenId: string,
    targetInterval: TimeInterval,
    forceRefresh = false
  ): Promise<void> => {
    if (!isMounted.current) return;

    console.log(`📊 Enterprise fetch for token: ${targetTokenId}, interval: ${targetInterval}`);

    try {
      // Clear previous errors
      setError(null);

      // Define data sources for orchestrated loading
      const dataSources = [
        {
          id: 'chart_data',
          fetch: () => fetchOHLCData(targetTokenId, targetInterval),
          cache: true,
          cacheTTL: getChartCacheTTL(targetInterval),
          fallback: () => generateFallbackChartData(targetTokenId, targetInterval)
        }
      ];

      // Use loading orchestrator for coordinated data fetching
      const results = await loadingOrchestrator.loadComponentData(
        componentId.current,
        dataSources
      );

      if (isMounted.current && results.chart_data) {
        setChartData(results.chart_data);
        setLastUpdated(new Date());
        console.log(`✅ Enterprise chart data loaded: ${results.chart_data.data.length} points`);
      }

    } catch (error) {
      console.error(`❌ Enterprise chart fetch failed:`, error);
      
      if (isMounted.current) {
        setError({
          message: error instanceof Error ? error.message : 'Failed to load chart data',
          code: 'ENTERPRISE_FETCH_ERROR',
          timestamp: Date.now()
        });
      }
    }
  }, []);

  // Enhanced refresh function
  const refreshData = useCallback(async (): Promise<void> => {
    if (!tokenId) return;

    console.log('📊 Enterprise chart data refresh triggered');
    await fetchChartData(tokenId, timeInterval, true);
  }, [tokenId, timeInterval, fetchChartData]);

  // Handle time interval changes with preloading
  const handleSetTimeInterval = useCallback((newInterval: TimeInterval) => {
    if (newInterval === timeInterval) return;

    console.log(`📊 Changing interval from ${timeInterval} to ${newInterval}`);
    setTimeInterval(newInterval);

    // Preload adjacent intervals if enabled
    if (enablePreloading) {
      const intervals: TimeInterval[] = ['1D', '7D', '30D', '90D', '180D'];
      const currentIndex = intervals.indexOf(newInterval);
      
      // Preload next interval
      if (currentIndex < intervals.length - 1) {
        const nextInterval = intervals[currentIndex + 1];
        setTimeout(() => {
          realTimeDataManager.fetchChartData(tokenId, nextInterval);
        }, 1000);
      }
    }
  }, [timeInterval, tokenId, enablePreloading]);

  // Initial data fetch when token or interval changes
  useEffect(() => {
    if (!tokenId) return;

    fetchChartData(tokenId, timeInterval);
  }, [tokenId, timeInterval, fetchChartData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    chartData,
    isLoading,
    error,
    timeInterval,
    setTimeInterval: handleSetTimeInterval,
    refreshData,
    lastUpdated,
    loadingProgress,
    loadingStage,
    dataSource,
    validationResult
  };
};

/**
 * Utility functions
 */
function getChartCacheTTL(interval: TimeInterval): number {
  switch (interval) {
    case '1D': return 5 * 60 * 1000; // 5 minutes
    case '7D': return 15 * 60 * 1000; // 15 minutes
    case '30D': return 30 * 60 * 1000; // 30 minutes
    case '90D': return 60 * 60 * 1000; // 1 hour
    case '180D': return 2 * 60 * 60 * 1000; // 2 hours
    default: return 15 * 60 * 1000;
  }
}

function getChartRefreshInterval(interval: TimeInterval): number {
  switch (interval) {
    case '1D': return 2 * 60 * 1000; // 2 minutes
    case '7D': return 5 * 60 * 1000; // 5 minutes
    case '30D': return 15 * 60 * 1000; // 15 minutes
    case '90D': return 30 * 60 * 1000; // 30 minutes
    case '180D': return 60 * 60 * 1000; // 1 hour
    default: return 5 * 60 * 1000;
  }
}

function validateChartData(data: ChartData): any {
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

    // Check for reasonable price ranges
    const prices = data.data.map(p => p.close).filter(p => p > 0);
    if (prices.length > 0) {
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);
      const priceRatio = maxPrice / minPrice;
      
      if (priceRatio > 1000) {
        warnings.push('Extreme price volatility detected');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    confidence: errors.length === 0 ? (warnings.length === 0 ? 1 : 0.8) : 0
  };
}

async function generateFallbackChartData(tokenId: string, timeInterval: TimeInterval): Promise<ChartData> {
  console.log(`🔄 Generating fallback chart data for ${tokenId} ${timeInterval}`);
  
  // Return empty chart data with proper error indication
  return {
    symbol: tokenId.toUpperCase(),
    interval: timeInterval,
    data: [],
    lastUpdated: Date.now(),
    error: `No ${timeInterval} chart data available - API temporarily unavailable`
  };
}
