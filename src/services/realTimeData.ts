import { Token, Transaction, TransactionStatus, TransactionType, WalletInfo } from "@/types";
import { CoinGeckoToken } from "@/types/api";

// API configuration
const COINGECKO_API_KEY = "CG-NChZphXHW5fgeAauutarcXF5";
const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

// Cache management
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Advanced cache implementation with memoization
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  stale: boolean;
}

class CacheManager<T> {
  private memoryCache: Record<string, CacheEntry<T>> = {};
  private storagePrefix: string;
  private cacheDuration: number;

  constructor(storagePrefix: string, cacheDuration: number) {
    this.storagePrefix = storagePrefix;
    this.cacheDuration = cacheDuration;
  }

  // Get data from cache (memory first, then storage)
  get(key: string): T | null {
    const now = Date.now();
    const cacheKey = `${this.storagePrefix}_${key}`;

    // Check memory cache first
    if (this.memoryCache[key] && now - this.memoryCache[key].timestamp < this.cacheDuration) {
      console.log(`Cache hit (memory): ${key} - 5 minute cache duration`);
      return this.memoryCache[key].data;
    }

    // Try storage cache
    try {
      const storedData = sessionStorage.getItem(cacheKey);
      const storedTime = sessionStorage.getItem(`${cacheKey}_time`);

      if (storedData && storedTime) {
        const timestamp = parseInt(storedTime);

        if (now - timestamp < this.cacheDuration) {
          console.log(`Cache hit (storage): ${key}`);
          const data = JSON.parse(storedData) as T;

          // Update memory cache
          this.memoryCache[key] = { data, timestamp, stale: false };

          return data;
        }
      }
    } catch (e) {
      console.warn('Error accessing sessionStorage:', e);
    }

    return null;
  }

  // Set data in cache (both memory and storage)
  set(key: string, data: T): void {
    const now = Date.now();
    const cacheKey = `${this.storagePrefix}_${key}`;

    // Update memory cache
    this.memoryCache[key] = { data, timestamp: now, stale: false };

    // Update storage cache
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
      sessionStorage.setItem(`${cacheKey}_time`, now.toString());
    } catch (e) {
      console.warn('Error writing to sessionStorage:', e);
    }
  }

  // Mark cache as stale but don't remove it
  markStale(key: string): void {
    if (this.memoryCache[key]) {
      this.memoryCache[key].stale = true;
    }
  }

  // Get stale data if available
  getStale(key: string): T | null {
    if (this.memoryCache[key]) {
      return this.memoryCache[key].data;
    }

    // Try storage as last resort
    try {
      const cacheKey = `${this.storagePrefix}_${key}`;
      const storedData = sessionStorage.getItem(cacheKey);

      if (storedData) {
        return JSON.parse(storedData) as T;
      }
    } catch (e) {
      console.warn('Error accessing stale data from sessionStorage:', e);
    }

    return null;
  }
}

// Initialize cache manager
const tokenCache = new CacheManager<CoinGeckoToken[]>('coinGecko', CACHE_DURATION);

// Fallback mock data for when API fails
const FALLBACK_MOCK_DATA: CoinGeckoToken[] = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    image: "/crypto-icons/btc.svg",
    current_price: 56231.42,
    market_cap: 1100000000000,
    market_cap_rank: 1,
    fully_diluted_valuation: 1200000000000,
    total_volume: 25000000000,
    high_24h: 57000,
    low_24h: 55000,
    price_change_24h: 1200,
    price_change_percentage_24h: 2.1,
    market_cap_change_24h: 20000000000,
    market_cap_change_percentage_24h: 1.8,
    circulating_supply: 19000000,
    total_supply: 21000000,
    max_supply: 21000000,
    ath: 69000,
    ath_change_percentage: -18.5,
    ath_date: "2021-11-10T00:00:00.000Z",
    atl: 67.81,
    atl_change_percentage: 82900.45,
    atl_date: "2013-07-06T00:00:00.000Z",
    last_updated: new Date().toISOString()
  },
  {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    image: "/crypto-icons/eth.svg",
    current_price: 2845.23,
    market_cap: 340000000000,
    market_cap_rank: 2,
    fully_diluted_valuation: 340000000000,
    total_volume: 15000000000,
    high_24h: 2900,
    low_24h: 2800,
    price_change_24h: 100,
    price_change_percentage_24h: 3.5,
    market_cap_change_24h: 10000000000,
    market_cap_change_percentage_24h: 3.0,
    circulating_supply: 120000000,
    total_supply: 120000000,
    max_supply: null,
    ath: 4878.26,
    ath_change_percentage: -41.7,
    ath_date: "2021-11-10T00:00:00.000Z",
    atl: 0.432979,
    atl_change_percentage: 656789.45,
    atl_date: "2015-10-20T00:00:00.000Z",
    last_updated: new Date().toISOString()
  },
  {
    id: "tether",
    symbol: "usdt",
    name: "Tether",
    image: "/crypto-icons/usdt.svg",
    current_price: 1.0,
    market_cap: 83000000000,
    market_cap_rank: 3,
    fully_diluted_valuation: 83000000000,
    total_volume: 40000000000,
    high_24h: 1.01,
    low_24h: 0.99,
    price_change_24h: 0,
    price_change_percentage_24h: 0.0,
    market_cap_change_24h: 0,
    market_cap_change_percentage_24h: 0.0,
    circulating_supply: 83000000000,
    total_supply: 83000000000,
    max_supply: null,
    ath: 1.32,
    ath_change_percentage: -24.3,
    ath_date: "2018-07-24T00:00:00.000Z",
    atl: 0.572521,
    atl_change_percentage: 74.7,
    atl_date: "2015-03-02T00:00:00.000Z",
    last_updated: new Date().toISOString()
  }
];

