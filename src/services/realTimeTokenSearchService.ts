/**
 * REAL-TIME TOKEN SEARCH SERVICE
 * 
 * Provides real-time token search functionality with external API integration,
 * caching strategies, and comprehensive error handling for enterprise-grade
 * token discovery and validation.
 */

import { Token } from '@/types';
import { fetchTokenList } from '@/services/realTimeData';
import { supabase } from '@/integrations/supabase/client';

// Search interfaces
export interface TokenSearchResult {
  id: string;
  symbol: string;
  name: string;
  logo?: string;
  price: number;
  marketCap?: number;
  contractAddress?: string;
  network: string;
  verified: boolean;
  source: 'api' | 'database' | 'cache';
}

export interface TokenSearchOptions {
  query: string;
  network?: string;
  limit?: number;
  includeUnverified?: boolean;
  searchType?: 'symbol' | 'name' | 'address' | 'all';
}

export interface TokenSearchResponse {
  results: TokenSearchResult[];
  totalCount: number;
  searchTime: number;
  source: 'api' | 'database' | 'cache' | 'mixed';
  hasMore: boolean;
}

// Cache configuration
const SEARCH_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const POPULAR_TOKENS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const MAX_SEARCH_RESULTS = 50;
const MIN_QUERY_LENGTH = 2;

// Rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_SEARCHES_PER_MINUTE = 30;
let searchCount = 0;
let rateLimitWindowStart = Date.now();

// Cache storage
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class TokenSearchCache {
  private memoryCache: Map<string, CacheEntry<TokenSearchResponse>> = new Map();
  private popularTokensCache: Map<string, CacheEntry<TokenSearchResult[]>> = new Map();

  set(key: string, data: TokenSearchResponse, duration: number = SEARCH_CACHE_DURATION): void {
    const now = Date.now();
    this.memoryCache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + duration
    });

    // Cleanup old entries periodically
    if (this.memoryCache.size > 100) {
      this.cleanup();
    }
  }

  get(key: string): TokenSearchResponse | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data;
  }

  setPopularTokens(network: string, tokens: TokenSearchResult[]): void {
    const now = Date.now();
    this.popularTokensCache.set(network, {
      data: tokens,
      timestamp: now,
      expiresAt: now + POPULAR_TOKENS_CACHE_DURATION
    });
  }

  getPopularTokens(network: string): TokenSearchResult[] | null {
    const entry = this.popularTokensCache.get(network);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.popularTokensCache.delete(network);
      return null;
    }

    return entry.data;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiresAt) {
        this.memoryCache.delete(key);
      }
    }
  }

  clear(): void {
    this.memoryCache.clear();
    this.popularTokensCache.clear();
  }
}

// Initialize cache
const searchCache = new TokenSearchCache();

/**
 * Check rate limiting for search requests
 */
function checkSearchRateLimit(): boolean {
  const now = Date.now();
  
  // Reset window if needed
  if (now - rateLimitWindowStart > RATE_LIMIT_WINDOW) {
    searchCount = 0;
    rateLimitWindowStart = now;
  }
  
  if (searchCount >= MAX_SEARCHES_PER_MINUTE) {
    console.warn('Search rate limit exceeded');
    return false;
  }
  
  searchCount++;
  return true;
}

/**
 * Validate Ethereum contract address format
 */
function isValidContractAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Search tokens from database
 */
async function searchTokensFromDatabase(options: TokenSearchOptions): Promise<TokenSearchResult[]> {
  try {
    const { query, network, limit = MAX_SEARCH_RESULTS } = options;
    
    let dbQuery = supabase
      .from('tokens')
      .select('*')
      .limit(limit);

    // Apply search filters
    if (options.searchType === 'address' && isValidContractAddress(query)) {
      dbQuery = dbQuery.eq('contract_address', query.toLowerCase());
    } else {
      // Search by symbol or name
      dbQuery = dbQuery.or(
        `symbol.ilike.%${query}%,name.ilike.%${query}%`
      );
    }

    if (network) {
      dbQuery = dbQuery.eq('network', network);
    }

    const { data: tokens, error } = await dbQuery;

    if (error) {
      console.error('Database search error:', error);
      return [];
    }

    return (tokens || []).map(token => ({
      id: token.id,
      symbol: token.symbol,
      name: token.name,
      logo: token.logo,
      price: token.price || 0,
      marketCap: token.market_cap,
      contractAddress: token.contract_address,
      network: token.network || 'ethereum',
      verified: token.verified || false,
      source: 'database' as const
    }));

  } catch (error) {
    console.error('Error searching tokens from database:', error);
    return [];
  }
}

/**
 * Search tokens from external APIs (CoinGecko)
 */
async function searchTokensFromAPI(options: TokenSearchOptions): Promise<TokenSearchResult[]> {
  try {
    const { query, limit = MAX_SEARCH_RESULTS } = options;
    
    // Fetch all tokens from CoinGecko
    const allTokens = await fetchTokenList('usd');
    
    if (!allTokens || !Array.isArray(allTokens)) {
      return [];
    }

    // Filter tokens based on search query
    const filteredTokens = allTokens.filter(token => {
      const searchLower = query.toLowerCase();
      return (
        token.symbol?.toLowerCase().includes(searchLower) ||
        token.name?.toLowerCase().includes(searchLower) ||
        token.id?.toLowerCase().includes(searchLower)
      );
    }).slice(0, limit);

    return filteredTokens.map(token => ({
      id: token.id,
      symbol: token.symbol?.toUpperCase() || '',
      name: token.name || '',
      logo: token.image,
      price: token.current_price || 0,
      marketCap: token.market_cap,
      contractAddress: undefined, // CoinGecko doesn't provide contract addresses in this endpoint
      network: 'ethereum', // Default to ethereum
      verified: true, // CoinGecko tokens are generally verified
      source: 'api' as const
    }));

  } catch (error) {
    console.error('Error searching tokens from API:', error);
    return [];
  }
}

