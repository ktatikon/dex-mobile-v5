/**
 * ENTERPRISE CHART DATA MANAGEMENT HOOK
 *
 * Enhanced hook for managing chart data with microservice integration:
 * - Intelligent request debouncing and multi-layer caching
 * - Real-time WebSocket integration
 * - Automatic fallback to direct API on microservice failure
 * - Performance optimization for 50,000+ concurrent users
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CandlestickData } from 'lightweight-charts';
import { chartDataService } from '@/services/chartDataService';
import { webSocketDataService } from '@/services/webSocketDataService';
import { TimeInterval } from '@/types/chart';
import { Token } from '@/types';

interface UseChartDataOptions {
  enableRealTime?: boolean;
  debounceDelay?: number;
  cacheTimeout?: number;
  forceRefresh?: boolean;
  priority?: number;
}

interface UseChartDataReturn {
  data: CandlestickData[];
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
  cacheStats: any;
  source: 'microservice' | 'fallback' | 'cache' | 'unknown';
  isUsingMicroservice: boolean;
}

/**
 * Custom hook for managing chart data with enterprise features
 */
export function useChartData(
  tokenId: string | null,
  timeframe: TimeInterval,
  options: UseChartDataOptions = {}
): UseChartDataReturn {
  const {
    enableRealTime = true,
    debounceDelay = 300,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    forceRefresh = false,
    priority = 0,
  } = options;

  // State management
  const [data, setData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [source, setSource] = useState<'microservice' | 'fallback' | 'cache' | 'unknown'>('unknown');
  const [isUsingMicroservice, setIsUsingMicroservice] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState(0);

  // Refs for cleanup and debouncing
  const isMounted = useRef(true);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeout = useRef<NodeJS.Timeout | null>(null);
  const currentRequest = useRef<string>('');
  const webSocketUnsubscribe = useRef<(() => void) | null>(null);
  const requestStartTime = useRef<number>(0);

  // Memoized timeframe to days mapping for CoinGecko API
  // Updated for API rate limiting compatibility with longer intervals
  const timeframeToDays = useMemo(() => ({
    '1d': '1',      // 1 Day - hourly data points
    '7d': '7',      // 7 Days - 4-hour data points
    '1m': '30',     // 1 Month - daily data points
    '6m': '180',    // 6 Months - daily data points
    '1y': '365',    // 1 Year - daily data points
  }), []);

  /**
   * Fetch chart data with enhanced microservice integration
   */
  const fetchData = useCallback(async (forceRefreshParam = false) => {
    if (!tokenId) {
      setData([]);
      setLoading(false);
      setError(null);
      setSource('unknown');
      setIsUsingMicroservice(false);
      return;
    }

    const requestId = `${tokenId}_${timeframe}_${Date.now()}`;
    currentRequest.current = requestId;
    requestStartTime.current = Date.now();

    try {
      setLoading(true);
      setError(null);

      // Set a timeout to prevent loading state from getting stuck
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
      // Enterprise-level timeout with exponential backoff retry mechanism
      const timeoutDuration = Math.min(5000 + (retryCount * 1000), 15000); // 5s to 15s max
      loadingTimeout.current = setTimeout(() => {
        if (isMounted.current && loading) {
          console.warn(`📊 Loading timeout reached for ${tokenId} after ${timeoutDuration}ms (attempt ${retryCount + 1})`);
          setLoading(false);

          // Implement automatic retry with exponential backoff for enterprise reliability
          if (retryCount < 3) {
            const nextRetryCount = retryCount + 1;
            const retryDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s delays
            console.log(`📊 Scheduling automatic retry ${nextRetryCount}/3 for ${tokenId} in ${retryDelay}ms`);

            setTimeout(() => {
              if (isMounted.current) {
                setRetryCount(nextRetryCount);
                fetchData(true);
              }
            }, retryDelay);
          } else {
            console.error(`📊 Max retries (${retryCount + 1}) reached for ${tokenId}`);
            setError(new Error(`Failed to load chart data after ${retryCount + 1} attempts. Please try refreshing.`));
            setRetryCount(0); // Reset for next request
          }
        }
      }, timeoutDuration);

      const days = timeframeToDays[timeframe] || '1';
      const shouldForceRefresh = forceRefreshParam || forceRefresh;

      console.log(`📊 Fetching chart data for ${tokenId}, timeframe: ${timeframe}, days: ${days}, forceRefresh: ${shouldForceRefresh}`);

      // Check if microservice is being used
      const microserviceEnabled = process.env.REACT_APP_USE_CHART_MICROSERVICE === 'true';
      setIsUsingMicroservice(microserviceEnabled);

      console.log(`📊 Microservice enabled: ${microserviceEnabled}, fetching data...`);

      // Clear cache for timeframe changes to ensure fresh data
      if (shouldForceRefresh) {
        chartDataService.invalidateCache(tokenId);
        console.log(`📊 Cache cleared for ${tokenId} due to force refresh`);
      }

      const chartData = await chartDataService.fetchCandles(tokenId, days, shouldForceRefresh);

      // Only update state if this is still the current request and component is mounted
      if (currentRequest.current === requestId && isMounted.current) {
        // Handle empty data case
        if (!chartData || chartData.length === 0) {
          console.warn(`📊 No chart data received for ${tokenId}`);
          setData([]);
          setError(new Error(`No chart data available for ${tokenId}`));
          setSource('unknown');
        } else {
          setData(chartData);
          setLastUpdated(new Date());
          setError(null); // Clear any previous errors
          setRetryCount(0); // Reset retry counter on success

          // Determine source based on microservice status and response time
          const responseTime = Date.now() - requestStartTime.current;

          // The source should be determined by the actual service used, not just response time
          if (microserviceEnabled) {
            // If microservice is enabled, assume it was used unless it failed
            setSource('microservice');
          } else if (responseTime < 500) {
            setSource('cache');
          } else {
            setSource('fallback');
          }

          console.log(`📊 Successfully loaded ${chartData.length} data points for ${tokenId} (${responseTime}ms, microservice: ${microserviceEnabled})`);
        }
      }

    } catch (err) {
      const error = err as Error;
      console.error(`📊 Failed to fetch chart data for ${tokenId}:`, error);

      // Only update error state if this is still the current request and component is mounted
      if (currentRequest.current === requestId && isMounted.current) {
        setError(error);
        setSource('unknown');

        // Don't clear existing data on error - keep showing cached data
        // This provides better UX during network issues
      }
    } finally {
      // Clear loading timeout
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
        loadingTimeout.current = null;
      }

      // Always set loading to false if this is the current request or if no other request is pending
      if (isMounted.current) {
        // More aggressive loading state clearing to prevent stuck states
        const shouldClearLoading = currentRequest.current === requestId ||
                                  !currentRequest.current ||
                                  Date.now() - requestStartTime.current > 10000; // 10 second fallback

        if (shouldClearLoading) {
          setLoading(false);
          console.log(`📊 Loading state cleared for ${tokenId} (requestId: ${requestId}, reason: ${currentRequest.current === requestId ? 'current request' : !currentRequest.current ? 'no pending request' : 'timeout fallback'})`);
        } else {
          console.log(`📊 Skipping loading state clear - current: ${currentRequest.current}, this: ${requestId}`);
        }
      }
    }
  }, [tokenId, timeframe, timeframeToDays, forceRefresh]);

  /**
   * Debounced fetch function to prevent excessive API calls
   */
  const debouncedFetch = useCallback((forceRefresh = false) => {
    // Clear existing timers
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (loadingTimeout.current) {
      clearTimeout(loadingTimeout.current);
    }

    // Always set loading state for user feedback, especially for timeline changes
    setLoading(true);
    setError(null);
    console.log(`📊 Setting loading state for ${tokenId}, forceRefresh: ${forceRefresh}`);

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      fetchData(forceRefresh);
    }, debounceDelay);
  }, [fetchData, debounceDelay, tokenId]);

  /**
   * Manual refetch function
   */
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  /**
   * Clear cache for current token
   */
  const clearCache = useCallback(() => {
    if (tokenId) {
      chartDataService.invalidateCache(tokenId);
    }
  }, [tokenId]);

  /**
   * Get cache statistics
   */
  const cacheStats = useMemo(() => {
    return chartDataService.getCacheStats();
  }, [data, lastUpdated]);

  /**
   * Setup real-time WebSocket updates
   */
  useEffect(() => {
    if (!enableRealTime || !tokenId || data.length === 0) {
      return;
    }

    console.log(`📊 Setting up real-time updates for ${tokenId}`);

    // Subscribe to WebSocket updates
    const unsubscribe = webSocketDataService.subscribe((tokens) => {
      const updatedToken = tokens.find(t => t.id === tokenId);
      if (!updatedToken || !updatedToken.price) return;

      // Update the latest data point with real-time price
      setData(prevData => {
        if (prevData.length === 0) return prevData;

        const newData = [...prevData];
        const lastPoint = newData[newData.length - 1];
        
        // Update the close price of the last candle with real-time price
        newData[newData.length - 1] = {
          ...lastPoint,
          close: updatedToken.price!,
          high: Math.max(lastPoint.high, updatedToken.price!),
          low: Math.min(lastPoint.low, updatedToken.price!),
        };

        return newData;
      });

      setLastUpdated(new Date());
    });

    webSocketUnsubscribe.current = unsubscribe;

    return () => {
      if (webSocketUnsubscribe.current) {
        webSocketUnsubscribe.current();
        webSocketUnsubscribe.current = null;
      }
    };
  }, [enableRealTime, tokenId, data.length]);

  /**
   * Effect for token/timeframe changes with debouncing and cache warming
   */
  useEffect(() => {
    if (!tokenId) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Detect token and timeframe changes more reliably
    const previousRequestParts = currentRequest.current ? currentRequest.current.split('_') : [];
    const previousToken = previousRequestParts[0];
    const previousTimeframe = previousRequestParts[1];

    const isTokenChange = previousToken && previousToken !== tokenId;
    const isTimeframeChange = previousToken === tokenId && previousTimeframe && previousTimeframe !== timeframe;

    if (isTokenChange) {
      console.log(`📊 Token changed from ${previousToken} to ${tokenId}, clearing cache`);
      chartDataService.invalidateCache(previousToken);
    }

    if (isTimeframeChange) {
      console.log(`📊 Timeframe changed from ${previousTimeframe} to ${timeframe}, clearing cache for fresh data`);
      chartDataService.invalidateCache(tokenId);
    }

    // Force refresh for token or timeframe changes
    const shouldForceRefresh = isTokenChange || isTimeframeChange;
    console.log(`📊 Change detection: token=${isTokenChange}, timeframe=${isTimeframeChange}, forceRefresh=${shouldForceRefresh}`);
    debouncedFetch(shouldForceRefresh);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [tokenId, timeframe, debouncedFetch, timeframeToDays]);

  /**
   * Cleanup on unmount only (no dependencies to avoid canceling requests on timeframe changes)
   */
  useEffect(() => {
    return () => {
      isMounted.current = false;

      // Clear debounce timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Clear loading timeout
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }

      // Unsubscribe from WebSocket
      if (webSocketUnsubscribe.current) {
        webSocketUnsubscribe.current();
      }

      // Cancel any ongoing requests
      if (currentRequest.current) {
        const [tokenId] = currentRequest.current.split('_');
        chartDataService.cancelRequest(currentRequest.current);
      }
    };
  }, []); // Empty dependency array - only run on unmount

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch,
    clearCache,
    cacheStats,
    source,
    isUsingMicroservice,
  };
}
