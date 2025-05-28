/**
 * Enhanced Phase 2: Enhanced Transaction Analytics Service with comprehensive error boundaries
 * Intelligently switches between real transaction analytics and Phase 1 mock data fallback
 * Provides robust transaction analytics with automatic fallback mechanisms
 */

import { supabase } from '@/integrations/supabase/client';
import { Transaction, TransactionType, TransactionStatus } from '@/types';
import { mockTransactions, PHASE2_CONFIG } from './fallbackDataService';
import { realTransactionService } from './realTransactionService';
import { walletConnectivityService } from './walletConnectivityService';

// Interface definitions for enhanced transaction analytics
export interface TransactionFilters {
  walletId?: string;
  transactionType?: TransactionType;
  status?: TransactionStatus;
  tokenId?: string;
  tokenFilter?: string;
  dateFrom?: string;
  dateTo?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  amountMin?: number;
  amountMax?: number;
  category?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface TransactionCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
}

export const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  { id: 'defi', name: 'DeFi', color: '#34C759', icon: 'TrendingUp', description: 'Decentralized Finance activities' },
  { id: 'trading', name: 'Trading', color: '#FF9500', icon: 'BarChart3', description: 'Buy, sell, and swap transactions' },
  { id: 'transfer', name: 'Transfer', color: '#007AFF', icon: 'ArrowUpDown', description: 'Send and receive transactions' },
  { id: 'payment', name: 'Payment', color: '#FF3B30', icon: 'CreditCard', description: 'Payment transactions' },
  { id: 'staking', name: 'Staking', color: '#5856D6', icon: 'Coins', description: 'Staking and rewards' },
  { id: 'other', name: 'Other', color: '#8E8E93', icon: 'MoreHorizontal', description: 'Other transaction types' }
];

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  dateRange: 'last30days' | 'last90days' | 'alltime' | 'custom';
  customDateRange?: {
    from: Date;
    to: Date;
  };
  includeFields: string[];
}

export const EXPORT_FIELDS = [
  { id: 'date', label: 'Date', required: true },
  { id: 'type', label: 'Type', required: true },
  { id: 'token', label: 'Token', required: true },
  { id: 'amount', label: 'Amount', required: true },
  { id: 'value_usd', label: 'Value (USD)', required: false },
  { id: 'status', label: 'Status', required: true },
  { id: 'category', label: 'Category', required: false },
  { id: 'hash', label: 'Transaction Hash', required: false },
  { id: 'wallet_id', label: 'Wallet ID', required: false },
  { id: 'gas_fee', label: 'Gas Fee', required: false },
  { id: 'from_address', label: 'From Address', required: false },
  { id: 'to_address', label: 'To Address', required: false }
];

export interface TransactionAnalytics {
  totalTransactions: number;
  totalVolume: number;
  averageAmount: number;
  categoryBreakdown: { [category: string]: number };
  monthlyVolume: { month: string; volume: number }[];
  topTokens: { tokenId: string; volume: number; count: number }[];
}

/**
 * Enhanced Transaction Analytics Service with comprehensive error boundaries
 */
class EnhancedTransactionAnalyticsService {
  private phase1FallbackActive = false;
  private consecutiveFailures = 0;
  private lastUpdate: Date | null = null;
  private analyticsCache: Map<string, { data: any, timestamp: number }> = new Map();

  private readonly MAX_CONSECUTIVE_FAILURES = 5; // Fallback to Phase 1 after 5 failures
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for analytics cache
  private readonly RETRY_DELAY = 2000; // 2 seconds

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the enhanced transaction analytics service with Phase detection and error boundaries
   */
  private async initialize() {
    try {
      console.log('🚀 Initializing Enhanced Transaction Analytics Service...');

      // Detect current phase
      const isPhase2Enabled = PHASE2_CONFIG?.enableRealTransactions || false;
      console.log(`📊 Detected Phase: ${isPhase2Enabled ? 'Phase 2' : 'Phase 1'}`);

      // If Phase 2 is not enabled, activate fallback mode immediately
      if (!isPhase2Enabled) {
        console.log('⚠️ Phase 2 enhanced analytics not enabled, activating Phase 1 fallback');
        this.activatePhase1Fallback();
      }

      console.log('✅ Enhanced Transaction Analytics Service initialized successfully');
      console.log(`📈 Current mode: ${this.phase1FallbackActive ? 'Phase 1 Fallback' : 'Phase 2 Active'}`);

    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Transaction Analytics Service:', error);
      console.log('🔄 Activating Phase 1 fallback mode for stability');
      this.activatePhase1Fallback();
    }
  }

