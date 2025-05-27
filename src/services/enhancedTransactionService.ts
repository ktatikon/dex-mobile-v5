import { supabase } from '@/integrations/supabase/client';
import { Transaction, TransactionType, TransactionStatus } from '@/types';

export interface TransactionFilters {
  walletId?: string;
  walletType?: 'generated' | 'hot' | 'hardware';
  transactionType?: TransactionType;
  status?: TransactionStatus;
  tokenId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  category?: string;
  // Advanced filtering options
  dateRange?: {
    from: Date;
    to: Date;
  };
  amountRange?: {
    min: number;
    max: number;
    currency: string;
  };
  tokenFilter?: string; // Token symbol or ID search
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

export interface PaginationParams {
  page: number;
  limit: number;
}

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
