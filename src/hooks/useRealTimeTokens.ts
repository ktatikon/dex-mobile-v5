import { useState, useEffect, useCallback, useRef } from 'react';
import { Token } from '@/types';
import { realTimeDataManager } from '@/services/realTimeDataManager';

interface UseRealTimeTokensOptions {
  autoRefresh?: boolean;
  refreshOnMount?: boolean;
  filterBySymbols?: string[];
  sortBy?: 'marketCap' | 'priceChange' | 'name' | 'price';
  sortOrder?: 'asc' | 'desc';
}

interface UseRealTimeTokensReturn {
  tokens: Token[];
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  isStale: boolean;
  refreshData: () => Promise<void>;
  getToken: (id: string) => Token | undefined;
  status: {
    isRefreshing: boolean;
    tokenCount: number;
    subscriberCount: number;
  };
}

/**
 * Hook for accessing real-time token data with automatic updates
 */
export function useRealTimeTokens(options: UseRealTimeTokensOptions = {}): UseRealTimeTokensReturn {
  const {
    autoRefresh = true,
    refreshOnMount = true,
    filterBySymbols,
    sortBy = 'marketCap',
    sortOrder = 'desc'
  } = options;

  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const isMounted = useRef(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Handle data updates from the manager
  const handleDataUpdate = useCallback((newTokens: Token[]) => {
    if (!isMounted.current) return;

    try {
      let processedTokens = [...newTokens];

      // Apply symbol filter if specified
      if (filterBySymbols && filterBySymbols.length > 0) {
        processedTokens = processedTokens.filter(token =>
          filterBySymbols.includes(token.symbol.toUpperCase())
        );
      }

      // Apply sorting
      processedTokens.sort((a, b) => {
        let aValue: number;
        let bValue: number;

        switch (sortBy) {
          case 'marketCap':
            // Estimate market cap using price (not perfect but reasonable for sorting)
            aValue = (a.price || 0) * 1000000; // Simplified market cap estimation
            bValue = (b.price || 0) * 1000000;
            break;
          case 'priceChange':
            aValue = a.priceChange24h || 0;
            bValue = b.priceChange24h || 0;
            break;
          case 'price':
            aValue = a.price || 0;
            bValue = b.price || 0;
            break;
          case 'name':
            return sortOrder === 'asc' 
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name);
          default:
            aValue = 0;
            bValue = 0;
        }

        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });

      setTokens(processedTokens);
      setLastUpdated(realTimeDataManager.getLastUpdate());
      setError(null);
      setLoading(false);

      console.log(`Updated ${processedTokens.length} tokens in useRealTimeTokens hook`);
    } catch (err) {
      console.error('Error processing token data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error processing tokens'));
      setLoading(false);
    }
  }, [filterBySymbols, sortBy, sortOrder]);

  // Manual refresh function
  const refreshData = useCallback(async () => {
    if (!isMounted.current) return;

    setLoading(true);
    setError(null);

    try {
      const success = await realTimeDataManager.forceRefresh();
      if (!success) {
        throw new Error('Failed to refresh data');
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh data'));
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // Get specific token by ID
  const getToken = useCallback((id: string): Token | undefined => {
    return tokens.find(token => token.id === id);
  }, [tokens]);

  // Get manager status
  const status = realTimeDataManager.getStatus();

  // Check if data is stale
  const isStale = realTimeDataManager.isDataStale();

  // Setup subscription and initial data load
  useEffect(() => {
    if (!autoRefresh) return;

    console.log('Setting up real-time token subscription');

    // Subscribe to data updates
    unsubscribeRef.current = realTimeDataManager.subscribe(handleDataUpdate);

    // Initial data load if needed
    if (refreshOnMount) {
      const currentTokens = realTimeDataManager.getTokens();
      if (currentTokens.length > 0) {
        handleDataUpdate(currentTokens);
      } else {
        // No data available, trigger refresh
        refreshData();
      }
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [autoRefresh, refreshOnMount, handleDataUpdate, refreshData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    tokens,
    loading,
    error,
    lastUpdated,
    isStale,
    refreshData,
    getToken,
    status
  };
}

/**
 * Hook for getting a specific token by ID with real-time updates
 */
export function useRealTimeToken(tokenId: string): {
  token: Token | undefined;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
} {
  const { tokens, loading, error, lastUpdated } = useRealTimeTokens({
    autoRefresh: true,
    refreshOnMount: true
  });

  const token = tokens.find(t => t.id === tokenId);

  return {
    token,
    loading,
    error,
    lastUpdated
  };
}

/**
 * Hook for getting tokens by symbols with real-time updates
 */
export function useRealTimeTokensBySymbols(symbols: string[]): {
  tokens: Token[];
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
} {
  return useRealTimeTokens({
    autoRefresh: true,
    refreshOnMount: true,
    filterBySymbols: symbols
  });
}