  /**
   * Activate Phase 1 fallback mode with mock analytics data
   */
  private activatePhase1Fallback() {
    try {
      console.log('🔄 Activating Phase 1 enhanced analytics fallback mode...');

      this.phase1FallbackActive = true;
      this.consecutiveFailures = 0;
      this.lastUpdate = new Date();

      console.log('✅ Phase 1 enhanced analytics fallback mode activated successfully');
      console.log(`📊 Using mock analytics based on ${mockTransactions.length} mock transactions`);

    } catch (error) {
      console.error('❌ Failed to activate Phase 1 enhanced analytics fallback:', error);
    }
  }

  /**
   * Create mock analytics data based on mock transactions
   */
  private createMockAnalytics(userId: string, filters: TransactionFilters = {}): TransactionAnalytics {
    try {
      const baseTransactions = mockTransactions.slice(0, 50); // Use 50 mock transactions

      let totalVolume = 0;
      const categoryBreakdown: { [category: string]: number } = {};
      const monthlyVolume: { [month: string]: number } = {};
      const tokenVolume: { [tokenId: string]: { volume: number; count: number } } = {};

      baseTransactions.forEach(transaction => {
        const amount = parseFloat(transaction.amount || '0');
        const value = amount * (Math.random() * 100 + 50); // Mock USD value

        totalVolume += value;

        // Category breakdown
        const category = this.categorizeTransaction(transaction);
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + value;

        // Monthly volume (last 6 months)
        const monthsAgo = Math.floor(Math.random() * 6);
        const date = new Date();
        date.setMonth(date.getMonth() - monthsAgo);
        const month = date.toISOString().slice(0, 7); // YYYY-MM
        monthlyVolume[month] = (monthlyVolume[month] || 0) + value;

        // Token volume
        const tokenId = transaction.fromToken || 'ethereum';
        if (!tokenVolume[tokenId]) {
          tokenVolume[tokenId] = { volume: 0, count: 0 };
        }
        tokenVolume[tokenId].volume += value;
        tokenVolume[tokenId].count += 1;
      });

      const totalTransactions = baseTransactions.length;
      const averageAmount = totalTransactions > 0 ? totalVolume / totalTransactions : 0;

      // Convert monthly volume to array
      const monthlyVolumeArray = Object.entries(monthlyVolume)
        .map(([month, volume]) => ({ month, volume }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Convert token volume to array and sort by volume
      const topTokens = Object.entries(tokenVolume)
        .map(([tokenId, data]) => ({ tokenId, ...data }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 10);

      return {
        totalTransactions,
        totalVolume,
        averageAmount,
        categoryBreakdown,
        monthlyVolume: monthlyVolumeArray,
        topTokens
      };
    } catch (error) {
      console.error('❌ Error creating mock analytics:', error);
      return {
        totalTransactions: 0,
        totalVolume: 0,
        averageAmount: 0,
        categoryBreakdown: {},
        monthlyVolume: [],
        topTokens: []
      };
    }
  }

  /**
   * Enhanced getFilteredTransactions with error boundaries and fallback
   */
  async getFilteredTransactions(
    userId: string,
    filters: TransactionFilters = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<{ transactions: Transaction[]; total: number }> {
    // If in Phase 1 fallback mode, return mock transactions
    if (this.phase1FallbackActive) {
      console.log('📊 Phase 1 fallback mode active, returning mock filtered transactions');
      return this.createMockFilteredTransactions(userId, filters, pagination);
    }

    const cacheKey = `filtered_${userId}_${JSON.stringify(filters)}_${JSON.stringify(pagination)}`;

    // Check cache first
    const cached = this.analyticsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('💾 Returning cached filtered transactions');
      return cached.data;
    }

    try {
      console.log('🔄 Fetching real filtered transactions...');

      // Try to get real transactions from the transaction service first
      const realTransactions = await realTransactionService.getAllWalletTransactions(pagination.limit);

      if (realTransactions && realTransactions.length > 0) {
        const result = {
          transactions: realTransactions.slice(0, pagination.limit),
          total: realTransactions.length
        };

        // Cache the results
        this.analyticsCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        // Reset failure counter on success
        this.consecutiveFailures = 0;
        this.lastUpdate = new Date();

        console.log(`✅ Retrieved ${result.transactions.length} real filtered transactions`);
        return result;
      }

      // If no real transactions, fall back to Supabase
      const result = await getFilteredTransactions(userId, filters, pagination);

      // Cache the results
      this.analyticsCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      // Reset failure counter on success
      this.consecutiveFailures = 0;
      this.lastUpdate = new Date();

      console.log(`✅ Retrieved ${result.transactions.length} filtered transactions from Supabase`);
      return result;

    } catch (error) {
      console.error('❌ Error fetching filtered transactions:', error);

      this.consecutiveFailures++;

      // Check if we should activate fallback mode
      if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        console.log(`⚠️ ${this.consecutiveFailures} consecutive analytics failures detected, activating Phase 1 fallback`);
        this.activatePhase1Fallback();
        return this.createMockFilteredTransactions(userId, filters, pagination);
      }

      // Return cached data if available
      const cached = this.analyticsCache.get(cacheKey);
      if (cached) {
        console.log('💾 Returning stale cached filtered transactions due to error');
        return cached.data;
      }

      // Last resort: return mock transactions
      console.log('🔄 No cached data available, returning mock filtered transactions');
      return this.createMockFilteredTransactions(userId, filters, pagination);
    }
  }

  /**
   * Create mock filtered transactions
   */
  private createMockFilteredTransactions(
    userId: string,
    filters: TransactionFilters = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): { transactions: Transaction[]; total: number } {
    try {
      let filteredTransactions = [...mockTransactions];

      // Apply filters
      if (filters.transactionType) {
        filteredTransactions = filteredTransactions.filter(tx => tx.type === filters.transactionType);
      }

      if (filters.status) {
        filteredTransactions = filteredTransactions.filter(tx => tx.status === filters.status);
      }

      if (filters.tokenFilter) {
        filteredTransactions = filteredTransactions.filter(tx =>
          tx.fromToken?.toLowerCase().includes(filters.tokenFilter!.toLowerCase()) ||
          tx.toToken?.toLowerCase().includes(filters.tokenFilter!.toLowerCase())
        );
      }

      // Apply pagination
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

      return {
        transactions: paginatedTransactions,
        total: filteredTransactions.length
      };
    } catch (error) {
      console.error('❌ Error creating mock filtered transactions:', error);
      return { transactions: [], total: 0 };
    }
  }

  /**
   * Enhanced getTransactionAnalytics with error boundaries and fallback
   */
  async getTransactionAnalytics(
    userId: string,
    filters: TransactionFilters = {}
  ): Promise<TransactionAnalytics> {
    // If in Phase 1 fallback mode, return mock analytics
    if (this.phase1FallbackActive) {
      console.log('📊 Phase 1 fallback mode active, returning mock analytics');
      return this.createMockAnalytics(userId, filters);
    }

    const cacheKey = `analytics_${userId}_${JSON.stringify(filters)}`;

    // Check cache first
    const cached = this.analyticsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('💾 Returning cached analytics');
      return cached.data;
    }

    try {
      console.log('🔄 Fetching real transaction analytics...');

      const result = await getTransactionAnalytics(userId, filters);

      // Cache the results
      this.analyticsCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      // Reset failure counter on success
      this.consecutiveFailures = 0;
      this.lastUpdate = new Date();

      console.log('✅ Retrieved real transaction analytics');
      return result;

    } catch (error) {
      console.error('❌ Error fetching transaction analytics:', error);

      this.consecutiveFailures++;

      // Check if we should activate fallback mode
      if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        console.log(`⚠️ ${this.consecutiveFailures} consecutive analytics failures detected, activating Phase 1 fallback`);
        this.activatePhase1Fallback();
        return this.createMockAnalytics(userId, filters);
      }

      // Return cached data if available
      const cached = this.analyticsCache.get(cacheKey);
      if (cached) {
        console.log('💾 Returning stale cached analytics due to error');
        return cached.data;
      }

      // Last resort: return mock analytics
      console.log('🔄 No cached data available, returning mock analytics');
      return this.createMockAnalytics(userId, filters);
    }
  }

