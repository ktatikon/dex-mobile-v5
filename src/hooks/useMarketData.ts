import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchTokenList, adaptCoinGeckoData } from '@/services/realTimeData';
import { Token } from '@/types';
import { MarketFilterType, AltFilterType, CoinGeckoToken } from '@/types/api';

/**
 * Enhanced hook for fetching and managing market data with improved stability
 */
export function useMarketData(vsCurrency = 'usd') {
  // State for data and UI
  const [rawData, setRawData] = useState<CoinGeckoToken[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<MarketFilterType>('all');
  const [altFilter, setAltFilter] = useState<AltFilterType>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Refs to prevent state updates after unmount and track fetch status
  const isMounted = useRef(true);
  const isRefreshing = useRef(false);
  const fetchCount = useRef(0);

  // Fetch data function with enhanced error handling
  const fetchData = useCallback(async (showLoading = true) => {
    // Prevent concurrent fetches
    if (isRefreshing.current) {
      console.log('Fetch already in progress, skipping');
      return;
    }

    isRefreshing.current = true;
    fetchCount.current += 1;
    const currentFetchId = fetchCount.current;

    if (showLoading && isMounted.current) {
      setLoading(true);
    }

    try {
      console.log(`Starting fetch #${currentFetchId} for market data`);
      const result = await fetchTokenList(vsCurrency);

      // Only update state if this is the most recent fetch and component is still mounted
      if (currentFetchId === fetchCount.current && isMounted.current) {
        console.log(`Fetch #${currentFetchId} completed successfully`);
        setRawData(result);
        setLastUpdated(new Date());
        setError(null);
      } else {
        console.log(`Fetch #${currentFetchId} completed but was superseded or component unmounted`);
      }
    } catch (err) {
      console.error(`Error in fetch #${currentFetchId}:`, err);

      // Only update error state if this is the most recent fetch and component is still mounted
      if (currentFetchId === fetchCount.current && isMounted.current) {
        setError(err instanceof Error ? err : new Error('Unknown error fetching market data'));
        // Don't clear existing data on error to allow continued use of stale data
      }
    } finally {
      isRefreshing.current = false;

      if (showLoading && isMounted.current) {
        setLoading(false);
      }
    }
  }, [vsCurrency]);

  // Initial data fetch and refresh interval
  useEffect(() => {
    // Reset mounted state on each effect run
    isMounted.current = true;

    // Fetch data immediately
    fetchData();

    // Set up refresh interval (5 minutes)
    const interval = setInterval(() => {
      if (isMounted.current && !isRefreshing.current) {
        console.log('Scheduled refresh triggered - 5 minute interval');
        fetchData(false); // Don't show loading state on refresh
      }
    }, 5 * 60 * 1000);

    // Cleanup function
    return () => {
      console.log('useMarketData hook unmounting, cleaning up');
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  // Manual refresh function with debounce
  const refreshData = useCallback(() => {
    if (isRefreshing.current) {
      console.log('Refresh already in progress, skipping manual refresh');
      return;
    }
    console.log('Manual refresh triggered');
    return fetchData(true);
  }, [fetchData]);

  // Apply filters to the data with error handling
  const filteredTokens = useMemo(() => {
    try {
      if (!rawData) return [];

      const adaptedTokens = adaptCoinGeckoData(rawData);

      if (!adaptedTokens || adaptedTokens.length === 0) {
        console.warn('No tokens after adaptation, returning empty array');
        return [];
      }

      // Apply filters
      switch (filter) {
        case 'gainers':
          return adaptedTokens
            .filter(token => (token.priceChange24h || 0) > 0)
            .sort((a, b) => (b.priceChange24h || 0) - (a.priceChange24h || 0));

        case 'losers':
          return adaptedTokens
            .filter(token => (token.priceChange24h || 0) < 0)
            .sort((a, b) => (a.priceChange24h || 0) - (b.priceChange24h || 0));

        case 'inr':
          // This would require additional data from the API
          // For now, just return all tokens
          return adaptedTokens;

        case 'usdt':
          // Tokens paired with USDT
          return adaptedTokens.filter(token =>
            token.symbol !== 'USDT' && token.symbol !== 'USDC');

        case 'btc':
          // Tokens paired with BTC
          return adaptedTokens.filter(token => token.symbol !== 'BTC');

        case 'alts':
          // Apply ALT filter
          if (altFilter === 'all') {
            return adaptedTokens.filter(token =>
              !['BTC', 'ETH', 'USDT'].includes(token.symbol));
          }
          return adaptedTokens.filter(token =>
            token.symbol.toLowerCase() === altFilter.toLowerCase());

        default:
          return adaptedTokens;
      }
    } catch (error) {
      console.error('Error in filteredTokens calculation:', error);
      return [];
    }
  }, [rawData, filter, altFilter]);

  // Sort tokens by market cap (using price as a proxy) with error handling
  const sortedByMarketCap = useMemo(() => {
    try {
      if (!filteredTokens || filteredTokens.length === 0) return [];

      return [...filteredTokens].sort((a, b) => {
        return (b.price || 0) - (a.price || 0);
      });
    } catch (error) {
      console.error('Error in sortedByMarketCap calculation:', error);
      return filteredTokens;
    }
  }, [filteredTokens]);

  // Sort tokens by price change with error handling
  const sortedByPriceChange = useMemo(() => {
    try {
      if (!filteredTokens || filteredTokens.length === 0) return [];

      return [...filteredTokens].sort((a, b) => {
        return Math.abs(b.priceChange24h || 0) - Math.abs(a.priceChange24h || 0);
      });
    } catch (error) {
      console.error('Error in sortedByPriceChange calculation:', error);
      return filteredTokens;
    }
  }, [filteredTokens]);

  // Return stable object reference
  return useMemo(() => ({
    tokens: filteredTokens,
    sortedByMarketCap,
    sortedByPriceChange,
    loading,
    error,
    filter,
    setFilter,
    altFilter,
    setAltFilter,
    refreshData,
    lastUpdated
  }), [
    filteredTokens,
    sortedByMarketCap,
    sortedByPriceChange,
    loading,
    error,
    filter,
    setFilter,
    altFilter,
    setAltFilter,
    refreshData,
    lastUpdated
  ]);
}
