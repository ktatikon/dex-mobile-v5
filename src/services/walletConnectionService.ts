import { supabase } from '@/integrations/supabase/client';
import { WalletOption } from '@/components/wallet/HotWalletOptions';
import { HardwareWalletOption } from '@/components/wallet/HardwareWalletOptions';

// Define the wallet connection interface
export interface WalletConnection {
  id: string;
  user_id: string;
  wallet_type: 'hot' | 'hardware';
  wallet_id: string;
  wallet_name: string;
  address: string;
  chain_id: string;
  is_active: boolean;
  created_at: string;
  last_connected: string | null;
}

// Save a hot wallet connection to Supabase
export const saveHotWalletConnection = async (
  userId: string,
  wallet: WalletOption,
  address: string,
  chainId: string = '1' // Default to Ethereum mainnet
): Promise<WalletConnection | null> => {
  try {
    // Check if the wallet connection already exists
    const { data: existingConnection, error: existingError } = await supabase
      .from('wallet_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('wallet_id', wallet.id)
      .eq('address', address)
      .single();

    if (existingConnection) {
      // Update the last_connected timestamp
      const { data: updatedConnection, error: updateError } = await supabase
        .from('wallet_connections')
        .update({
          last_connected: new Date().toISOString(),
          is_active: true
        })
        .eq('id', existingConnection.id)
        .select('*')
        .single();

      if (updateError) {
        console.error('Error updating wallet connection:', updateError);
        return null;
      }

      return updatedConnection;
    }

    // Create a new wallet connection
    const { data: newConnection, error: insertError } = await supabase
      .from('wallet_connections')
      .insert({
        user_id: userId,
        wallet_type: 'hot',
        wallet_id: wallet.id,
        wallet_name: wallet.name,
        address: address,
        chain_id: chainId,
        is_active: true,
        created_at: new Date().toISOString(),
        last_connected: new Date().toISOString()
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating wallet connection:', insertError);
      return null;
    }

    return newConnection;
  } catch (error) {
    console.error('Error saving hot wallet connection:', error);
    return null;
  }
};

// Save a hardware wallet connection to Supabase
export const saveHardwareWalletConnection = async (
  userId: string,
  wallet: HardwareWalletOption,
  address: string,
  chainId: string = '1' // Default to Ethereum mainnet
): Promise<WalletConnection | null> => {
  try {
    // Check if the wallet connection already exists
    const { data: existingConnection, error: existingError } = await supabase
      .from('wallet_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('wallet_id', wallet.id)
      .eq('address', address)
      .single();

    if (existingConnection) {
      // Update the last_connected timestamp
      const { data: updatedConnection, error: updateError } = await supabase
        .from('wallet_connections')
        .update({
          last_connected: new Date().toISOString(),
          is_active: true
        })
        .eq('id', existingConnection.id)
        .select('*')
        .single();

      if (updateError) {
        console.error('Error updating wallet connection:', updateError);
        return null;
      }

      return updatedConnection;
    }

    // Create a new wallet connection
    const { data: newConnection, error: insertError } = await supabase
      .from('wallet_connections')
      .insert({
        user_id: userId,
        wallet_type: 'hardware',
        wallet_id: wallet.id,
        wallet_name: wallet.name,
        address: address,
        chain_id: chainId,
        is_active: true,
        created_at: new Date().toISOString(),
        last_connected: new Date().toISOString()
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating wallet connection:', insertError);
      return null;
    }

    return newConnection;
  } catch (error) {
    console.error('Error saving hardware wallet connection:', error);
    return null;
  }
};

// Get all wallet connections for a user
export const getWalletConnections = async (
  userId: string
): Promise<WalletConnection[]> => {
  try {
    const { data, error } = await supabase
      .from('wallet_connections')
      .select('*')
      .eq('user_id', userId)
      .order('last_connected', { ascending: false });

    if (error) {
      console.error('Error fetching wallet connections:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting wallet connections:', error);
    return [];
  }
};

// Get active wallet connections for a user
export const getActiveWalletConnections = async (
  userId: string
): Promise<WalletConnection[]> => {
  try {
    const { data, error } = await supabase
      .from('wallet_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_connected', { ascending: false });

    if (error) {
      console.error('Error fetching active wallet connections:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting active wallet connections:', error);
    return [];
  }
};

// Disconnect a wallet connection
export const disconnectWalletConnection = async (
  connectionId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('wallet_connections')
      .update({
        is_active: false,
        last_connected: new Date().toISOString()
      })
      .eq('id', connectionId);

    if (error) {
      console.error('Error disconnecting wallet connection:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error disconnecting wallet connection:', error);
    return false;
  }
};

// Delete a wallet connection
export const deleteWalletConnection = async (
  connectionId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('wallet_connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      console.error('Error deleting wallet connection:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting wallet connection:', error);
    return false;
  }
};