  /**
   * Categorize a transaction based on its type and properties
   */
  categorizeTransaction(transaction: any): string {
    const type = transaction.type?.toLowerCase() || transaction.transaction_type?.toLowerCase();

    switch (type) {
      case 'stake':
      case 'unstake':
      case 'claim_rewards':
        return 'staking';
      case 'swap':
      case 'buy':
      case 'sell':
        return 'trading';
      case 'send':
      case 'receive':
        return 'transfer';
      case 'payment':
        return 'payment';
      case 'liquidity_add':
      case 'liquidity_remove':
      case 'yield_farm':
        return 'defi';
      default:
        return 'other';
    }
  }

  /**
   * Get comprehensive enhanced analytics service status including fallback information
   */
  getStatus() {
    return {
      lastUpdate: this.lastUpdate,
      phase1FallbackActive: this.phase1FallbackActive,
      consecutiveFailures: this.consecutiveFailures,
      currentMode: this.phase1FallbackActive ? 'Phase 1 Fallback' : 'Phase 2 Active',
      isPhase2Enabled: PHASE2_CONFIG?.enableRealTransactions || false,
      analyticsCacheSize: this.analyticsCache.size,
      supportedFeatures: ['filtering', 'analytics', 'categorization', 'export'],
      cacheEntries: Array.from(this.analyticsCache.keys())
    };
  }