/**
 * Memoized fetch function with retry logic
 */
const memoizedFetch = (() => {
  const cache: Record<string, Promise<Response>> = {};

  return (url: string, options: RequestInit, retries: number = 3, delay: number = 1000): Promise<Response> => {
    const cacheKey = `${url}:${JSON.stringify(options)}`;

    if (!cache[cacheKey]) {
      // Implement retry logic
      const fetchWithRetry = async (retriesLeft: number, currentDelay: number): Promise<Response> => {
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            throw new Error(`API error: ${response.status} - ${response.statusText}`);
          }
          return response;
        } catch (error) {
          if (retriesLeft <= 1) throw error;

          console.log(`Retrying fetch in ${currentDelay}ms... (${retriesLeft-1} retries left)`);
          await new Promise(resolve => setTimeout(resolve, currentDelay));

          return fetchWithRetry(retriesLeft - 1, currentDelay * 2);
        }
      };

      // Store the promise in cache
      cache[cacheKey] = fetchWithRetry(retries, delay)
        .catch(error => {
          // Remove failed requests from cache
          delete cache[cacheKey];
          throw error;
        });
    }

    return cache[cacheKey];
  };
})();

/**
 * Enhanced Dynamic Programming approach for fetching data with memoization and stability
 */
class DataFetcher {
  private cache: Map<string, { data: any, timestamp: number, isValid: boolean }> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private cacheDuration: number;
  private fallbackData: any;
  private debugMode: boolean;

  constructor(cacheDuration: number, fallbackData: any, debugMode = true) {
    this.cacheDuration = cacheDuration;
    this.fallbackData = this.validateAndCloneData(fallbackData);
    this.debugMode = debugMode;

    // Preload fallback data into cache to ensure we always have something to show
    this.preload('fallback', this.fallbackData);

    this.log('DataFetcher initialized with fallback data');
  }

  /**
   * Memoized fetch function that caches results and deduplicates in-flight requests
   */
  async fetch(url: string, options: RequestInit, cacheKey?: string): Promise<any> {
    const key = cacheKey || url;
    const now = Date.now();

    try {
      // Check if we have a valid cached result
      const cachedResult = this.cache.get(key);
      if (cachedResult && cachedResult.isValid && now - cachedResult.timestamp < this.cacheDuration) {
        this.log(`Cache hit for ${key}`);
        return this.validateAndCloneData(cachedResult.data);
      }

      // Check if there's already a pending request for this URL
      if (this.pendingRequests.has(key)) {
        this.log(`Reusing in-flight request for ${key}`);
        try {
          return await this.pendingRequests.get(key);
        } catch (error) {
          this.log(`In-flight request for ${key} failed, falling back to cache or default data`);
          // Continue to fallback mechanisms
        }
      }

      // Create a new request and store it
      const fetchPromise = this.doFetchWithRetries(url, options)
        .then(data => {
          const validatedData = this.validateAndCloneData(data);
          // Store successful result in cache
          this.cache.set(key, {
            data: validatedData,
            timestamp: Date.now(),
            isValid: true
          });
          // Remove from pending requests
          this.pendingRequests.delete(key);
          return validatedData;
        })
        .catch(error => {
          // Remove from pending requests on error
          this.pendingRequests.delete(key);
          throw error;
        });

      // Store the pending request
      this.pendingRequests.set(key, fetchPromise);

      try {
        return await fetchPromise;
      } catch (error) {
        this.logError(`Failed to fetch ${url}:`, error);

        // Try to use stale cache data if available
        if (cachedResult && cachedResult.isValid) {
          this.log(`Using stale cached data for ${key}`);
          return this.validateAndCloneData(cachedResult.data);
        }

        // Return fallback data as last resort
        this.log(`Using fallback data for ${key}`);
        return this.validateAndCloneData(this.fallbackData);
      }
    } catch (outerError) {
      // Catch any unexpected errors in our fetch logic
      this.logError(`Unexpected error in fetch logic:`, outerError);
      return this.validateAndCloneData(this.fallbackData);
    }
  }

