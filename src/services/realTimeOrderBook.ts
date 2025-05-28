import { OrderBookEntry, RecentTrade } from '@/services/realTimeData';

/**
 * Real-time order book service that generates realistic market data
 * based on actual token prices from CoinGecko
 */
class RealTimeOrderBookService {
  private orderBookCache: Map<string, { bids: OrderBookEntry[], asks: OrderBookEntry[], timestamp: number }> = new Map();
  private recentTradesCache: Map<string, { trades: RecentTrade[], timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds for order book data

  /**
   * Generate realistic order book data based on current market price
   */
  generateRealTimeOrderBook(tokenId: string, currentPrice: number, spread = 0.002): { bids: OrderBookEntry[], asks: OrderBookEntry[] } {
    // Check cache first
    const cached = this.orderBookCache.get(tokenId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return { bids: cached.bids, asks: cached.asks };
    }

    const bids: OrderBookEntry[] = [];
    const asks: OrderBookEntry[] = [];

    // Calculate bid/ask prices with realistic spread
    const midPrice = currentPrice;
    const halfSpread = spread / 2;
    const bidPrice = midPrice * (1 - halfSpread);
    const askPrice = midPrice * (1 + halfSpread);

    // Generate realistic bid orders (buy orders)
    let bidTotal = 0;
    for (let i = 0; i < 15; i++) {
      // Price decreases as we go down the order book
      const priceDecrement = (i * 0.001) + (Math.random() * 0.0005);
      const price = bidPrice * (1 - priceDecrement);
      
      // Generate realistic amounts based on price level
      const baseAmount = this.generateRealisticAmount(currentPrice, 'bid', i);
      const amount = baseAmount * (0.8 + Math.random() * 0.4); // Add some randomness
      
      bidTotal += amount;

      bids.push({
        price,
        amount,
        total: bidTotal
      });
    }

    // Generate realistic ask orders (sell orders)
    let askTotal = 0;
    for (let i = 0; i < 15; i++) {
      // Price increases as we go up the order book
      const priceIncrement = (i * 0.001) + (Math.random() * 0.0005);
      const price = askPrice * (1 + priceIncrement);
      
      // Generate realistic amounts based on price level
      const baseAmount = this.generateRealisticAmount(currentPrice, 'ask', i);
      const amount = baseAmount * (0.8 + Math.random() * 0.4); // Add some randomness
      
      askTotal += amount;

      asks.push({
        price,
        amount,
        total: askTotal
      });
    }

    // Cache the result
    this.orderBookCache.set(tokenId, {
      bids,
      asks,
      timestamp: Date.now()
    });

    return { bids, asks };
  }

  /**
   * Generate realistic recent trades based on current market conditions
   */
  generateRealTimeRecentTrades(tokenId: string, currentPrice: number, count = 20): RecentTrade[] {
    // Check cache first
    const cached = this.recentTradesCache.get(tokenId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.trades;
    }

    const trades: RecentTrade[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      // Generate price variation around current price (±0.5%)
      const priceVariation = currentPrice * (0.995 + Math.random() * 0.01);
      
      // Generate realistic trade amounts
      const amount = this.generateRealisticTradeAmount(currentPrice);
      
      // Generate time in the last 2 hours with more recent trades being more frequent
      const maxTimeBack = 2 * 60 * 60 * 1000; // 2 hours
      const timeWeight = Math.pow(Math.random(), 2); // Bias towards recent trades
      const timeBack = maxTimeBack * timeWeight;
      const time = new Date(now.getTime() - timeBack);
      
      // Determine trade type based on price movement
      const type = priceVariation > currentPrice ? 'buy' : 'sell';

      trades.push({
        id: `trade-${tokenId}-${i}-${Date.now()}`,
        price: priceVariation,
        amount,
        value: priceVariation * amount,
        time,
        type
      });
    }

    // Sort by time (most recent first)
    trades.sort((a, b) => b.time.getTime() - a.time.getTime());

    // Cache the result
    this.recentTradesCache.set(tokenId, {
      trades,
      timestamp: Date.now()
    });

    return trades;
  }

  /**
   * Generate realistic order amounts based on price level and market conditions
   */
  private generateRealisticAmount(currentPrice: number, side: 'bid' | 'ask', level: number): number {
    // Base amount calculation based on token price
    let baseAmount: number;
    
    if (currentPrice > 10000) {
      // High-value tokens (like BTC) - smaller amounts
      baseAmount = 0.01 + Math.random() * 0.5;
    } else if (currentPrice > 1000) {
      // Medium-high value tokens (like ETH) - medium amounts
      baseAmount = 0.1 + Math.random() * 2;
    } else if (currentPrice > 1) {
      // Medium value tokens - larger amounts
      baseAmount = 1 + Math.random() * 50;
    } else {
      // Low value tokens - very large amounts
      baseAmount = 100 + Math.random() * 10000;
    }

    // Adjust based on order book level (deeper levels have larger amounts)
    const levelMultiplier = 1 + (level * 0.1);
    
    // Add some market-making behavior (tighter spreads have smaller amounts)
    const marketMakingFactor = level < 3 ? 0.5 : 1;
    
    return baseAmount * levelMultiplier * marketMakingFactor;
  }

  /**
   * Generate realistic trade amounts for recent trades
   */
  private generateRealisticTradeAmount(currentPrice: number): number {
    if (currentPrice > 10000) {
      // High-value tokens - smaller trade amounts
      return 0.001 + Math.random() * 0.1;
    } else if (currentPrice > 1000) {
      // Medium-high value tokens
      return 0.01 + Math.random() * 1;
    } else if (currentPrice > 1) {
      // Medium value tokens
      return 0.1 + Math.random() * 10;
    } else {
      // Low value tokens
      return 10 + Math.random() * 1000;
    }
  }

  /**
   * Clear cache for a specific token
   */
  clearCache(tokenId: string): void {
    this.orderBookCache.delete(tokenId);
    this.recentTradesCache.delete(tokenId);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.orderBookCache.clear();
    this.recentTradesCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      orderBookCacheSize: this.orderBookCache.size,
      recentTradesCacheSize: this.recentTradesCache.size,
      cacheDuration: this.CACHE_DURATION
    };
  }
}

// Create singleton instance
export const realTimeOrderBookService = new RealTimeOrderBookService();

// Export for use in components
export default realTimeOrderBookService;
