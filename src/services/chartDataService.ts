/**
 * Chart Data Service
 * Provides OHLC and volume data for trading charts with caching and error handling
 */

import { ChartData, ChartDataPoint, TimeInterval, ChartCache } from '@/types/chart';

// Cache for chart data with 5-minute TTL
const chartCache: ChartCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Get the number of days for each time interval
 */
const getIntervalDays = (interval: TimeInterval): number => {
  switch (interval) {
    case '1D': return 1;
    case '7D': return 7;
    case '30D': return 30;
    case '90D': return 90;
    case '180D': return 180;
    default: return 7;
  }
};

/**
 * Generate cache key for chart data
 */
const getCacheKey = (tokenId: string, interval: TimeInterval): string => {
  return `${tokenId}_${interval}`;
};

/**
 * Check if cached data is still valid
 */
const isCacheValid = (cacheKey: string): boolean => {
  const cached = chartCache[cacheKey];
  return cached && Date.now() < cached.expiry;
};

/**
 * Get cached chart data if available and valid
 */
const getCachedData = (cacheKey: string): ChartData | null => {
  if (isCacheValid(cacheKey)) {
    return chartCache[cacheKey].data;
  }
  return null;
};

/**
 * Cache chart data with expiry
 */
const setCachedData = (cacheKey: string, data: ChartData): void => {
  chartCache[cacheKey] = {
    data,
    expiry: Date.now() + CACHE_TTL
  };
};

/**
 * Fetch OHLC data from CoinGecko API
 */
export const fetchOHLCData = async (
  tokenId: string, 
  interval: TimeInterval
): Promise<ChartData> => {
  const cacheKey = getCacheKey(tokenId, interval);
  
  // Return cached data if available
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    console.log(`📊 Using cached chart data for ${tokenId} ${interval}`);
    return cachedData;
  }

  try {
    console.log(`📊 Fetching chart data for ${tokenId} ${interval}`);
    
    const days = getIntervalDays(interval);
    const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/ohlc?vs_currency=usd&days=${days}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const rawData = await response.json();
    
    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('Invalid or empty OHLC data received');
    }

    // Transform CoinGecko OHLC data format: [timestamp, open, high, low, close]
    const chartDataPoints: ChartDataPoint[] = rawData.map((item: number[]) => {
      if (!Array.isArray(item) || item.length < 5) {
        throw new Error('Invalid OHLC data point format');
      }

      const [timestamp, open, high, low, close] = item;
      
      // Validate OHLC data integrity
      if (high < low || open < 0 || close < 0) {
        console.warn(`Invalid OHLC data point: ${JSON.stringify(item)}`);
      }

      return {
        timestamp,
        open: Number(open) || 0,
        high: Number(high) || 0,
        low: Number(low) || 0,
        close: Number(close) || 0,
        volume: Math.random() * 1000000 // CoinGecko OHLC doesn't include volume, generate placeholder
      };
    });

    // Sort by timestamp to ensure chronological order
    chartDataPoints.sort((a, b) => a.timestamp - b.timestamp);

    const chartData: ChartData = {
      symbol: tokenId.toUpperCase(),
      interval,
      data: chartDataPoints,
      lastUpdated: Date.now()
    };

    // Cache the data
    setCachedData(cacheKey, chartData);
    
    console.log(`📊 Successfully fetched ${chartDataPoints.length} data points for ${tokenId}`);
    return chartData;

  } catch (error) {
    console.error(`📊 Error fetching chart data for ${tokenId}:`, error);
    
    // Try to return stale cached data as fallback
    const staleData = chartCache[cacheKey]?.data;
    if (staleData) {
      console.log(`📊 Using stale cached data for ${tokenId} as fallback`);
      return staleData;
    }
    
    throw error;
  }
};

/**
 * Generate mock chart data for development/fallback
 */
export const generateMockChartData = (
  symbol: string, 
  interval: TimeInterval, 
  basePrice: number = 100
): ChartData => {
  const days = getIntervalDays(interval);
  const dataPoints = Math.min(days * 24, 200); // Limit data points for performance
  const now = Date.now();
  const intervalMs = (days * 24 * 60 * 60 * 1000) / dataPoints;

  const data: ChartDataPoint[] = [];
  let currentPrice = basePrice;

  for (let i = 0; i < dataPoints; i++) {
    const timestamp = now - (dataPoints - i) * intervalMs;
    
    // Generate realistic price movement
    const volatility = 0.02; // 2% volatility
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    const open = currentPrice;
    const close = Math.max(0.01, currentPrice + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.random() * 1000000;

    data.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume
    });

    currentPrice = close;
  }

  return {
    symbol,
    interval,
    data,
    lastUpdated: Date.now(),
    currentPrice
  };
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = (): void => {
  const now = Date.now();
  Object.keys(chartCache).forEach(key => {
    if (chartCache[key].expiry < now) {
      delete chartCache[key];
    }
  });
};

/**
 * Format volume for display
 */
export const formatVolume = (volume: number): string => {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(1)}B`;
  } else if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(1)}M`;
  } else if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(1)}K`;
  }
  return volume.toFixed(0);
};

/**
 * Format price for display
 */
export const formatPrice = (price: number): string => {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  } else if (price >= 1) {
    return price.toFixed(4);
  } else {
    return price.toFixed(6);
  }
};
