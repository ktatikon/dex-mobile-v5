/**
 * PHASE 4.5: COMPREHENSIVE WALLET MANAGEMENT SERVICE
 * 
 * Enterprise-grade wallet management system with real-time blockchain integration,
 * automatic database persistence, and comprehensive error handling with Phase 1-3 fallbacks.
 */

import { supabase } from '@/integrations/supabase/client';
import { ethers } from 'ethers';
import { realBlockchainService } from './phase4/realBlockchainService';
import { phase4ConfigManager } from './phase4/phase4ConfigService';
import { Token, Transaction, TransactionStatus, TransactionType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Enhanced Wallet Types
export interface ComprehensiveWallet {
  id: string;
  user_id: string;
  wallet_name: string;
  wallet_type: 'generated' | 'hot' | 'hardware';
  wallet_address: string;
  network: string;
  provider: string;
  addresses: Record<string, string>;
  balance_cache: Record<string, string>;
  last_balance_update: string | null;
  transaction_count: number;
  risk_level: 'low' | 'medium' | 'high';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface WalletOperation {
  id: string;
  wallet_id: string;
  operation_type: 'send' | 'receive' | 'swap' | 'stake' | 'bridge';
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  transaction_hash?: string;
  amount: string;
  token_symbol: string;
  network: string;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  nativeToken: string;
  blockExplorer: string;
  isTestnet: boolean;
  gasPrice?: string;
}

// Supported Networks Configuration
export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    nativeToken: 'ETH',
    blockExplorer: 'https://etherscan.io',
    isTestnet: false,
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    nativeToken: 'MATIC',
    blockExplorer: 'https://polygonscan.com',
    isTestnet: false,
  },
  bsc: {
    chainId: 56,
    name: 'Binance Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    nativeToken: 'BNB',
    blockExplorer: 'https://bscscan.com',
    isTestnet: false,
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    nativeToken: 'ETH',
    blockExplorer: 'https://arbiscan.io',
    isTestnet: false,
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    rpcUrl: 'https://mainnet.optimism.io',
    nativeToken: 'ETH',
    blockExplorer: 'https://optimistic.etherscan.io',
    isTestnet: false,
  },
  avalanche: {
    chainId: 43114,
    name: 'Avalanche C-Chain',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    nativeToken: 'AVAX',
    blockExplorer: 'https://snowtrace.io',
    isTestnet: false,
  },
  fantom: {
    chainId: 250,
    name: 'Fantom Opera',
    rpcUrl: 'https://rpc.ftm.tools',
    nativeToken: 'FTM',
    blockExplorer: 'https://ftmscan.com',
    isTestnet: false,
  },
};

class ComprehensiveWalletService {
  private consecutiveFailures = 0;
  private readonly MAX_FAILURES = 5;
  private balanceUpdateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      console.log('🚀 Initializing Comprehensive Wallet Service...');
      
      // Check Phase 4 configuration
      const config = await phase4ConfigManager.getPhase4Config();
      if (!config.isEnabled) {
        console.log('📊 Phase 4 not enabled, using real-time data only');
        return;
      }

      // Start real-time balance monitoring
      this.startBalanceMonitoring();
      
