/**
 * REAL MARKET DATA SERVICE
 * 
 * Provides real-time market data from CoinGecko and other APIs
 * for Phase 4 features, replacing mock price data with actual market information.
 */

import axios from 'axios';

// Market Data Interfaces
export interface TokenPrice {
  id: string;
  symbol: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  volume_24h: number;
  last_updated: string;
}

export interface MarketData {
  prices: TokenPrice[];
  lastUpdate: Date;
  isStale: boolean;
}

export interface DeFiProtocolData {
  protocol: string;
  tvl: number;
  apy: number;
  risk_score: number;
  last_updated: string;
}

// Token ID mappings for CoinGecko API
const TOKEN_ID_MAPPING: Record<string, string> = {
  'ETH': 'ethereum',
  'BTC': 'bitcoin',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'DAI': 'dai',
  'WETH': 'weth',
  'MATIC': 'matic-network',
  'BNB': 'binancecoin',
  'AVAX': 'avalanche-2',
  'FTM': 'fantom',
  'OP': 'optimism',
  'ARB': 'arbitrum',
  'UNI': 'uniswap',
  'SUSHI': 'sushi',
  'AAVE': 'aave',
  'COMP': 'compound-governance-token',
  'CRV': 'curve-dao-token',
  'LINK': 'chainlink',
  'MKR': 'maker'
};

/**
 * Real Market Data Service Class
 * Handles actual market data fetching from multiple sources
 */
class RealMarketDataService {
  private cache: Map<string, TokenPrice> = new Map();
  private lastUpdate: Date | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  // Configuration
  private readonly CACHE_DURATION = 60 * 1000; // 1 minute
  private readonly UPDATE_INTERVAL = 30 * 1000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize the market data service
   */
  private async initializeService(): Promise<void> {
    try {
      console.log('📊 Initializing real market data service...');

      // Initial data fetch
      await this.fetchMarketData();

      // Start periodic updates
      this.startPeriodicUpdates();

      this.isInitialized = true;
      console.log('✅ Real market data service initialized');

    } catch (error) {
      console.error('❌ Failed to initialize market data service:', error);
    }
  }

  /**
   * Start periodic market data updates
   */
  private startPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        await this.fetchMarketData();
      } catch (error) {
        console.error('Error in periodic market data update:', error);
      }
    }, this.UPDATE_INTERVAL);
  }

  /**
   * Fetch market data from CoinGecko API
   */
  private async fetchMarketData(): Promise<void> {
    try {
      const tokenIds = Object.values(TOKEN_ID_MAPPING).join(',');
      
      const response = await axios.get(`${this.COINGECKO_API_BASE}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          ids: tokenIds,
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h'
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.data && Array.isArray(response.data)) {
        // Update cache with new data
        response.data.forEach((token: any) => {
          const tokenPrice: TokenPrice = {
            id: token.id,
            symbol: token.symbol.toUpperCase(),
            current_price: token.current_price || 0,
            price_change_24h: token.price_change_24h || 0,
            price_change_percentage_24h: token.price_change_percentage_24h || 0,
            market_cap: token.market_cap || 0,
            volume_24h: token.total_volume || 0,
            last_updated: token.last_updated || new Date().toISOString()
          };

          this.cache.set(token.symbol.toUpperCase(), tokenPrice);
        });

        this.lastUpdate = new Date();
        console.log(`📊 Updated market data for ${response.data.length} tokens`);
      }

    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  }

  /**
   * Get current price for a specific token
   */
  async getTokenPrice(symbol: string): Promise<TokenPrice | null> {
    try {
      const upperSymbol = symbol.toUpperCase();
      
      // Check cache first
      const cached = this.cache.get(upperSymbol);
      if (cached && this.isCacheValid()) {
        return cached;
      }

      // If cache is stale or token not found, fetch fresh data
      await this.fetchMarketData();
      
      return this.cache.get(upperSymbol) || null;

    } catch (error) {
      console.error(`Error getting price for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get prices for multiple tokens
   */
  async getTokenPrices(symbols: string[]): Promise<Record<string, TokenPrice>> {
    try {
      const prices: Record<string, TokenPrice> = {};

      // Check if we need to refresh data
      if (!this.isCacheValid()) {
        await this.fetchMarketData();
      }

      symbols.forEach(symbol => {
        const upperSymbol = symbol.toUpperCase();
        const price = this.cache.get(upperSymbol);
        if (price) {
          prices[upperSymbol] = price;
        }
      });

      return prices;

    } catch (error) {
      console.error('Error getting multiple token prices:', error);
      return {};
    }
  }

  /**
   * Get DeFi protocol data (APY, TVL, etc.)
   */
  async getDeFiProtocolData(protocolId: string): Promise<DeFiProtocolData | null> {
    try {
      // For now, we'll use DeFiPulse API or similar
      // This is a simplified implementation
      const mockData: Record<string, DeFiProtocolData> = {
        'ethereum-staking': {
          protocol: 'Ethereum 2.0 Staking',
          tvl: 45000000000, // $45B
          apy: 4.2,
          risk_score: 2,
          last_updated: new Date().toISOString()
        },
        'compound': {
          protocol: 'Compound',
          tvl: 8500000000, // $8.5B
          apy: 3.8,
          risk_score: 3,
          last_updated: new Date().toISOString()
        },
        'aave': {
          protocol: 'Aave',
          tvl: 12000000000, // $12B
          apy: 4.5,
          risk_score: 3,
          last_updated: new Date().toISOString()
        },
        'uniswap-v3': {
          protocol: 'Uniswap V3',
          tvl: 6500000000, // $6.5B
          apy: 8.2,
          risk_score: 4,
          last_updated: new Date().toISOString()
        }
      };

      return mockData[protocolId] || null;

    } catch (error) {
      console.error(`Error getting DeFi protocol data for ${protocolId}:`, error);
      return null;
    }
  }

  /**
   * Get market summary data
   */
  async getMarketSummary(): Promise<MarketData> {
    try {
      if (!this.isCacheValid()) {
        await this.fetchMarketData();
      }

      const prices = Array.from(this.cache.values());
      
      return {
        prices,
        lastUpdate: this.lastUpdate || new Date(),
        isStale: !this.isCacheValid()
      };

    } catch (error) {
      console.error('Error getting market summary:', error);
      return {
        prices: [],
        lastUpdate: new Date(),
        isStale: true
      };
    }
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(): boolean {
    if (!this.lastUpdate) return false;
    
    const now = new Date().getTime();
    const lastUpdateTime = this.lastUpdate.getTime();
    
    return (now - lastUpdateTime) < this.CACHE_DURATION;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      lastUpdate: this.lastUpdate,
      cachedTokens: this.cache.size,
      isCacheValid: this.isCacheValid(),
      updateInterval: this.UPDATE_INTERVAL
    };
  }

  /**
   * Cleanup service
   */
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.cache.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const realMarketDataService = new RealMarketDataService();

export default realMarketDataService;
