import { supabase } from '@/integrations/supabase/client';

export interface WalletPreferences {
  id: string;
  user_id: string;
  default_wallet_id: string;
  default_wallet_type: 'generated' | 'hot' | 'hardware';
  wallet_categories: { [walletId: string]: string };
  display_order: string[];
  created_at: string;
  updated_at: string;
}

export interface WalletCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export const DEFAULT_CATEGORIES: WalletCategory[] = [
  { id: 'personal', name: 'Personal', color: '#FF3B30', icon: 'User' },
  { id: 'business', name: 'Business', color: '#007AFF', icon: 'Briefcase' },
  { id: 'defi', name: 'DeFi', color: '#34C759', icon: 'TrendingUp' },
  { id: 'trading', name: 'Trading', color: '#FF9500', icon: 'BarChart3' },
  { id: 'savings', name: 'Savings', color: '#5856D6', icon: 'PiggyBank' },
  { id: 'other', name: 'Other', color: '#8E8E93', icon: 'Folder' }
];

/**
 * Get user wallet preferences
 * @param userId The user's ID
 * @returns User wallet preferences or null
 */
export const getUserWalletPreferences = async (userId: string): Promise<WalletPreferences | null> => {
  try {
    const { data, error } = await supabase
      .from('wallet_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching wallet preferences:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserWalletPreferences:', error);
    return null;
  }
};

/**
 * Create default wallet preferences for a user
 * @param userId The user's ID
 * @param defaultWalletId The default wallet ID
 * @param defaultWalletType The default wallet type
 * @returns Created preferences
 */
export const createDefaultWalletPreferences = async (
  userId: string,
  defaultWalletId: string,
  defaultWalletType: 'generated' | 'hot' | 'hardware'
): Promise<WalletPreferences | null> => {
  try {
    const { data, error } = await supabase
      .from('wallet_preferences')
      .insert({
        user_id: userId,
        default_wallet_id: defaultWalletId,
        default_wallet_type: defaultWalletType,
        wallet_categories: {},
        display_order: [defaultWalletId]
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating wallet preferences:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createDefaultWalletPreferences:', error);
    return null;
  }
};

/**
 * Update default wallet
 * @param userId The user's ID
 * @param walletId The new default wallet ID
 * @param walletType The wallet type
 * @returns Success status
 */
export const updateDefaultWallet = async (
  userId: string,
  walletId: string,
  walletType: 'generated' | 'hot' | 'hardware'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('wallet_preferences')
      .upsert({
        user_id: userId,
        default_wallet_id: walletId,
        default_wallet_type: walletType,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating default wallet:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateDefaultWallet:', error);
    return false;
  }
};

/**
 * Update wallet category
 * @param userId The user's ID
 * @param walletId The wallet ID
 * @param category The category name
 * @returns Success status
 */
export const updateWalletCategory = async (
  userId: string,
  walletId: string,
  category: string
): Promise<boolean> => {
  try {
    // First get current preferences
    const preferences = await getUserWalletPreferences(userId);
    if (!preferences) {
      return false;
    }

    const updatedCategories = {
      ...preferences.wallet_categories,
      [walletId]: category
    };

    const { error } = await supabase
      .from('wallet_preferences')
      .update({
        wallet_categories: updatedCategories,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating wallet category:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateWalletCategory:', error);
    return false;
  }
};

/**
 * Update wallet display order
 * @param userId The user's ID
 * @param walletIds Array of wallet IDs in desired order
 * @returns Success status
 */
export const updateWalletDisplayOrder = async (
  userId: string,
  walletIds: string[]
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('wallet_preferences')
      .update({
        display_order: walletIds,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating wallet display order:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateWalletDisplayOrder:', error);
    return false;
  }
};

/**
 * Get wallet category info
 * @param categoryId The category ID
 * @returns Category information
 */
export const getWalletCategoryInfo = (categoryId: string): WalletCategory => {
  return DEFAULT_CATEGORIES.find(cat => cat.id === categoryId) || DEFAULT_CATEGORIES[5]; // Default to 'other'
};

/**
 * Get all user wallets with preferences
 * @param userId The user's ID
 * @returns Combined wallet data with preferences
 */
export const getAllUserWalletsWithPreferences = async (userId: string) => {
  try {
    // Get all wallet types
    const [generatedWallets, hotWallets, hardwareWallets, preferences] = await Promise.all([
      supabase.from('generated_wallets').select('*').eq('user_id', userId),
      supabase.from('wallet_connections').select('*').eq('user_id', userId).eq('wallet_type', 'hot'),
      supabase.from('wallet_connections').select('*').eq('user_id', userId).eq('wallet_type', 'hardware'),
      getUserWalletPreferences(userId)
    ]);

    const allWallets = [
      ...(generatedWallets.data || []).map(w => ({ ...w, type: 'generated' as const })),
      ...(hotWallets.data || []).map(w => ({ ...w, type: 'hot' as const })),
      ...(hardwareWallets.data || []).map(w => ({ ...w, type: 'hardware' as const }))
    ];

    // Apply preferences
    if (preferences) {
      // Sort by display order
      const orderedWallets = [];
      const unorderedWallets = [];

      for (const wallet of allWallets) {
        const index = preferences.display_order.indexOf(wallet.id);
        if (index !== -1) {
          orderedWallets[index] = wallet;
        } else {
          unorderedWallets.push(wallet);
        }
      }

      // Combine ordered and unordered wallets
      const sortedWallets = [...orderedWallets.filter(Boolean), ...unorderedWallets];

      // Add category information
      return sortedWallets.map(wallet => ({
        ...wallet,
        category: preferences.wallet_categories[wallet.id] || 'personal',
        categoryInfo: getWalletCategoryInfo(preferences.wallet_categories[wallet.id] || 'personal'),
        isDefault: wallet.id === preferences.default_wallet_id
      }));
    }

    return allWallets.map(wallet => ({
      ...wallet,
      category: 'personal',
      categoryInfo: getWalletCategoryInfo('personal'),
      isDefault: false
    }));
  } catch (error) {
    console.error('Error in getAllUserWalletsWithPreferences:', error);
    return [];
  }
};