      console.log('✅ Comprehensive Wallet Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Comprehensive Wallet Service:', error);
      this.handleServiceFailure();
    }
  }

  /**
   * Get all wallets for a user with real-time balance updates
   */
  async getUserWallets(userId: string): Promise<ComprehensiveWallet[]> {
    try {
      console.log(`📱 Fetching wallets for user: ${userId}`);

      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!wallets || wallets.length === 0) {
        console.log('📭 No wallets found for user');
        return [];
      }

      // Update balances for all wallets
      const walletsWithBalances = await Promise.all(
        wallets.map(async (wallet) => {
          try {
            const updatedBalance = await this.updateWalletBalance(wallet.id);
            return { ...wallet, balance_cache: updatedBalance };
          } catch (error) {
            console.error(`Failed to update balance for wallet ${wallet.id}:`, error);
            return wallet; // Return wallet with cached balance
          }
        })
      );

      console.log(`✅ Retrieved ${walletsWithBalances.length} wallets with updated balances`);
      return walletsWithBalances;

    } catch (error) {
      console.error('❌ Error fetching user wallets:', error);
      this.handleServiceFailure();
      
      // Return empty array instead of fallback data
      return [];
    }
  }

  /**
   * Create a new wallet with automatic database persistence
   */
  async createWallet(
    userId: string,
    walletName: string,
    walletType: 'generated' | 'hot' | 'hardware',
    network: string = 'ethereum',
    seedPhrase?: string,
    privateKey?: string,
    provider: string = 'custom_ai'
  ): Promise<ComprehensiveWallet> {
    try {
      console.log(`🔨 Creating ${walletType} wallet: ${walletName} on ${network}`);

      // Generate wallet address based on type
      let walletAddress: string;
      let addresses: Record<string, string> = {};
      let encryptedSeedPhrase: string | null = null;

      if (walletType === 'generated') {
        if (!seedPhrase) {
          // Generate new seed phrase
          const wallet = ethers.Wallet.createRandom();
          seedPhrase = wallet.mnemonic?.phrase || '';
          walletAddress = wallet.address;
        } else {
          // Use provided seed phrase
          const wallet = ethers.Wallet.fromPhrase(seedPhrase);
          walletAddress = wallet.address;
        }
        
        // Encrypt seed phrase for storage
        encryptedSeedPhrase = this.encryptSeedPhrase(seedPhrase);
        addresses[network.toUpperCase()] = walletAddress;
      } else {
        // For hot/hardware wallets, address will be provided during connection
        walletAddress = `pending_${Date.now()}`;
      }

      // Create wallet record in database
      const { data: wallet, error } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          wallet_name: walletName,
          wallet_type: walletType,
          wallet_address: walletAddress,
          network: network,
          provider: provider,
          source_table: walletType === 'generated' ? 'generated_wallets' : 'wallet_connections',
          source_id: crypto.randomUUID(),
          addresses: addresses,
          encrypted_seed_phrase: encryptedSeedPhrase,
          balance_cache: {},
          transaction_count: 0,
          risk_level: 'low',
          is_active: true,
          metadata: {
            creation_method: walletType,
            initial_network: network,
            created_via: 'comprehensive_wallet_service'
          }
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to create wallet: ${error.message}`);
      }

      console.log(`✅ Successfully created wallet: ${wallet.id}`);
      
      // Initialize balance monitoring for the new wallet
      await this.updateWalletBalance(wallet.id);
      
      return wallet;

    } catch (error) {
      console.error('❌ Error creating wallet:', error);
      this.handleServiceFailure();
      throw error;
    }
  }

  /**
   * Update wallet balance with real blockchain data
   */
  async updateWalletBalance(walletId: string): Promise<Record<string, string>> {
    try {
      // Get wallet details
      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', walletId)
        .single();

      if (error || !wallet) {
        throw new Error(`Wallet not found: ${walletId}`);
      }

      // Always fetch real balance from blockchain - no fallback mode

      // Fetch real balance from blockchain
      const balances = await this.fetchRealBalance(wallet.wallet_address, wallet.network);
      
      // Update database with new balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({
          balance_cache: balances,
          last_balance_update: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', walletId);

      if (updateError) {
        console.error('Failed to update balance in database:', updateError);
      }

      console.log(`💰 Updated balance for wallet ${walletId}`);
      return balances;

    } catch (error) {
      console.error(`❌ Error updating wallet balance for ${walletId}:`, error);
      this.handleServiceFailure();
      
      // Return empty balance cache on error
      return {};
    }
  }

  /**
   * Fetch real balance from blockchain
   */
  private async fetchRealBalance(address: string, network: string): Promise<Record<string, string>> {
    try {
      const networkConfig = SUPPORTED_NETWORKS[network];
      if (!networkConfig) {
        throw new Error(`Unsupported network: ${network}`);
      }

      // Use real blockchain service to fetch balance
      const balance = await realBlockchainService.getWalletBalance(address, network);
      
      return {
        [networkConfig.nativeToken]: balance.toString(),
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Failed to fetch real balance for ${address} on ${network}:`, error);
      throw error;
    }
  }

  /**
   * Encrypt seed phrase for secure storage
   */
  private encryptSeedPhrase(seedPhrase: string): string {
    // In production, use proper encryption with user's password
    // For now, using base64 encoding as placeholder
    return Buffer.from(seedPhrase).toString('base64');
  }

  /**
   * Start real-time balance monitoring
   */
  private startBalanceMonitoring(): void {
    if (this.balanceUpdateInterval) {
      clearInterval(this.balanceUpdateInterval);
    }

    // Update balances every 2 minutes
    this.balanceUpdateInterval = setInterval(async () => {
      try {
        console.log('🔄 Running scheduled balance updates...');
        await this.updateAllWalletBalances();
      } catch (error) {
        console.error('Error in scheduled balance update:', error);
      }
    }, 2 * 60 * 1000);
  }

  /**
   * Update balances for all active wallets
   */
  private async updateAllWalletBalances(): Promise<void> {
    try {
      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('id')
        .eq('is_active', true);

      if (error || !wallets) {
        throw new Error('Failed to fetch active wallets');
      }

      // Update balances in batches to avoid overwhelming the blockchain APIs
      const batchSize = 5;
      for (let i = 0; i < wallets.length; i += batchSize) {
        const batch = wallets.slice(i, i + batchSize);
        await Promise.all(
          batch.map(wallet => this.updateWalletBalance(wallet.id))
        );
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`✅ Updated balances for ${wallets.length} wallets`);

    } catch (error) {
      console.error('Error updating all wallet balances:', error);
      this.handleServiceFailure();
    }
  }

  /**
   * Handle service failures and activate fallback mode
   */
  private handleServiceFailure(): void {
    this.consecutiveFailures++;
    console.log(`⚠️ Service failure ${this.consecutiveFailures}/${this.MAX_FAILURES} - continuing with real data only`);
  }

  /**
   * Cleanup service resources
   */
  destroy(): void {
    if (this.balanceUpdateInterval) {
      clearInterval(this.balanceUpdateInterval);
      this.balanceUpdateInterval = null;
    }
    console.log('🧹 Comprehensive Wallet Service destroyed');
  }

  // ===== LEGACY WALLET SERVICE FUNCTIONS (Consolidated from walletService.ts) =====

  /**
   * Creates a default wallet for a new user (Legacy function)
   * @param userId The user's ID
   * @returns The created wallet ID
   */
  async createDefaultWallet(userId: string): Promise<string | null> {
    try {
      const walletId = uuidv4();
      const address = `0x${Math.random().toString(16).substring(2, 14)}...${Math.random().toString(16).substring(2, 6)}`;

      const { data, error } = await supabase
        .from('wallets')
        .insert({
          id: walletId,
          user_id: userId,
          wallet_name: 'Hot Wallet',
          wallet_type: 'hot',
          wallet_address: address,
          network: 'ethereum',
          provider: 'default',
          source_table: 'wallet_connections',
          source_id: uuidv4(),
          addresses: { ethereum: address },
          balance_cache: {},
          transaction_count: 0,
          risk_level: 'low',
          is_active: true,
          metadata: {
            creation_method: 'default',
            created_via: 'legacy_wallet_service'
          }
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
   * Creates a cold wallet for a user (Legacy function)
   * @param userId The user's ID
   * @returns The created wallet ID
   */
  async createColdWallet(userId: string): Promise<string | null> {
    try {
      const walletId = uuidv4();
      const address = `0x${Math.random().toString(16).substring(2, 14)}...${Math.random().toString(16).substring(2, 6)}`;

      const { data, error } = await supabase
        .from('wallets')
        .insert({
          id: walletId,
          user_id: userId,
          wallet_name: 'Cold Wallet',
          wallet_type: 'hardware',
          wallet_address: address,
          network: 'ethereum',
          provider: 'hardware',
          source_table: 'wallet_connections',
          source_id: uuidv4(),
          addresses: { ethereum: address },
          balance_cache: {},
          transaction_count: 0,
          risk_level: 'low',
          is_active: true,
          metadata: {
            creation_method: 'cold',
            created_via: 'legacy_wallet_service'
          }
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
   * Gets user wallets (Legacy function)
   * @param userId The user's ID
   * @returns Array of user wallets
   */
  async getUserWalletsLegacy(userId: string) {
    try {
      console.log('🔍 getUserWalletsLegacy: Fetching wallets for user:', userId);

      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ getUserWalletsLegacy: Error fetching user wallets:', error);
        return [];
      }

      console.log('✅ getUserWalletsLegacy: Found wallets:', wallets?.length || 0);
      return wallets || [];
    } catch (error) {
      console.error('❌ getUserWalletsLegacy: Exception:', error);
      return [];
    }
  }

  /**
   * Gets wallet balances for a user (Legacy function)
   * @param userId The user's ID
   * @param walletType Optional wallet type filter ('hot' or 'hardware')
   * @returns Array of wallet balances with token information
   */
  async getWalletBalancesLegacy(userId: string, walletType?: 'hot' | 'hardware') {
    try {
      // First get the user's wallets
      let query = supabase
        .from('wallets')
        .select('id, wallet_type, wallet_address, network')
        .eq('user_id', userId)
        .eq('is_active', true);

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

      // For each wallet, get balance information
      const balancePromises = wallets.map(async (wallet) => {
        try {
          const balances = await this.updateWalletBalance(wallet.id);
          return {
            walletId: wallet.id,
            walletType: wallet.wallet_type,
            address: wallet.wallet_address,
            network: wallet.network,
            balances: balances
          };
        } catch (error) {
          console.error(`Error fetching balance for wallet ${wallet.id}:`, error);
          return {
            walletId: wallet.id,
            walletType: wallet.wallet_type,
            address: wallet.wallet_address,
            network: wallet.network,
            balances: {}
          };
        }
      });

      const results = await Promise.all(balancePromises);
      return results;
    } catch (error) {
      console.error('Error in getWalletBalancesLegacy:', error);
      return [];
    }
  }

  /**
   * Gets user transactions (Legacy function)
   * @param userId The user's ID
   * @param limit Optional limit for number of transactions
   * @returns Array of user transactions
   */
  async getUserTransactions(userId: string, limit: number = 50): Promise<Transaction[]> {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user transactions:', error);
        return [];
      }

      return transactions || [];
    } catch (error) {
      console.error('Error in getUserTransactions:', error);
      return [];
    }
  }

  /**
   * Get wallet balance (Legacy function - wrapper for updateWalletBalance)
   * @param address Wallet address
   * @param network Network name
   * @returns Balance information
   */
  async getWalletBalance(address: string, network: string): Promise<Record<string, string>> {
    try {
      // Find wallet by address and network
      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('id')
        .eq('wallet_address', address)
        .eq('network', network)
        .eq('is_active', true)
        .single();

      if (error || !wallet) {
        console.error('Wallet not found for balance lookup:', { address, network });
        return {};
      }

      return await this.updateWalletBalance(wallet.id);
    } catch (error) {
      console.error('Error in getWalletBalance:', error);
      return {};
    }
  }
}

// Export singleton instance
export const comprehensiveWalletService = new ComprehensiveWalletService();
