import { Token } from '@/types';
import { getRealTimeTokens, mockTokens, PHASE2_CONFIG } from './fallbackDataService';

/**
 * Enhanced Real-time data manager with comprehensive error boundaries and Phase 1 fallback
 * Automatically detects Phase 1/2 mode and provides appropriate data handling
 */
class RealTimeDataManager {
  private tokens: Token[] = [];
  private subscribers: Set<(tokens: Token[]) => void> = new Set();
  private refreshInterval: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private lastUpdate: Date | null = null;
  private phase1FallbackActive = false;
  private consecutiveFailures = 0;

  // Configuration
  private readonly REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds
  private readonly MAX_CONSECUTIVE_FAILURES = 5; // Fallback to Phase 1 after 5 failures

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the data manager with Phase detection and error boundaries
   */
  private async initialize() {
    try {
      console.log('🚀 Initializing Enhanced Real-Time Data Manager...');

      // Detect current phase
      const isPhase2Enabled = PHASE2_CONFIG?.enableRealWallets || PHASE2_CONFIG?.enableRealTransactions;
      console.log(`📊 Detected Phase: ${isPhase2Enabled ? 'Phase 2' : 'Phase 1'}`);

      // Load initial data with fallback
      const dataLoaded = await this.refreshData();

      if (!dataLoaded) {
        console.log('⚠️ Initial data load failed, activating Phase 1 fallback');
        this.activatePhase1Fallback();
      }

      // Start periodic refresh only if not in fallback mode
      if (!this.phase1FallbackActive) {
        this.startPeriodicRefresh();
      }

      console.log('✅ Enhanced Real-Time Data Manager initialized successfully');
      console.log(`📈 Current mode: ${this.phase1FallbackActive ? 'Phase 1 Fallback' : 'Phase 2 Active'}`);

    } catch (error) {
      console.error('❌ Failed to initialize Real-Time Data Manager:', error);
      console.log('🔄 Activating Phase 1 fallback mode for stability');
      this.activatePhase1Fallback();
    }
  }

  /**
   * Activate Phase 1 fallback mode with mock data
   */
  private activatePhase1Fallback() {
    try {
      console.log('🔄 Activating Phase 1 fallback mode...');

      this.phase1FallbackActive = true;
      this.tokens = [...mockTokens]; // Use mock data
      this.lastUpdate = new Date();
      this.consecutiveFailures = 0;

      // Stop any existing refresh intervals
      this.stopPeriodicRefresh();

      // Notify subscribers with mock data
      this.notifySubscribers();

      console.log('✅ Phase 1 fallback mode activated successfully');
      console.log(`📊 Loaded ${this.tokens.length} mock tokens`);

    } catch (error) {
      console.error('❌ Failed to activate Phase 1 fallback:', error);
      // Last resort: empty array
      this.tokens = [];
    }
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
   * Refresh data with enhanced retry logic and fallback mechanisms
   */
  public async refreshData(retryCount = 0): Promise<boolean> {
    // Skip refresh if in Phase 1 fallback mode
    if (this.phase1FallbackActive) {
      console.log('📊 Phase 1 fallback mode active, skipping real-time refresh');
      return true; // Return true since mock data is already loaded
    }

    if (this.isRefreshing) {
      console.log('🔄 Refresh already in progress, skipping...');
      return false;
    }

    this.isRefreshing = true;

    try {
      console.log(`🔄 Refreshing real-time data (attempt ${retryCount + 1}/${this.MAX_RETRY_ATTEMPTS + 1})`);

      const newTokens = await getRealTimeTokens();

      if (newTokens && newTokens.length > 0) {
        this.tokens = newTokens;
        this.lastUpdate = new Date();
        this.consecutiveFailures = 0; // Reset failure counter on success
        this.notifySubscribers();

        console.log(`✅ Successfully refreshed ${newTokens.length} tokens`);
        return true;
      } else {
        throw new Error('No tokens received from API');
      }
    } catch (error) {
      console.error(`❌ Error refreshing data (attempt ${retryCount + 1}):`, error);

      this.consecutiveFailures++;

      // Check if we should activate fallback mode
      if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        console.log(`⚠️ ${this.consecutiveFailures} consecutive failures detected, activating Phase 1 fallback`);
        this.activatePhase1Fallback();
        return true; // Return true since fallback was activated successfully
      }

      // Retry logic
      if (retryCount < this.MAX_RETRY_ATTEMPTS) {
        console.log(`🔄 Retrying in ${this.RETRY_DELAY}ms...`);
        setTimeout(() => {
          this.refreshData(retryCount + 1);
        }, this.RETRY_DELAY);
      } else {
        console.error('❌ Max retry attempts reached');

        // If we have existing data, keep using it
        if (this.tokens.length > 0) {
          console.log('📊 Continuing with existing data');
        } else {
          console.log('🔄 No existing data, activating Phase 1 fallback');
          this.activatePhase1Fallback();
        }
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
   * Get comprehensive refresh status including fallback information
   */
  public getStatus() {
    return {
      isRefreshing: this.isRefreshing,
      lastUpdate: this.lastUpdate,
      tokenCount: this.tokens.length,
      subscriberCount: this.subscribers.size,
      isDataStale: this.isDataStale(),
      phase1FallbackActive: this.phase1FallbackActive,
      consecutiveFailures: this.consecutiveFailures,
      currentMode: this.phase1FallbackActive ? 'Phase 1 Fallback' : 'Phase 2 Active',
      isPhase2Enabled: PHASE2_CONFIG?.enableRealWallets || PHASE2_CONFIG?.enableRealTransactions || false
    };
  }

  /**
   * Check if currently in Phase 1 fallback mode
   */
  public isInFallbackMode(): boolean {
    return this.phase1FallbackActive;
  }

  /**
   * Attempt to recover from fallback mode (manual recovery)
   */
  public async attemptRecovery(): Promise<boolean> {
    if (!this.phase1FallbackActive) {
      console.log('📊 Not in fallback mode, no recovery needed');
      return true;
    }

    console.log('🔄 Attempting recovery from Phase 1 fallback mode...');

    try {
      this.phase1FallbackActive = false;
      this.consecutiveFailures = 0;

      const success = await this.refreshData();

      if (success) {
        console.log('✅ Successfully recovered from fallback mode');
        this.startPeriodicRefresh();
        return true;
      } else {
        console.log('❌ Recovery failed, returning to fallback mode');
        this.activatePhase1Fallback();
        return false;
      }
    } catch (error) {
      console.error('❌ Error during recovery attempt:', error);
      this.activatePhase1Fallback();
      return false;
    }
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
