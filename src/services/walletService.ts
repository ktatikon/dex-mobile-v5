import { supabase } from '@/integrations/supabase/client';
import { Token, Transaction, TransactionStatus, TransactionType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a default wallet for a new user
 * @param userId The user's ID
 * @returns The created wallet ID
 */
export async function createDefaultWallet(userId: string): Promise<string | null> {
  try {
    const walletId = uuidv4();
    const address = `0x${Math.random().toString(16).substring(2, 14)}...${Math.random().toString(16).substring(2, 6)}`;

    const { data, error } = await supabase
      .from('wallets')
      .insert({
        id: walletId,
        user_id: userId,
        name: 'Hot Wallet',
        wallet_type: 'hot',
        address: address
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating default wallet:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in createDefaultWallet:', error);
    return null;
  }
}

/**
 * Creates a cold wallet for a user
 * @param userId The user's ID
 * @returns The created wallet ID
 */
export async function createColdWallet(userId: string): Promise<string | null> {
  try {
    const walletId = uuidv4();
    const address = `0x${Math.random().toString(16).substring(2, 14)}...${Math.random().toString(16).substring(2, 6)}`;

    const { data, error } = await supabase
      .from('wallets')
      .insert({
        id: walletId,
        user_id: userId,
        name: 'Cold Wallet',
        wallet_type: 'cold',
        address: address
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating cold wallet:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in createColdWallet:', error);
    return null;
  }
}

/**
 * Gets all wallets for a user
 * @param userId The user's ID
 * @returns Array of wallets
 */
export async function getUserWallets(userId: string) {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user wallets:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserWallets:', error);
    return [];
  }
}

/**
 * Gets wallet balances for a user
 * @param userId The user's ID
 * @param walletType Optional wallet type filter ('hot' or 'cold')
 * @returns Array of wallet balances with token information
 */
export async function getWalletBalances(userId: string, walletType?: 'hot' | 'cold') {
  try {
    // First get the user's wallets
    let query = supabase
      .from('wallets')
      .select('id, wallet_type')
      .eq('user_id', userId);

    if (walletType) {
      query = query.eq('wallet_type', walletType);
    }

    const { data: wallets, error: walletError } = await query;

    if (walletError) {
      console.error('Error fetching wallets:', walletError);
      return [];
    }

    if (!wallets || wallets.length === 0) {
      return [];
    }

    const walletIds = wallets.map(wallet => wallet.id);

    // Then get balances for those wallets with token information
    const { data, error } = await supabase
      .from('wallet_balances')
      .select(`
        id,
        balance,
        wallet_id,
        token_id,
        tokens:token_id (
          id,
          symbol,
          name,
          logo,
          decimals,
          price,
          price_change_24h
        )
      `)
      .eq('user_id', userId)
      .in('wallet_id', walletIds);

    if (error) {
      console.error('Error fetching wallet balances:', error);
      return [];
    }

    // Transform the data to match our Token type
    return (data || []).map(item => ({
      id: item.tokens.id,
      symbol: item.tokens.symbol,
      name: item.tokens.name,
      logo: item.tokens.logo,
      decimals: item.tokens.decimals,
      balance: item.balance,
      price: item.tokens.price,
      priceChange24h: item.tokens.price_change_24h,
      walletId: item.wallet_id
    }));
  } catch (error) {
    console.error('Error in getWalletBalances:', error);
    return [];
  }
}

/**
 * Gets transactions for a user
 * @param userId The user's ID
 * @param limit Optional limit on number of transactions
 * @returns Array of transactions
 */
export async function getUserTransactions(userId: string, limit?: number) {
  try {
    let query = supabase
      .from('transactions')
      .select(`
        id,
        transaction_type,
        from_amount,
        to_amount,
        timestamp,
        hash,
        status,
        from_tokens:from_token_id (
          id,
          symbol,
          name,
          logo,
          decimals
        ),
        to_tokens:to_token_id (
          id,
          symbol,
          name,
          logo,
          decimals
        )
      `)
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user transactions:', error);
      return [];
    }

    // Transform the data to match our Transaction type
    return (data || []).map(item => ({
      id: item.id,
      type: item.transaction_type as TransactionType,
      fromToken: item.from_tokens,
      toToken: item.to_tokens,
      fromAmount: item.from_amount,
      toAmount: item.to_amount,
      timestamp: new Date(item.timestamp).getTime(),
      hash: item.hash,
      status: item.status as TransactionStatus,
      account: userId
    }));
  } catch (error) {
    console.error('Error in getUserTransactions:', error);
    return [];
  }
}
