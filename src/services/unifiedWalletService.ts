/**
 * Unified Wallet Management Service
 * Handles wallet operations across all three database tables:
 * - wallets (unified table)
 * - generated_wallets (AI-generated wallets)
 * - wallet_connections (hot/hardware wallet connections)
 */

import { supabase } from '@/integrations/supabase/client';
import { deleteGeneratedWallet } from './walletGenerationService';

export interface UnifiedWallet {
  id: string;
  user_id: string;
  wallet_name: string;
  wallet_type: 'generated' | 'hot' | 'hardware';
  wallet_address: string;
  network: string;
  provider: string;
  source_table: 'generated_wallets' | 'wallet_connections';
  source_id: string;
  addresses: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all wallets for a user from the unified wallets table
 */
export const getAllUserWallets = async (userId: string): Promise<UnifiedWallet[]> => {
  try {
    console.log('🔄 Fetching all user wallets from unified table...');

    const { data: wallets, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching unified wallets:', error);
      throw error;
    }

    console.log(`✅ Successfully fetched ${wallets?.length || 0} unified wallets`);
    return wallets || [];
  } catch (error) {
    console.error('❌ Error in getAllUserWallets:', error);
    throw error;
  }
};

/**
 * Delete a wallet comprehensively from all tables
 */
export const deleteWalletComprehensively = async (
  walletId: string, 
  userId: string
): Promise<boolean> => {
  try {
    console.log('🗑️ Starting comprehensive wallet deletion for:', walletId);
    
    // Get wallet info first to determine source table
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('source_table, source_id')
      .eq('id', walletId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !wallet) {
      console.error('❌ Wallet not found in unified table:', fetchError);
      return false;
    }

    console.log(`📋 Wallet source: ${wallet.source_table}, source_id: ${wallet.source_id}`);

    // Step 1: Delete from source table
    if (wallet.source_table === 'generated_wallets') {
      try {
        const generatedSuccess = await deleteGeneratedWallet(wallet.source_id, userId);
        if (generatedSuccess) {
          console.log('✅ Deleted from generated_wallets table');
        } else {
          console.warn('⚠️ Generated wallet deletion returned false');
        }
      } catch (error) {
        console.error('❌ Generated wallet deletion failed:', error);
        return false;
      }
    } else if (wallet.source_table === 'wallet_connections') {
      try {
        const { error: connectionError } = await supabase
          .from('wallet_connections')
          .delete()
          .eq('id', wallet.source_id)
          .eq('user_id', userId);

        if (connectionError) {
          console.error('❌ Wallet connection deletion failed:', connectionError);
          return false;
        }
        console.log('✅ Deleted from wallet_connections table');
      } catch (error) {
        console.error('❌ Error deleting wallet connection:', error);
        return false;
      }
    }

    // Step 2: Delete from unified wallets table
    try {
      const { error: walletError } = await supabase
        .from('wallets')
        .delete()
        .eq('id', walletId)
        .eq('user_id', userId);

      if (walletError) {
        console.error('❌ Failed to delete from unified wallets table:', walletError);
        return false;
      }
      console.log('✅ Deleted from unified wallets table');
    } catch (error) {
      console.error('❌ Error deleting from unified wallets table:', error);
      return false;
    }

    // Step 3: Clean up related data
    try {
      // Delete wallet balances
      await supabase
        .from('wallet_balances')
        .delete()
        .eq('wallet_id', walletId)
        .eq('user_id', userId);

      // Delete wallet preferences that reference this wallet
      await supabase
        .from('wallet_preferences')
        .delete()
        .eq('default_wallet_id', walletId)
        .eq('user_id', userId);

      console.log('✅ Cleaned up related wallet data');
    } catch (error) {
      console.warn('⚠️ Some related data cleanup failed:', error);
    }

    console.log('✅ Comprehensive wallet deletion completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Comprehensive wallet deletion failed:', error);
    return false;
  }
};

/**
 * Sync wallet data across all tables (for manual synchronization)
 */
export const syncWalletTables = async (userId: string): Promise<boolean> => {
  try {
    console.log('🔄 Starting wallet table synchronization...');

    // This would trigger the database triggers to re-sync data
    // For now, we'll just verify the sync by checking counts
    const [generatedCount, connectionsCount, unifiedCount] = await Promise.all([
      supabase.from('generated_wallets').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('wallet_connections').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('wallets').select('id', { count: 'exact' }).eq('user_id', userId).eq('is_active', true)
    ]);

    console.log('📊 Wallet counts:');
    console.log(`  Generated wallets: ${generatedCount.count || 0}`);
    console.log(`  Wallet connections: ${connectionsCount.count || 0}`);
    console.log(`  Unified wallets: ${unifiedCount.count || 0}`);

    return true;
  } catch (error) {
    console.error('❌ Error syncing wallet tables:', error);
    return false;
  }
};

/**
 * Get wallet by ID from unified table
 */
export const getWalletById = async (walletId: string, userId: string): Promise<UnifiedWallet | null> => {
  try {
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', walletId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ Error fetching wallet by ID:', error);
      return null;
    }

    return wallet;
  } catch (error) {
    console.error('❌ Error in getWalletById:', error);
    return null;
  }
};

/**
 * Update wallet in unified table
 */
export const updateWallet = async (
  walletId: string,
  userId: string,
  updates: Partial<UnifiedWallet>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('wallets')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', walletId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error updating wallet:', error);
      return false;
    }

    console.log('✅ Wallet updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error in updateWallet:', error);
    return false;
  }
};