/**
 * Get popular tokens for quick access
 */
async function getPopularTokens(network: string = 'ethereum'): Promise<TokenSearchResult[]> {
  try {
    // Check cache first
    const cached = searchCache.getPopularTokens(network);
    if (cached) {
      return cached;
    }

    // Fetch popular tokens from API
    const popularTokens = await fetchTokenList('usd');
    
    if (!popularTokens || !Array.isArray(popularTokens)) {
      return [];
    }

    // Take top 20 by market cap
    const results = popularTokens.slice(0, 20).map(token => ({
      id: token.id,
      symbol: token.symbol?.toUpperCase() || '',
      name: token.name || '',
      logo: token.image,
      price: token.current_price || 0,
      marketCap: token.market_cap,
      contractAddress: undefined,
      network,
      verified: true,
      source: 'api' as const
    }));

    // Cache the results
    searchCache.setPopularTokens(network, results);
    
    return results;

  } catch (error) {
    console.error('Error fetching popular tokens:', error);
    return [];
  }
}

/**
 * Main token search function with comprehensive fallback strategy
 */
export async function searchTokens(options: TokenSearchOptions): Promise<TokenSearchResponse> {
  const startTime = Date.now();
  const { query, network, limit = MAX_SEARCH_RESULTS } = options;

  try {
    // Validate input
    if (!query || query.length < MIN_QUERY_LENGTH) {
      return {
        results: [],
        totalCount: 0,
        searchTime: Date.now() - startTime,
        source: 'cache',
        hasMore: false
      };
    }

    // Check rate limiting
    if (!checkSearchRateLimit()) {
      // Return cached results if available
      const cacheKey = `${query}_${network || 'all'}_${limit}`;
      const cached = searchCache.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Return empty results if rate limited and no cache
      return {
        results: [],
        totalCount: 0,
        searchTime: Date.now() - startTime,
        source: 'cache',
        hasMore: false
      };
    }

    // Check cache first
    const cacheKey = `${query}_${network || 'all'}_${limit}`;
    const cached = searchCache.get(cacheKey);
    if (cached) {
      console.log('🎯 Token search cache hit:', query);
      return cached;
    }

    console.log('🔍 Searching tokens:', query);

    // Search from multiple sources in parallel
    const [databaseResults, apiResults] = await Promise.allSettled([
      searchTokensFromDatabase(options),
      searchTokensFromAPI(options)
    ]);

    // Combine results
    let allResults: TokenSearchResult[] = [];
    
    if (databaseResults.status === 'fulfilled') {
      allResults.push(...databaseResults.value);
    }
    
    if (apiResults.status === 'fulfilled') {
      // Avoid duplicates by checking if token already exists
      const existingIds = new Set(allResults.map(r => r.id));
      const newApiResults = apiResults.value.filter(r => !existingIds.has(r.id));
      allResults.push(...newApiResults);
    }

    // Sort by relevance and market cap
    allResults.sort((a, b) => {
      // Exact symbol matches first
      const aExactSymbol = a.symbol.toLowerCase() === query.toLowerCase();
      const bExactSymbol = b.symbol.toLowerCase() === query.toLowerCase();
      if (aExactSymbol && !bExactSymbol) return -1;
      if (!aExactSymbol && bExactSymbol) return 1;

      // Then by market cap
      return (b.marketCap || 0) - (a.marketCap || 0);
    });

    // Limit results
    const limitedResults = allResults.slice(0, limit);
    
    const response: TokenSearchResponse = {
      results: limitedResults,
      totalCount: allResults.length,
      searchTime: Date.now() - startTime,
      source: databaseResults.status === 'fulfilled' && apiResults.status === 'fulfilled' ? 'mixed' : 
              databaseResults.status === 'fulfilled' ? 'database' : 'api',
      hasMore: allResults.length > limit
    };

    // Cache the response
    searchCache.set(cacheKey, response);

    console.log(`✅ Token search completed: ${limitedResults.length} results in ${response.searchTime}ms`);
    return response;

  } catch (error) {
    console.error('Error in token search:', error);
    
    return {
      results: [],
      totalCount: 0,
      searchTime: Date.now() - startTime,
      source: 'cache',
      hasMore: false
    };
  }
}

/**
 * Validate token contract on specific network
 */
export async function validateTokenContract(
  contractAddress: string, 
  network: string = 'ethereum'
): Promise<TokenSearchResult | null> {
  try {
    if (!isValidContractAddress(contractAddress)) {
      return null;
    }

    // Search for the token in database first
    const dbResults = await searchTokensFromDatabase({
      query: contractAddress,
      network,
      searchType: 'address',
      limit: 1
    });

    if (dbResults.length > 0) {
      return dbResults[0];
    }

    // If not found in database, this would be where we'd call
    // blockchain APIs to validate the contract and fetch metadata
    console.log(`Token contract ${contractAddress} not found in database for network ${network}`);
    
    return null;

  } catch (error) {
    console.error('Error validating token contract:', error);
    return null;
  }
}

// Export the service
export const realTimeTokenSearchService = {
  searchTokens,
  getPopularTokens,
  validateTokenContract,
  clearCache: () => searchCache.clear()
};