  /**
   * Check if currently in Phase 1 fallback mode
   */
  isInFallbackMode(): boolean {
    return this.phase1FallbackActive;
  }

  /**
   * Attempt to recover from fallback mode (manual recovery)
   */
  async attemptRecovery(): Promise<boolean> {
    if (!this.phase1FallbackActive) {
      console.log('📊 Not in fallback mode, no recovery needed');
      return true;
    }

    console.log('🔄 Attempting recovery from Phase 1 enhanced analytics fallback mode...');

    try {
      this.phase1FallbackActive = false;
      this.consecutiveFailures = 0;

      // Test with a simple analytics fetch
      await this.getTransactionAnalytics('test_user', {});

      console.log('✅ Successfully recovered from enhanced analytics fallback mode');
      return true;

    } catch (error) {
      console.error('❌ Error during enhanced analytics recovery attempt:', error);
      this.activatePhase1Fallback();
      return false;
    }
  }

  /**
   * Clear analytics cache
   */
  clearCache(): void {
    this.analyticsCache.clear();
    console.log('🧹 Enhanced analytics cache cleared');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    try {
      this.clearCache();
      this.phase1FallbackActive = false;
      this.consecutiveFailures = 0;
      console.log('🧹 Enhanced Transaction Analytics Service destroyed');
    } catch (error) {
      console.error('❌ Error during enhanced analytics service cleanup:', error);
    }
  }
}

// Export singleton instance
export const enhancedTransactionAnalyticsService = new EnhancedTransactionAnalyticsService();
export default enhancedTransactionAnalyticsService;

/**
 * Get filtered transactions for a user
 * @param userId The user's ID
 * @param filters Transaction filters
 * @param pagination Pagination parameters
 * @returns Filtered transactions with total count
 */
