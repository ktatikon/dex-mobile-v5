import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { TestnetNetwork } from '@/contexts/TestnetContext';

// Get testnet wallets for a user
export const getUserTestnetWallets = async (userId: string, network?: TestnetNetwork) => {
  try {
    let query = supabase
      .from('testnet_wallets')
      .select('*')
      .eq('user_id', userId);
    
    if (network) {
      query = query.eq('network', network);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching testnet wallets:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getUserTestnetWallets:', error);
    return [];
  }
};

// Get testnet transactions for a user
export const getUserTestnetTransactions = async (
  userId: string, 
  limit: number = 20, 
  network?: TestnetNetwork
) => {
  try {
    let query = supabase
      .from('testnet_transactions')
      .select(`
        id,
        transaction_type,
        from_address,
        to_address,
        amount,
        token_symbol,
        hash,
        network,
        status,
        timestamp
      `)
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (network) {
      query = query.eq('network', network);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching testnet transactions:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getUserTestnetTransactions:', error);
    return [];
  }
};

// Get testnet balances for a user
export const getUserTestnetBalances = async (
  userId: string, 
  walletId?: string, 
  network?: TestnetNetwork
) => {
  try {
    let query = supabase
      .from('testnet_balances')
      .select('*')
      .eq('user_id', userId);
    
    if (walletId) {
      query = query.eq('wallet_id', walletId);
    }
    
    if (network) {
      query = query.eq('network', network);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching testnet balances:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getUserTestnetBalances:', error);
    return [];
  }
};

// Create a new testnet wallet
export const createTestnetWallet = async (
  userId: string,
  name: string,
  network: TestnetNetwork,
  address: string,
  privateKey: string
) => {
  try {
    const walletId = uuidv4();
    
    const { data, error } = await supabase
      .from('testnet_wallets')
      .insert({
        id: walletId,
        user_id: userId,
        name,
        network,
        address,
        private_key: privateKey,
        balance: '0'
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating testnet wallet:', error);
      return null;
    }
    
    // Create initial balance record
    await supabase
      .from('testnet_balances')
      .insert({
        user_id: userId,
        wallet_id: walletId,
        token_symbol: network === 'solana-devnet' ? 'SOL' : 'ETH',
        token_name: network === 'solana-devnet' ? 'Solana' : 'Ethereum',
        balance: '0',
        network
      });
    
    return data.id;
  } catch (error) {
    console.error('Error in createTestnetWallet:', error);
    return null;
  }
};

// Update testnet wallet balance
export const updateTestnetWalletBalance = async (
  walletId: string,
  balance: string
) => {
  try {
    const { error } = await supabase
      .from('testnet_wallets')
      .update({ balance })
      .eq('id', walletId);
    
    if (error) {
      console.error('Error updating testnet wallet balance:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateTestnetWalletBalance:', error);
    return false;
  }
};

// Create a new testnet transaction
export const createTestnetTransaction = async (
  userId: string,
  walletId: string,
  transactionType: 'send' | 'receive',
  fromAddress: string,
  toAddress: string,
  amount: string,
  tokenSymbol: string,
  hash: string,
  network: TestnetNetwork,
  status: 'pending' | 'confirmed' | 'failed'
) => {
  try {
    const { data, error } = await supabase
      .from('testnet_transactions')
      .insert({
        id: uuidv4(),
        user_id: userId,
        wallet_id: walletId,
        transaction_type: transactionType,
        from_address: fromAddress,
        to_address: toAddress,
        amount,
        token_symbol,
        hash,
        network,
        status,
        timestamp: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating testnet transaction:', error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error('Error in createTestnetTransaction:', error);
    return null;
  }
};

// Update testnet transaction status
export const updateTestnetTransactionStatus = async (
  transactionId: string,
  status: 'pending' | 'confirmed' | 'failed'
) => {
  try {
    const { error } = await supabase
      .from('testnet_transactions')
      .update({ status })
      .eq('id', transactionId);
    
    if (error) {
      console.error('Error updating testnet transaction status:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateTestnetTransactionStatus:', error);
    return false;
  }
};
