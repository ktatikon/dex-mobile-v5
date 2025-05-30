import { supabase } from '@/integrations/supabase/client';

export interface WalletSettings {
  id: string;
  user_id: string;
  require_transaction_confirmation: boolean;
  biometric_auth_enabled: boolean;
  hide_small_balances: boolean;
  small_balance_threshold: number;
  default_currency: 'USD' | 'EUR' | 'GBP' | 'BTC' | 'ETH';
  privacy_mode_enabled: boolean;
  auto_lock_timeout: number; // in seconds
  slippage_tolerance: number; // percentage (0.01% - 50%)
  transaction_notifications: boolean;
  price_alerts_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_WALLET_SETTINGS: Omit<WalletSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  require_transaction_confirmation: true,
  biometric_auth_enabled: false,
  hide_small_balances: false,
  small_balance_threshold: 1.00,
  default_currency: 'USD',
  privacy_mode_enabled: false,
  auto_lock_timeout: 300, // 5 minutes
  slippage_tolerance: 0.50, // 0.5% default
  transaction_notifications: true,
  price_alerts_enabled: true
};

export const AUTO_LOCK_OPTIONS = [
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 900, label: '15 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 0, label: 'Never' }
];

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'US Dollar (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
  { value: 'GBP', label: 'British Pound (GBP)', symbol: '£' },
  { value: 'BTC', label: 'Bitcoin (BTC)', symbol: '₿' },
  { value: 'ETH', label: 'Ethereum (ETH)', symbol: 'Ξ' }
];

export const SLIPPAGE_TOLERANCE_PRESETS = [
  { value: 0.1, label: '0.1%' },
  { value: 0.5, label: '0.5%' },
  { value: 1.0, label: '1.0%' },
  { value: 3.0, label: '3.0%' }
];

/**
 * Validate slippage tolerance value
 * @param value The slippage tolerance percentage
 * @returns Validation result with error message if invalid
 */
export const validateSlippageTolerance = (value: number): { isValid: boolean; error?: string } => {
  if (isNaN(value)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  if (value < 0.01) {
    return { isValid: false, error: 'Slippage tolerance must be at least 0.01%' };
  }

  if (value > 50) {
    return { isValid: false, error: 'Slippage tolerance cannot exceed 50%' };
  }

  if (value > 5) {
    return { isValid: true, error: 'Warning: High slippage tolerance may result in unfavorable trades' };
  }

  return { isValid: true };
};

/**
 * Get wallet settings for a user
 * @param userId The user's ID
 * @returns User wallet settings or default settings
 */
export const getWalletSettings = async (userId: string): Promise<WalletSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('wallet_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching wallet settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getWalletSettings:', error);
    return null;
  }
};

/**
 * Create default wallet settings for a user
 * @param userId The user's ID
 * @returns Created wallet settings
 */
export const createDefaultWalletSettings = async (userId: string): Promise<WalletSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('wallet_settings')
      .insert({
        user_id: userId,
        ...DEFAULT_WALLET_SETTINGS
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating wallet settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createDefaultWalletSettings:', error);
    return null;
  }
};

/**
 * Update wallet settings for a user
 * @param userId The user's ID
 * @param settings Partial settings to update
 * @returns Updated wallet settings
 */
export const updateWalletSettings = async (
  userId: string,
  settings: Partial<Omit<WalletSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<WalletSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('wallet_settings')
      .update(settings)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating wallet settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateWalletSettings:', error);
    return null;
  }
};

/**
 * Get or create wallet settings for a user
 * @param userId The user's ID
 * @returns User wallet settings (existing or newly created)
 */
export const getOrCreateWalletSettings = async (userId: string): Promise<WalletSettings | null> => {
  try {
    let settings = await getWalletSettings(userId);

    if (!settings) {
      settings = await createDefaultWalletSettings(userId);
    }

    return settings;
  } catch (error) {
    console.error('Error in getOrCreateWalletSettings:', error);
    return null;
  }
};

/**
 * Update a specific wallet setting
 * @param userId The user's ID
 * @param settingKey The setting key to update
 * @param value The new value
 * @returns Success status
 */
export const updateWalletSetting = async (
  userId: string,
  settingKey: keyof Omit<WalletSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  value: any
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('wallet_settings')
      .update({ [settingKey]: value })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating wallet setting:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateWalletSetting:', error);
    return false;
  }
};

/**
 * Get currency symbol for a currency code
 * @param currency The currency code
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currency: string): string => {
  const option = CURRENCY_OPTIONS.find(opt => opt.value === currency);
  return option?.symbol || '$';
};

/**
 * Get auto-lock timeout label
 * @param timeout Timeout in seconds
 * @returns Human-readable label
 */
export const getAutoLockLabel = (timeout: number): string => {
  const option = AUTO_LOCK_OPTIONS.find(opt => opt.value === timeout);
  return option?.label || 'Unknown';
};

/**
 * Check if biometric authentication is available
 * @returns Promise<boolean> indicating availability
 */
export const isBiometricAuthAvailable = async (): Promise<boolean> => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return false;

    // Check for WebAuthn support
    if (!window.PublicKeyCredential) return false;

    // Check if biometric authentication is available
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
};

/**
 * Subscribe to wallet settings changes
 * @param userId The user's ID
 * @param callback Callback function for settings changes
 * @returns Unsubscribe function
 */
export const subscribeToWalletSettings = (
  userId: string,
  callback: (settings: WalletSettings | null) => void
) => {
  const subscription = supabase
    .channel('wallet_settings_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'wallet_settings',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          callback(null);
        } else {
          callback(payload.new as WalletSettings);
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};
