/**
 * LEGACY FILE - DO NOT USE
 *
 * This file has been superseded by enhancedTransactionService.ts
 * All functionality has been migrated to the primary service.
 * This file is kept for reference only and will be removed in a future update.
 *
 * Use enhancedTransactionService.ts instead.
 */

import { supabase } from '@/integrations/supabase/client';

export interface TransactionFilter {
  dateRange?: {
    from: Date;
    to: Date;
  };
  transactionType?: 'send' | 'receive' | 'buy' | 'sell' | 'swap' | 'stake' | 'unstake' | 'all';
  status?: 'pending' | 'completed' | 'failed' | 'cancelled' | 'all';
  amountRange?: {
    min: number;
    max: number;
    currency: string;
  };
  tokenFilter?: string; // Token symbol or ID
  category?: 'defi' | 'trading' | 'transfer' | 'payment' | 'staking' | 'other' | 'all';
}

export interface TransactionCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
}

export const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  {
    id: 'defi',
    name: 'DeFi',
    color: '#34C759',
    icon: 'TrendingUp',
    description: 'Decentralized Finance activities'
  },
  {
    id: 'trading',
    name: 'Trading',
    color: '#FF9500',
    icon: 'BarChart3',
    description: 'Buy, sell, and swap transactions'
  },
  {
    id: 'transfer',
    name: 'Transfer',
    color: '#007AFF',
    icon: 'ArrowUpDown',
    description: 'Send and receive transactions'
  },
  {
    id: 'payment',
    name: 'Payment',
    color: '#FF3B30',
    icon: 'CreditCard',
    description: 'Payment transactions'
  },
  {
    id: 'staking',
    name: 'Staking',
    color: '#5856D6',
    icon: 'Coins',
    description: 'Staking and rewards'
  },
  {
    id: 'other',
    name: 'Other',
    color: '#8E8E93',
    icon: 'MoreHorizontal',
    description: 'Other transaction types'
  }
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

/**
 * Get filtered transactions with advanced filtering options
 * @param userId The user's ID
 * @param filters Transaction filters
 * @param pagination Pagination options
 * @returns Filtered transactions
 */
export const getFilteredTransactionsAdvanced = async (
  userId: string,
  filters: TransactionFilter = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 20 }
) => {
  try {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        tokens:from_token_id (
          id,
          symbol,
          name,
          price,
          logo
        ),
        to_tokens:to_token_id (
          id,
          symbol,
          name,
          price,
          logo
        )
      `)
      .eq('user_id', userId);

    // Apply date range filter
    if (filters.dateRange) {
      query = query
        .gte('timestamp', filters.dateRange.from.toISOString())
        .lte('timestamp', filters.dateRange.to.toISOString());
    }

    // Apply transaction type filter
    if (filters.transactionType && filters.transactionType !== 'all') {
      query = query.eq('transaction_type', filters.transactionType);
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    // Apply token filter
    if (filters.tokenFilter) {
      query = query.or(
        `tokens.symbol.ilike.%${filters.tokenFilter}%,to_tokens.symbol.ilike.%${filters.tokenFilter}%`
      );
    }

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit;
    query = query
      .order('timestamp', { ascending: false })
      .range(offset, offset + pagination.limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching filtered transactions:', error);
      return { transactions: [], total: 0, page: pagination.page, limit: pagination.limit };
    }

    // Apply client-side filters that can't be done in SQL
    let filteredData = data || [];

    // Apply amount range filter
    if (filters.amountRange) {
      filteredData = filteredData.filter(tx => {
        const amount = parseFloat(tx.from_amount || '0');
        const price = tx.tokens?.price || 0;
        const valueUsd = amount * price;

        return valueUsd >= filters.amountRange!.min &&
               valueUsd <= filters.amountRange!.max;
      });
    }

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      filteredData = filteredData.filter(tx => {
        const category = categorizeTransaction(tx);
        return category === filters.category;
      });
    }

    // Add category information to each transaction
    const transactionsWithCategories = filteredData.map(tx => ({
      ...tx,
      category: categorizeTransaction(tx),
      categoryInfo: TRANSACTION_CATEGORIES.find(cat => cat.id === categorizeTransaction(tx))
    }));

    return {
      transactions: transactionsWithCategories,
      total: count || filteredData.length,
      page: pagination.page,
      limit: pagination.limit
    };
  } catch (error) {
    console.error('Error in getFilteredTransactionsAdvanced:', error);
    return { transactions: [], total: 0, page: pagination.page, limit: pagination.limit };
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
 * Export transactions to CSV format
 * @param userId The user's ID
 * @param options Export options
 * @returns CSV content as string
 */
export const exportTransactionsToCSV = async (
  userId: string,
  options: ExportOptions
): Promise<string> => {
  try {
    // Determine date range
    let dateRange: { from: Date; to: Date } | undefined;

    if (options.dateRange === 'custom' && options.customDateRange) {
      dateRange = options.customDateRange;
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

      dateRange = { from, to: now };
    }

    // Get all transactions for the date range
    const { transactions } = await getFilteredTransactionsAdvanced(
      userId,
      { dateRange },
      { page: 1, limit: 10000 } // Get all transactions
    );

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
            return tx.categoryInfo?.name || 'Other';
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
 * Get transaction statistics for a user
 * @param userId The user's ID
 * @param dateRange Optional date range
 * @returns Transaction statistics
 */
export const getTransactionStatistics = async (
  userId: string,
  dateRange?: { from: Date; to: Date }
) => {
  try {
    const { transactions } = await getFilteredTransactionsAdvanced(
      userId,
      { dateRange },
      { page: 1, limit: 10000 }
    );

    const stats = {
      totalTransactions: transactions.length,
      totalVolume: 0,
      averageAmount: 0,
      categoryCounts: {} as { [key: string]: number },
      statusCounts: {} as { [key: string]: number },
      monthlyVolume: {} as { [key: string]: number }
    };

    transactions.forEach(tx => {
      // Calculate volume
      const amount = parseFloat(tx.from_amount || '0');
      const price = tx.tokens?.price || 0;
      const valueUsd = amount * price;
      stats.totalVolume += valueUsd;

      // Count by category
      const category = tx.category || 'other';
      stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1;

      // Count by status
      const status = tx.status || 'unknown';
      stats.statusCounts[status] = (stats.statusCounts[status] || 0) + 1;

      // Monthly volume
      const month = new Date(tx.timestamp).toISOString().substring(0, 7); // YYYY-MM
      stats.monthlyVolume[month] = (stats.monthlyVolume[month] || 0) + valueUsd;
    });

    stats.averageAmount = stats.totalTransactions > 0 ? stats.totalVolume / stats.totalTransactions : 0;

    return stats;
  } catch (error) {
    console.error('Error getting transaction statistics:', error);
    return {
      totalTransactions: 0,
      totalVolume: 0,
      averageAmount: 0,
      categoryCounts: {},
      statusCounts: {},
      monthlyVolume: {}
    };
  }
};