  /**
   * Helper method to perform fetch with retries
   */
  private async doFetchWithRetries(url: string, options: RequestInit, maxRetries = 3): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          this.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`API error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        this.logError(`Attempt ${attempt + 1} failed:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));

        // Continue to next retry
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error('All fetch attempts failed');
  }

  /**
   * Validate and deep clone data to prevent mutation issues
   */
  private validateAndCloneData(data: any): any {
    try {
      // First, check if data is valid
      if (data === undefined || data === null) {
        this.logError('Invalid data received (null or undefined)', new Error('Invalid data'));
        return this.fallbackData;
      }

      // For arrays, ensure they're not empty and all items are valid
      if (Array.isArray(data)) {
        if (data.length === 0) {
          this.log('Empty array received, using fallback data');
          return this.fallbackData;
        }

        // Deep clone the array to prevent mutation issues
        return JSON.parse(JSON.stringify(data));
      }

      // For objects, ensure they have expected properties
      if (typeof data === 'object') {
        // Deep clone the object to prevent mutation issues
        return JSON.parse(JSON.stringify(data));
      }

      // For primitive types, return as is
      return data;
    } catch (error) {
      this.logError('Error validating data:', error);
      return this.fallbackData;
    }
  }

  /**
   * Preload data into cache
   */
  preload(key: string, data: any): void {
    const validatedData = this.validateAndCloneData(data);
    this.cache.set(key, {
      data: validatedData,
      timestamp: Date.now(),
      isValid: true
    });
    this.log(`Preloaded data for key: ${key}`);
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
    this.log('Cache cleared');
  }

  /**
   * Logging helper with debug mode check
   */
  private log(message: string): void {
    if (this.debugMode) {
      console.log(`[DataFetcher] ${message}`);
    }
  }

  /**
   * Error logging helper
   */
  private logError(message: string, error: any): void {
    console.error(`[DataFetcher] ${message}`, error);
  }
}

// Initialize the data fetcher with fallback data
const dataFetcher = new DataFetcher(CACHE_DURATION, FALLBACK_MOCK_DATA);

/**
 * Fetches token list from CoinGecko API with enhanced dynamic programming approach
 */
export async function fetchTokenList(vsCurrency = 'usd'): Promise<CoinGeckoToken[]> {
  try {
    // Prepare API request
    const url = new URL(`${COINGECKO_BASE_URL}/coins/markets`);
    url.searchParams.append('vs_currency', vsCurrency);
    url.searchParams.append('order', 'market_cap_desc');
    url.searchParams.append('per_page', '100'); // Reduced to 100 for better performance
    url.searchParams.append('page', '1');
    url.searchParams.append('sparkline', 'false');

    const apiUrl = url.toString();
    const options = {
      headers: {
        'x-cg-api-key': COINGECKO_API_KEY
      }
    };

    console.log('Fetching market data with enhanced dynamic programming approach - 5 minute refresh rate');

    // Use the data fetcher with memoization
    const cacheKey = `coinGecko_${vsCurrency}`;
    const result = await dataFetcher.fetch(apiUrl, options, cacheKey);

    // Validate the result before returning
    if (!result || !Array.isArray(result) || result.length === 0) {
      console.warn('Invalid or empty result from API, using fallback data');
      return FALLBACK_MOCK_DATA;
    }

    return result;
  } catch (error) {
    console.error('Unexpected error in fetchTokenList:', error);
    return FALLBACK_MOCK_DATA;
  }
}

/**
 * Adapts CoinGecko data to our Token interface with enhanced error handling
 */
export function adaptCoinGeckoData(coingeckoData: CoinGeckoToken[]): Token[] {
  try {
    // Validate input
    if (!coingeckoData || !Array.isArray(coingeckoData)) {
      console.error('Invalid data passed to adaptCoinGeckoData:', coingeckoData);
      return FALLBACK_MOCK_DATA.map(mockCoin => createTokenFromMockData(mockCoin));
    }

    // Process each coin with error handling
    return coingeckoData.map((coin) => {
      try {
        // Validate coin data
        if (!coin || typeof coin !== 'object') {
          console.warn('Invalid coin data:', coin);
          return createDefaultToken();
        }

        // Find appropriate icon or use a placeholder
        const symbol = (coin.symbol || 'unknown').toLowerCase();
        let logo = `/assets/icons/${symbol}.svg`;

        // Fallback to placeholder if icon might not exist
        const commonSymbols = ['btc', 'eth', 'usdt', 'usdc', 'bnb', 'xrp', 'sol', 'ada'];
        if (!commonSymbols.includes(symbol)) {
          // Try to use the image from CoinGecko first
          logo = coin.image || '/assets/icons/placeholder.svg';
        }

        // Ensure all required fields are present and have valid values
        return {
          id: coin.id || `token-${Math.random().toString(36).substring(2, 9)}`,
          symbol: (coin.symbol || 'UNKNOWN').toUpperCase(),
          name: coin.name || (coin.symbol || 'Unknown').toUpperCase(),
          logo: logo,
          decimals: 8, // Default decimals
          balance: "0", // Default balance
          price: typeof coin.current_price === 'number' ? coin.current_price : 0,
          priceChange24h: typeof coin.price_change_percentage_24h === 'number' ? coin.price_change_percentage_24h : 0,
        };
      } catch (coinError) {
        console.error('Error processing coin:', coinError);
        return createDefaultToken();
      }
    }).filter(token => token !== null); // Filter out any null tokens
  } catch (error) {
    console.error('Error in adaptCoinGeckoData:', error);
    return FALLBACK_MOCK_DATA.map(mockCoin => createTokenFromMockData(mockCoin));
  }
}

