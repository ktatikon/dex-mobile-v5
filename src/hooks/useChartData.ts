/**
 * Chart Data Hook
 * Manages chart data fetching, caching, and state for trading charts
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChartData, TimeInterval, ChartError } from '@/types/chart';
import { fetchOHLCData, generateMockChartData, clearExpiredCache } from '@/services/chartDataService';

interface UseChartDataReturn {
  chartData: ChartData | null;
  isLoading: boolean;
  error: ChartError | null;
  timeInterval: TimeInterval;
  setTimeInterval: (interval: TimeInterval) => void;
  refreshData: () => Promise<void>;
  lastUpdated: Date | null;
}

interface UseChartDataOptions {
  tokenId: string;
  tokenSymbol: string;
  currentPrice?: number;
  initialInterval?: TimeInterval;
  enableAutoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export const useChartData = ({
  tokenId,
  tokenSymbol,
  currentPrice = 100,
  initialInterval = '7D',
  enableAutoRefresh = true,
  refreshInterval = 5 * 60 * 1000 // 5 minutes
}: UseChartDataOptions): UseChartDataReturn => {
  
  // State management
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ChartError | null>(null);
  const [timeInterval, setTimeInterval] = useState<TimeInterval>(initialInterval);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Refs for cleanup and preventing race conditions
  const isMounted = useRef(true);
  const fetchCount = useRef(0);
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch chart data function
  const fetchChartData = useCallback(async (
    targetTokenId: string, 
    targetInterval: TimeInterval,
    showLoading = true
  ): Promise<void> => {
    // Prevent concurrent fetches
    fetchCount.current += 1;
    const currentFetchId = fetchCount.current;

    if (showLoading && isMounted.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      console.log(`📊 Fetching chart data for ${targetTokenId} (${targetInterval})`);
      
      let data: ChartData;
      
      try {
        // Try to fetch real data from CoinGecko
        data = await fetchOHLCData(targetTokenId, targetInterval);
      } catch (apiError) {
        console.warn(`📊 API fetch failed, using mock data:`, apiError);
        
        // Fallback to mock data
        data = generateMockChartData(tokenSymbol, targetInterval, currentPrice);
        
        // Set error but don't block rendering
        if (isMounted.current) {
          setError({
            message: 'Using simulated data - API temporarily unavailable',
            code: 'API_FALLBACK',
            timestamp: Date.now()
          });
        }
      }

      // Only update state if this is the most recent fetch and component is mounted
      if (currentFetchId === fetchCount.current && isMounted.current) {
        setChartData(data);
        setLastUpdated(new Date());
        
        // Clear error if we successfully got data (even mock data)
        if (data && data.data.length > 0) {
          setError(null);
        }
        
        console.log(`📊 Chart data updated for ${targetTokenId}: ${data.data.length} points`);
      }

    } catch (error) {
      console.error(`📊 Failed to fetch chart data for ${targetTokenId}:`, error);
      
      if (currentFetchId === fetchCount.current && isMounted.current) {
        setError({
          message: error instanceof Error ? error.message : 'Failed to load chart data',
          code: 'FETCH_ERROR',
          timestamp: Date.now()
        });
      }
    } finally {
      if (currentFetchId === fetchCount.current && isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [tokenSymbol, currentPrice]);

  // Manual refresh function
  const refreshData = useCallback(async (): Promise<void> => {
    if (!tokenId) return;
    
    console.log('📊 Manual chart data refresh triggered');
    await fetchChartData(tokenId, timeInterval, true);
  }, [tokenId, timeInterval, fetchChartData]);

  // Handle time interval changes
  const handleSetTimeInterval = useCallback((newInterval: TimeInterval) => {
    if (newInterval === timeInterval) return;
    
    console.log(`📊 Time interval changed: ${timeInterval} → ${newInterval}`);
    setTimeInterval(newInterval);
    
    // Fetch data for new interval
    if (tokenId) {
      fetchChartData(tokenId, newInterval, true);
    }
  }, [timeInterval, tokenId, fetchChartData]);

  // Setup auto-refresh timer
  useEffect(() => {
    if (!enableAutoRefresh || !tokenId) return;

    const setupRefreshTimer = () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }

      refreshTimer.current = setInterval(() => {
        if (isMounted.current) {
          console.log('📊 Auto-refresh triggered');
          fetchChartData(tokenId, timeInterval, false); // Don't show loading for auto-refresh
          clearExpiredCache(); // Clean up expired cache entries
        }
      }, refreshInterval);
    };

    setupRefreshTimer();

    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
        refreshTimer.current = null;
      }
    };
  }, [tokenId, timeInterval, refreshInterval, enableAutoRefresh, fetchChartData]);

  // Initial data fetch when token or interval changes
  useEffect(() => {
    if (!tokenId) return;

    fetchChartData(tokenId, timeInterval, true);
  }, [tokenId, timeInterval, fetchChartData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, []);

  return {
    chartData,
    isLoading,
    error,
    timeInterval,
    setTimeInterval: handleSetTimeInterval,
    refreshData,
    lastUpdated
  };
};