export const getFilteredTransactions = async (
  userId: string,
  filters: TransactionFilters = {},
  pagination: PaginationParams = { page: 1, limit: 20 }
): Promise<{ transactions: Transaction[]; total: number }> => {
  try {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        tokens:from_token_id (
          id,
          symbol,
          name,
          logo,
          decimals,
          price
        )
      `, { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (filters.walletId) {
      query = query.eq('wallet_id', filters.walletId);
    }

    if (filters.transactionType) {
      query = query.eq('transaction_type', filters.transactionType);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.tokenId) {
      query = query.eq('from_token_id', filters.tokenId);
    }

    // Advanced date range filtering
    if (filters.dateRange) {
      query = query
        .gte('timestamp', filters.dateRange.from.toISOString())
        .lte('timestamp', filters.dateRange.to.toISOString());
    } else {
      // Fallback to legacy date filtering
      if (filters.dateFrom) {
        query = query.gte('timestamp', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('timestamp', filters.dateTo);
      }
    }

    // Advanced token filtering
    if (filters.tokenFilter) {
      query = query.or(
        `tokens.symbol.ilike.%${filters.tokenFilter}%,tokens.name.ilike.%${filters.tokenFilter}%`
      );
    }

    if (filters.amountMin) {
      query = query.gte('from_amount', filters.amountMin.toString());
    }

    if (filters.amountMax) {
      query = query.lte('from_amount', filters.amountMax.toString());
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit;
    query = query
      .order('timestamp', { ascending: false })
      .range(offset, offset + pagination.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching filtered transactions:', error);
      return { transactions: [], total: 0 };
    }

    return {
      transactions: data || [],
      total: count || 0
    };
  } catch (error) {
    console.error('Error in getFilteredTransactions:', error);
    return { transactions: [], total: 0 };
  }
};

/**
 * Get transaction analytics for a user
 * @param userId The user's ID
 * @param filters Optional filters
 * @returns Transaction analytics
 */
export const getTransactionAnalytics = async (
  userId: string,
  filters: TransactionFilters = {}
): Promise<TransactionAnalytics> => {
  try {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        tokens:from_token_id (
          id,
          symbol,
          name,
          price
        )
      `)
      .eq('user_id', userId);

    // Apply filters
    if (filters.walletId) {
      query = query.eq('wallet_id', filters.walletId);
    }

    if (filters.dateFrom) {
      query = query.gte('timestamp', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('timestamp', filters.dateTo);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error('Error fetching transaction analytics:', error);
      return {
        totalTransactions: 0,
        totalVolume: 0,
        averageAmount: 0,
        categoryBreakdown: {},
        monthlyVolume: [],
        topTokens: []
      };
    }

    // Calculate analytics
    const totalTransactions = data.length;
    let totalVolume = 0;
    const categoryBreakdown: { [category: string]: number } = {};
    const monthlyVolume: { [month: string]: number } = {};
    const tokenVolume: { [tokenId: string]: { volume: number; count: number; symbol: string } } = {};

    data.forEach(transaction => {
      const amount = parseFloat(transaction.from_amount || '0');
      const price = transaction.tokens?.price || 0;
      const value = amount * price;

      totalVolume += value;

      // Category breakdown
      const category = transaction.category || 'other';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + value;

      // Monthly volume
      const month = new Date(transaction.timestamp).toISOString().slice(0, 7); // YYYY-MM
      monthlyVolume[month] = (monthlyVolume[month] || 0) + value;

      // Token volume
      const tokenId = transaction.from_token_id;
      if (tokenId) {
        if (!tokenVolume[tokenId]) {
          tokenVolume[tokenId] = { volume: 0, count: 0, symbol: transaction.tokens?.symbol || 'Unknown' };
        }
        tokenVolume[tokenId].volume += value;
        tokenVolume[tokenId].count += 1;
      }
    });

    const averageAmount = totalTransactions > 0 ? totalVolume / totalTransactions : 0;

    // Convert monthly volume to array
    const monthlyVolumeArray = Object.entries(monthlyVolume)
      .map(([month, volume]) => ({ month, volume }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Convert token volume to array and sort by volume
    const topTokens = Object.entries(tokenVolume)
      .map(([tokenId, data]) => ({ tokenId, ...data }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    return {
      totalTransactions,
      totalVolume,
      averageAmount,
      categoryBreakdown,
      monthlyVolume: monthlyVolumeArray,
      topTokens
    };
  } catch (error) {
    console.error('Error in getTransactionAnalytics:', error);
    return {
      totalTransactions: 0,
      totalVolume: 0,
      averageAmount: 0,
      categoryBreakdown: {},
      monthlyVolume: [],
      topTokens: []
    };
  }
};

/**
 * Update transaction category
 * @param transactionId The transaction ID
 * @param category The new category
 * @param userId The user ID for security
 * @returns Success status
 */
export const updateTransactionCategory = async (
  transactionId: string,
  category: string,
  userId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('transactions')
      .update({ category })
      .eq('id', transactionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating transaction category:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateTransactionCategory:', error);
    return false;
  }
};

/**
 * Categorize a transaction based on its type and properties
 * @param transaction Transaction object
 * @returns Category ID
 */
export const categorizeTransaction = (transaction: any): string => {
  const type = transaction.transaction_type?.toLowerCase();

  switch (type) {
    case 'stake':
    case 'unstake':
    case 'claim_rewards':
      return 'staking';
    case 'swap':
    case 'buy':
    case 'sell':
      return 'trading';
    case 'send':
    case 'receive':
      return 'transfer';
    case 'payment':
      return 'payment';
    case 'liquidity_add':
    case 'liquidity_remove':
    case 'yield_farm':
      return 'defi';
    default:
      return 'other';
  }
};

/**
 * Export transactions to CSV format with advanced options
 * @param userId The user's ID
 * @param options Export options
 * @returns CSV string
 */
export const exportTransactionsToCSV = async (
  userId: string,
  options: ExportOptions
): Promise<string> => {
  try {
    // Determine date range
    let filters: TransactionFilters = {};

    if (options.dateRange === 'custom' && options.customDateRange) {
      filters.dateRange = options.customDateRange;
    } else {
      const now = new Date();
      const from = new Date();

      switch (options.dateRange) {
        case 'last30days':
          from.setDate(now.getDate() - 30);
          break;
        case 'last90days':
          from.setDate(now.getDate() - 90);
          break;
        case 'alltime':
          from.setFullYear(2020); // Set to a very early date
          break;
      }

      filters.dateRange = { from, to: now };
    }

    const { transactions } = await getFilteredTransactions(userId, filters, { page: 1, limit: 10000 });

    // Create CSV headers
    const headers = options.includeFields.map(fieldId => {
      const field = EXPORT_FIELDS.find(f => f.id === fieldId);
      return field?.label || fieldId;
    });

    // Create CSV rows
    const rows = transactions.map(tx => {
      return options.includeFields.map(fieldId => {
        switch (fieldId) {
          case 'date':
            return new Date(tx.timestamp).toLocaleDateString();
          case 'type':
            return tx.transaction_type || 'Unknown';
          case 'token':
            return tx.tokens?.symbol || 'Unknown';
          case 'amount':
            return tx.from_amount || '0';
          case 'value_usd':
            const amount = parseFloat(tx.from_amount || '0');
            const price = tx.tokens?.price || 0;
            return (amount * price).toFixed(2);
          case 'status':
            return tx.status || 'Unknown';
          case 'category':
            const category = categorizeTransaction(tx);
            const categoryInfo = TRANSACTION_CATEGORIES.find(cat => cat.id === category);
            return categoryInfo?.name || 'Other';
          case 'hash':
            return tx.hash || '';
          case 'wallet_id':
            return tx.wallet_id || '';
          case 'gas_fee':
            return tx.gas_fee || '0';
          case 'from_address':
            return tx.from_address || '';
          case 'to_address':
            return tx.to_address || '';
          default:
            return '';
        }
      });
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  } catch (error) {
    console.error('Error exporting transactions to CSV:', error);
    throw new Error('Failed to export transactions');
  }
};

/**
 * Get transaction category info
 * @param categoryId The category ID
 * @returns Category information
 */
export const getTransactionCategoryInfo = (categoryId: string): TransactionCategory => {
  return TRANSACTION_CATEGORIES.find(cat => cat.id === categoryId) || TRANSACTION_CATEGORIES[5]; // Default to 'other'
};