/**
 * Creates a token from mock data
 */
function createTokenFromMockData(mockCoin: CoinGeckoToken): Token {
  return {
    id: mockCoin.id,
    symbol: mockCoin.symbol.toUpperCase(),
    name: mockCoin.name,
    logo: mockCoin.image,
    decimals: 8,
    balance: "0",
    price: mockCoin.current_price,
    priceChange24h: mockCoin.price_change_percentage_24h || 0,
  };
}

/**
 * Creates a default token when data is invalid
 */
function createDefaultToken(): Token {
  return {
    id: `token-${Math.random().toString(36).substring(2, 9)}`,
    symbol: 'UNKNOWN',
    name: 'Unknown Token',
    logo: '/assets/icons/placeholder.svg',
    decimals: 8,
    balance: "0",
    price: 0,
    priceChange24h: 0,
  };
}

// Mock transactions (keeping this from original mockData.ts)
export const mockTransactions: Transaction[] = [
  // ... (keeping the same mock transactions as before)
];

// Helper to calculate total balance
export const calculateTotalBalance = (tokens: Token[]): number => {
  return tokens.reduce((acc, token) => {
    return acc + (parseFloat(token.balance || "0") * (token.price || 0));
  }, 0);
};

// Helper to format currency with proper commas and decimal places
export const formatCurrency = (value: number, decimals = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

// Helper to format an address with ellipsis
export const formatAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  const start = address.substring(0, 6);
  const end = address.substring(address.length - 4);
  return `${start}...${end}`;
};

// Order book entry type
export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

// Generate mock order book data
export const generateOrderBook = (basePrice: number, spread = 0.02): { bids: OrderBookEntry[], asks: OrderBookEntry[] } => {
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];

  // Calculate bid/ask prices with spread
  const bidPrice = basePrice * (1 - spread / 2);
  const askPrice = basePrice * (1 + spread / 2);

  // Generate 15 bid entries (buy orders)
  let bidTotal = 0;
  for (let i = 0; i < 15; i++) {
    // Price decreases as we go down the order book for bids
    const price = bidPrice * (1 - 0.001 * i);
    // Random amount between 0.1 and 5 for BTC-like assets
    const amount = 0.1 + Math.random() * 4.9;
    bidTotal += amount;

    bids.push({
      price,
      amount,
      total: bidTotal
    });
  }

  // Generate 15 ask entries (sell orders)
  let askTotal = 0;
  for (let i = 0; i < 15; i++) {
    // Price increases as we go up the order book for asks
    const price = askPrice * (1 + 0.001 * i);
    // Random amount between 0.1 and 5
    const amount = 0.1 + Math.random() * 4.9;
    askTotal += amount;

    asks.push({
      price,
      amount,
      total: askTotal
    });
  }

  return { bids, asks };
};

// Recent trade type
export interface RecentTrade {
  id: string;
  price: number;
  amount: number;
  value: number;
  time: Date;
  type: 'buy' | 'sell';
}

// Generate mock recent trades
export const generateRecentTrades = (basePrice: number, count = 20): RecentTrade[] => {
  const trades: RecentTrade[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    // Random price variation around base price (±1%)
    const priceVariation = basePrice * (0.99 + Math.random() * 0.02);
    // Random amount between 0.01 and 2
    const amount = 0.01 + Math.random() * 1.99;
    // Random time in the last hour
    const time = new Date(now.getTime() - Math.random() * 60 * 60 * 1000);
    // Random type (buy or sell)
    const type = Math.random() > 0.5 ? 'buy' : 'sell';

    trades.push({
      id: `trade-${i}`,
      price: priceVariation,
      amount,
      value: priceVariation * amount,
      time,
      type
    });
  }

  // Sort by time (most recent first)
  return trades.sort((a, b) => b.time.getTime() - a.time.getTime());
};
