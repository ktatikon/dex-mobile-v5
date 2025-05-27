import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type User = Database['public']['Tables']['users']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];
type KYC = Database['public']['Tables']['kyc']['Row'];
type AdminUser = Database['public']['Tables']['admin_users']['Row'];
type AdminActivityLog = Database['public']['Tables']['admin_activity_logs']['Row'];
type UserLoginHistory = Database['public']['Tables']['user_login_history']['Row'];
type UserStatusChange = Database['public']['Tables']['user_status_changes']['Row'];

export interface UserWithKYC extends User {
  kyc?: KYC;
  wallet_balances?: any[];
  login_history?: UserLoginHistory[];
}

export interface TransactionWithUser extends Transaction {
  user?: User;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface UserFilters {
  status?: string;
  kycStatus?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface TransactionFilters {
  type?: string;
  status?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

// User Management Functions
export const getUsers = async (
  filters: UserFilters = {},
  pagination: PaginationParams = { page: 1, limit: 20 }
): Promise<{ users: UserWithKYC[]; total: number }> => {
  let query = supabase
    .from('users')
    .select(`
      *,
      kyc(*),
      wallet_balances(*)
    `, { count: 'exact' });

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  // Apply pagination
  const from = (pagination.page - 1) * pagination.limit;
  const to = from + pagination.limit - 1;
  query = query.range(from, to);

  // Order by creation date
  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Error fetching users: ${error.message}`);
  }

  return {
    users: data || [],
    total: count || 0,
  };
};

export const getUserById = async (userId: string): Promise<UserWithKYC | null> => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      kyc(*),
      wallet_balances(*),
      user_login_history(*)
    `)
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Error fetching user: ${error.message}`);
  }

  return data;
};

export const updateUserStatus = async (
  userId: string,
  newStatus: string,
  adminUserId: string,
  reason?: string,
  notes?: string
): Promise<void> => {
  // Get current user status
  const { data: currentUser, error: fetchError } = await supabase
    .from('users')
    .select('status')
    .eq('id', userId)
    .single();

  if (fetchError) {
    throw new Error(`Error fetching current user status: ${fetchError.message}`);
  }

  // Update user status
  const { error: updateError } = await supabase
    .from('users')
    .update({ status: newStatus })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Error updating user status: ${updateError.message}`);
  }

  // Log status change
  const { error: logError } = await supabase
    .from('user_status_changes')
    .insert({
      user_id: userId,
      admin_user_id: adminUserId,
      old_status: currentUser.status,
      new_status: newStatus,
      reason,
      notes,
    });

  if (logError) {
    console.error('Error logging status change:', logError);
  }
};

// Transaction Management Functions
export const getTransactions = async (
  filters: TransactionFilters = {},
  pagination: PaginationParams = { page: 1, limit: 20 }
): Promise<{ transactions: TransactionWithUser[]; total: number }> => {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      users(id, full_name, email)
    `, { count: 'exact' });

  // Apply filters
  if (filters.type) {
    query = query.eq('transaction_type', filters.type);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters.dateFrom) {
    query = query.gte('timestamp', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('timestamp', filters.dateTo);
  }

  if (filters.minAmount) {
    query = query.gte('from_amount', filters.minAmount.toString());
  }

  if (filters.maxAmount) {
    query = query.lte('from_amount', filters.maxAmount.toString());
  }

  // Apply pagination
  const from = (pagination.page - 1) * pagination.limit;
  const to = from + pagination.limit - 1;
  query = query.range(from, to);

  // Order by timestamp
  query = query.order('timestamp', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Error fetching transactions: ${error.message}`);
  }

  return {
    transactions: data || [],
    total: count || 0,
  };
};

export const getReceiveTransactions = async (
  filters: TransactionFilters = {},
  pagination: PaginationParams = { page: 1, limit: 20 }
): Promise<{ transactions: TransactionWithUser[]; total: number }> => {
  return getTransactions(
    { ...filters, type: 'receive' },
    pagination
  );
};

export const getSendTransactions = async (
  filters: TransactionFilters = {},
  pagination: PaginationParams = { page: 1, limit: 20 }
): Promise<{ transactions: TransactionWithUser[]; total: number }> => {
  return getTransactions(
    { ...filters, type: 'send' },
    pagination
  );
};

export const updateTransactionStatus = async (
  transactionId: string,
  newStatus: string
): Promise<void> => {
  const { error } = await supabase
    .from('transactions')
    .update({ status: newStatus })
    .eq('id', transactionId);

  if (error) {
    throw new Error(`Error updating transaction status: ${error.message}`);
  }
};

// Analytics and Reporting Functions
export const getUserRegistrationStats = async (
  dateFrom?: string,
  dateTo?: string
): Promise<{ date: string; count: number }[]> => {
  let query = supabase
    .from('users')
    .select('created_at');

  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }

  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching registration stats: ${error.message}`);
  }

  // Group by date
  const stats: Record<string, number> = {};
  data?.forEach((user) => {
    const date = new Date(user.created_at!).toISOString().split('T')[0];
    stats[date] = (stats[date] || 0) + 1;
  });

  return Object.entries(stats).map(([date, count]) => ({ date, count }));
};

export const getKYCStats = async (): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}> => {
  const { data, error } = await supabase
    .from('kyc')
    .select('status');

  if (error) {
    throw new Error(`Error fetching KYC stats: ${error.message}`);
  }

  const stats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: data?.length || 0,
  };

  data?.forEach((kyc) => {
    switch (kyc.status) {
      case 'pending':
        stats.pending++;
        break;
      case 'approved':
        stats.approved++;
        break;
      case 'rejected':
        stats.rejected++;
        break;
    }
  });

  return stats;
};

export const getTransactionVolumeStats = async (
  dateFrom?: string,
  dateTo?: string
): Promise<{ date: string; volume: number; count: number }[]> => {
  let query = supabase
    .from('transactions')
    .select('timestamp, from_amount, status')
    .eq('status', 'completed');

  if (dateFrom) {
    query = query.gte('timestamp', dateFrom);
  }

  if (dateTo) {
    query = query.lte('timestamp', dateTo);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching transaction volume stats: ${error.message}`);
  }

  // Group by date
  const stats: Record<string, { volume: number; count: number }> = {};
  data?.forEach((transaction) => {
    const date = new Date(transaction.timestamp).toISOString().split('T')[0];
    const amount = parseFloat(transaction.from_amount || '0');
    
    if (!stats[date]) {
      stats[date] = { volume: 0, count: 0 };
    }
    
    stats[date].volume += amount;
    stats[date].count++;
  });

  return Object.entries(stats).map(([date, { volume, count }]) => ({
    date,
    volume,
    count,
  }));
};
