import { Token } from '@/types';
import { getRealTimeTokens } from './mockData';

/**
 * Real-time data manager for handling periodic updates and state management
 */
class RealTimeDataManager {
  private tokens: Token[] = [];
  private subscribers: Set<(tokens: Token[]) => void> = new Set();
  private refreshInterval: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private lastUpdate: Date | null = null;
  
  // Configuration
  private readonly REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the data manager
   */
  private async initialize() {
    console.log('Initializing Real-Time Data Manager...');
    
    // Load initial data
    await this.refreshData();
    
    // Start periodic refresh
    this.startPeriodicRefresh();
    
    console.log('Real-Time Data Manager initialized successfully');
  }

  /**
   * Start periodic data refresh
   */
  private startPeriodicRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(() => {
      this.refreshData();
    }, this.REFRESH_INTERVAL);

    console.log(`Periodic refresh started (every ${this.REFRESH_INTERVAL / 1000 / 60} minutes)`);
  }

  /**
   * Stop periodic data refresh
   */
  public stopPeriodicRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('Periodic refresh stopped');
    }
  }

  /**
   * Refresh data with retry logic
   */
  public async refreshData(retryCount = 0): Promise<boolean> {
    if (this.isRefreshing) {
      console.log('Refresh already in progress, skipping...');
      return false;
    }

    this.isRefreshing = true;

    try {
      console.log(`Refreshing real-time data (attempt ${retryCount + 1}/${this.MAX_RETRY_ATTEMPTS + 1})`);
      
      const newTokens = await getRealTimeTokens();
      
      if (newTokens && newTokens.length > 0) {
        this.tokens = newTokens;
        this.lastUpdate = new Date();
        this.notifySubscribers();
        
        console.log(`Successfully refreshed ${newTokens.length} tokens`);
        return true;
      } else {
        throw new Error('No tokens received from API');
      }
    } catch (error) {
      console.error(`Error refreshing data (attempt ${retryCount + 1}):`, error);
      
      // Retry logic
      if (retryCount < this.MAX_RETRY_ATTEMPTS) {
        console.log(`Retrying in ${this.RETRY_DELAY}ms...`);
        setTimeout(() => {
          this.refreshData(retryCount + 1);
        }, this.RETRY_DELAY);
      } else {
        console.error('Max retry attempts reached, using existing data');
      }
      
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Subscribe to data updates
   */
  public subscribe(callback: (tokens: Token[]) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately call with current data
    if (this.tokens.length > 0) {
      callback(this.tokens);
    }
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of data updates
   */
  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.tokens);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  /**
   * Get current tokens
   */
  public getTokens(): Token[] {
    return [...this.tokens]; // Return a copy to prevent mutation
  }

  /**
   * Get specific token by ID
   */
  public getToken(id: string): Token | undefined {
    return this.tokens.find(token => token.id === id);
  }

  /**
   * Get tokens by symbol
   */
  public getTokensBySymbol(symbol: string): Token[] {
    return this.tokens.filter(token => 
      token.symbol.toLowerCase() === symbol.toLowerCase()
    );
  }

  /**
   * Get last update timestamp
   */
  public getLastUpdate(): Date | null {
    return this.lastUpdate;
  }

  /**
   * Check if data is stale (older than refresh interval)
   */
  public isDataStale(): boolean {
    if (!this.lastUpdate) return true;
    
    const now = new Date();
    const timeDiff = now.getTime() - this.lastUpdate.getTime();
    return timeDiff > this.REFRESH_INTERVAL;
  }

  /**
   * Force immediate refresh
   */
  public async forceRefresh(): Promise<boolean> {
    console.log('Force refresh requested');
    return await this.refreshData();
  }

  /**
   * Get refresh status
   */
  public getStatus() {
    return {
      isRefreshing: this.isRefreshing,
      lastUpdate: this.lastUpdate,
      tokenCount: this.tokens.length,
      subscriberCount: this.subscribers.size,
      isDataStale: this.isDataStale()
    };
  }

  /**
   * Cleanup resources
   */
  public destroy() {
    this.stopPeriodicRefresh();
    this.subscribers.clear();
    this.tokens = [];
    console.log('Real-Time Data Manager destroyed');
  }
}

// Create singleton instance
export const realTimeDataManager = new RealTimeDataManager();

// Export for use in components
export default realTimeDataManager;

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realTimeDataManager.destroy();
  });
}
