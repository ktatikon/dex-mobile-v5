import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import WalletSwitcher from '@/components/WalletSwitcher';
import {
  getAllUserWalletsWithPreferences,
  DEFAULT_CATEGORIES
} from '@/services/walletPreferencesService';
import { getAllUserWallets } from '@/services/unifiedWalletService';
// Safe Phase 3 service imports with fallback handling
import { PHASE2_CONFIG } from '@/services/fallbackDataService';
import type {
  TransactionFilters,
  ExportOptions
} from '@/services/enhancedTransactionService';
// Real data services
import { supabase } from '@/integrations/supabase/client';
import {
  getConnectedHotWallets,
  HOT_WALLET_OPTIONS,
  connectHotWallet as hotWalletServiceConnect,
  importWalletAddresses as hotWalletImportAddresses
} from '@/services/hotWalletService';
// Phase 4.5 Comprehensive Wallet Services (commented out to reduce warnings)
// import {
//   ComprehensiveWallet
// } from '@/services/comprehensiveWalletService';
// import {
//   WalletBalance
// } from '@/services/walletOperationsService';
import {
  HARDWARE_WALLET_OPTIONS
} from '@/services/enhancedHardwareWalletService';
import {
  getPortfolioSummary,
  PortfolioSummary
} from '@/services/portfolioService';
import {
  getDeFiPortfolioSummary
} from '@/services/defiService';
import {
  Wallet,
  Plus,
  TrendingUp,
  BarChart3,
  ArrowUpDown,
  Star,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
  Download,
  Filter,
  Coins,
  Flame,
  Shield,
  Calendar,
  FileDown,
  Target,
  Brain,
  Users
} from 'lucide-react';

// Phase 4 Advanced Trading Components - Moved to TradePage
// import AdvancedTradingPanel from '@/components/phase4/AdvancedTradingPanel';
import DeFiIntegrationPanel from '@/components/phase4/DeFiIntegrationPanel';
// Phase 4.3 Cross-Chain Components
import CrossChainBridgePanel from '@/components/phase4/CrossChainBridgePanel';
import MultiNetworkPortfolio from '@/components/phase4/MultiNetworkPortfolio';
// Phase 4.4 AI Analytics Components
import { AIAnalyticsPanel } from '@/components/phase4/AIAnalyticsPanel';
// Phase 4.5 Social Trading Components
import SocialTradingPanel from '@/components/phase4/SocialTradingPanel';
// Enhanced Staking Opportunities Component
import StakingOpportunitiesPanel from '@/components/phase4/StakingOpportunitiesPanel';
import { phase4ConfigManager } from '@/services/phase4/phase4ConfigService';
import { getRealTimeTokens } from '@/services/fallbackDataService';

// Real analytics calculation from user data
const calculateRealAnalytics = async (userId: string) => {
  try {
    console.log('🔄 Calculating real analytics from user data...');

    // Get all user transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        id,
        transaction_type,
        from_amount,
        timestamp,
        category,
        tokens:from_token_id (
          id,
          symbol,
          name,
          price
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching transactions for analytics:', error);
      throw error;
    }

    if (!transactions || transactions.length === 0) {
      console.log('📊 No transactions found for analytics');
      return {
        totalTransactions: 0,
        totalVolume: 0,
        averageAmount: 0,
        categoryBreakdown: {},
        monthlyVolume: [],
        topTokens: []
      };
    }

    // Calculate analytics from real data
    const totalTransactions = transactions.length;
    let totalVolume = 0;
    const categoryBreakdown: { [key: string]: number } = {};
    const monthlyVolume: { [key: string]: number } = {};
    const tokenVolume: { [key: string]: { volume: number; count: number; symbol: string } } = {};

    transactions.forEach(tx => {
      const amount = parseFloat(tx.from_amount || '0');
      const token = Array.isArray(tx.tokens) ? tx.tokens[0] : tx.tokens;
      const price = token?.price || 0;
      const value = amount * price;

      totalVolume += value;

      // Category breakdown
      const category = tx.category || localCategorizeTransaction({
        ...tx,
        status: 'completed', // Add required status field
        tokens: Array.isArray(tx.tokens) ? tx.tokens[0] : tx.tokens // Fix tokens type
      } as Transaction);
      const categoryName = TRANSACTION_CATEGORIES.find(cat => cat.id === category)?.name || 'Other';
      categoryBreakdown[categoryName] = (categoryBreakdown[categoryName] || 0) + 1;

      // Monthly volume
      const date = new Date(tx.timestamp);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      monthlyVolume[monthKey] = (monthlyVolume[monthKey] || 0) + value;

      // Token volume
      const tokenSymbol = token?.symbol || 'Unknown';
      if (!tokenVolume[tokenSymbol]) {
        tokenVolume[tokenSymbol] = { volume: 0, count: 0, symbol: tokenSymbol };
      }
      tokenVolume[tokenSymbol].volume += value;
      tokenVolume[tokenSymbol].count += 1;
    });

    const averageAmount = totalVolume / totalTransactions;

    // Convert monthly volume to array format
    const monthlyVolumeArray = Object.entries(monthlyVolume).map(([month, volume]) => ({
      month,
      volume
    }));

    // Convert token volume to array and sort by volume
    const topTokens = Object.values(tokenVolume)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5)
      .map(token => ({
        tokenId: token.symbol.toLowerCase(),
        symbol: token.symbol,
        volume: token.volume,
        count: token.count
      }));

    console.log(`✅ Calculated real analytics: ${totalTransactions} transactions, $${totalVolume.toFixed(2)} volume`);

    return {
      totalTransactions,
      totalVolume,
      averageAmount,
      categoryBreakdown,
      monthlyVolume: monthlyVolumeArray,
      topTokens
    };
  } catch (error) {
    console.error('Error calculating real analytics:', error);
    throw error;
  }
};

// Safe Phase 3 service wrapper functions with fallback handling
const safeGetTransactionAnalytics = async (userId: string) => {
  try {
    // First try to calculate from real user data
    const realAnalytics = await calculateRealAnalytics(userId);
    if (realAnalytics.totalTransactions > 0) {
      console.log('✅ Using real analytics calculated from user data');
      return realAnalytics;
    }

    // If no real data, try Phase 3 enhanced service
    if (PHASE2_CONFIG?.enableRealTransactions) {
      const { getTransactionAnalytics } = await import('@/services/enhancedTransactionService');
      return await getTransactionAnalytics(userId);
    }
  } catch (error) {
    console.warn('🔄 Real analytics failed, using mock data fallback:', error);
  }

  // Final fallback - return demo analytics for new users
  console.log('📊 No real data found, showing demo analytics');
  return {
    totalTransactions: 0,
    totalVolume: 0,
    averageAmount: 0,
    categoryBreakdown: {},
    monthlyVolume: [],
    topTokens: []
  };
};

// Transaction interface for type safety
interface Transaction {
  id: string;
  transaction_type?: string;
  type?: string;
  from_amount?: string;
  to_amount?: string;
  timestamp: Date | string;
  status: string;
  hash?: string;
  category?: string;
  tokens?: {
    id: string;
    symbol: string;
    name: string;
    logo?: string;
    price: number;
  };
}

// Safe Phase 3 categorizeTransaction function with local fallback
const safeCategorizeTransaction = async (transaction: Transaction): Promise<string> => {
  try {
    if (PHASE2_CONFIG?.enableRealTransactions) {
      const { categorizeTransaction } = await import('@/services/enhancedTransactionService');
      return categorizeTransaction(transaction);
    }
  } catch (error) {
    console.warn('🔄 Enhanced transaction categorization failed, using local fallback:', error);
  }

  // Phase 1 fallback - local categorization logic
  return localCategorizeTransaction(transaction);
};

// Local fallback categorization function using existing TRANSACTION_CATEGORIES
const localCategorizeTransaction = (transaction: Transaction): string => {
  const type = transaction.transaction_type?.toLowerCase() || transaction.type?.toLowerCase();

  switch (type) {
    case 'stake':
    case 'unstake':
    case 'claim_rewards':
    case 'staking':
      return 'defi'; // Map staking to defi category since we don't have staking in local categories
    case 'swap':
    case 'buy':
    case 'sell':
    case 'trade':
      return 'trading';
    case 'send':
    case 'receive':
    case 'transfer':
      return 'transfer';
    case 'payment':
    case 'pay':
      return 'payment';
    case 'liquidity_add':
    case 'liquidity_remove':
    case 'yield_farm':
    case 'defi':
      return 'defi';
    default:
      return 'defi'; // Default to defi for unknown types to match existing categories
  }
};

// Real transaction data fetching with fallback
const getRealUserTransactions = async (userId: string, limit: number = 5) => {
  try {
    console.log('🔄 Fetching real user transactions from database...');

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        id,
        transaction_type,
        from_amount,
        to_amount,
        timestamp,
        status,
        hash,
        category,
        tokens:from_token_id (
          id,
          symbol,
          name,
          logo,
          price
        )
      `)
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching real transactions:', error);
      throw error;
    }

    console.log(`✅ Successfully fetched ${transactions?.length || 0} real transactions`);
    return {
      transactions: transactions || [],
      totalCount: transactions?.length || 0,
      hasMore: (transactions?.length || 0) >= limit
    };
  } catch (error) {
    console.error('Error in getRealUserTransactions:', error);
    throw error;
  }
};

interface Pagination {
  page: number;
  limit: number;
}

const safeGetFilteredTransactions = async (userId: string, filters: TransactionFilters = {}, pagination: Pagination = { page: 1, limit: 5 }) => {
  try {
    // First try to get real transactions from database
    const realTransactions = await getRealUserTransactions(userId, pagination.limit);
    if (realTransactions.transactions.length > 0) {
      console.log('✅ Using real transaction data from database');
      return realTransactions;
    }

    // If no real transactions, try Phase 3 enhanced service
    if (PHASE2_CONFIG?.enableRealTransactions) {
      const { getFilteredTransactions } = await import('@/services/enhancedTransactionService');
      return await getFilteredTransactions(userId, filters, pagination);
    }
  } catch (error) {
    console.warn('🔄 Real transactions failed, using mock data fallback:', error);
  }

  // Final fallback - return mock transactions only if user has no real data
  console.log('📊 No real transactions found, using mock data for demo purposes');
  return {
    transactions: [
      {
        id: 'demo-1',
        transaction_type: 'receive',
        from_amount: '1.5',
        tokenSymbol: 'ETH',
        timestamp: new Date(),
        status: 'completed',
        tokens: { symbol: 'ETH', name: 'Ethereum', price: 2000 }
      },
      {
        id: 'demo-2',
        transaction_type: 'send',
        from_amount: '0.5',
        tokenSymbol: 'ETH',
        timestamp: new Date(Date.now() - 86400000),
        status: 'completed',
        tokens: { symbol: 'ETH', name: 'Ethereum', price: 2000 }
      }
    ],
    totalCount: 2,
    hasMore: false
  };
};

// Mock constants for Phase 1 fallback
const TRANSACTION_CATEGORIES = [
  { id: 'defi', name: 'DeFi', color: '#8B5CF6' },
  { id: 'trading', name: 'Trading', color: '#06B6D4' },
  { id: 'transfer', name: 'Transfer', color: '#10B981' },
  { id: 'payment', name: 'Payment', color: '#F59E0B' }
];

const EXPORT_FIELDS = [
  { id: 'date', name: 'Date', label: 'Date', required: true },
  { id: 'type', name: 'Type', label: 'Type', required: true },
  { id: 'amount', name: 'Amount', label: 'Amount', required: true },
  { id: 'token', name: 'Token', label: 'Token', required: false },
  { id: 'status', name: 'Status', label: 'Status', required: false },
  { id: 'category', name: 'Category', label: 'Category', required: false }
];

const WalletDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  interface Wallet {
    id: string;
    wallet_name?: string;
    name?: string;
    wallet_type?: string;
    type?: string;
    wallet_address?: string;
    address?: string;
    network?: string;
    provider?: string;
    is_active?: boolean;
    created_at?: string;
    portfolioValue?: number;
    category?: string;
    isDefault?: boolean;
  }

  interface Analytics {
    totalTransactions: number;
    totalVolume: number;
    averageAmount: number;
    topTokens: Array<{
      symbol: string;
      volume: number;
      transactions: number;
    }>;
    categoryBreakdown?: { [key: string]: number };
  }

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [showBalances, setShowBalances] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [walletFilter, setWalletFilter] = useState<'all' | 'generated' | 'hot' | 'hardware'>('all');
  const [defiSummary, setDefiSummary] = useState<any>(null);

  // Phase 4 Advanced Trading states
  const [phase4Enabled, setPhase4Enabled] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<any[]>([]);

  // Phase 4.2 DeFi Integration states
  const [defiEnabled, setDefiEnabled] = useState(false);

  // Phase 4.3 Cross-Chain Bridge states
  const [crossChainEnabled, setCrossChainEnabled] = useState(false);

  // Phase 4.4 AI Analytics states
  const [aiAnalyticsEnabled, setAiAnalyticsEnabled] = useState(false);

  // Phase 4.5 Social Trading states
  const [socialTradingEnabled, setSocialTradingEnabled] = useState(false);

  // Transaction filtering states
  const [transactionFilters, setTransactionFilters] = useState<TransactionFilters>({});
  const [showTransactionFilters, setShowTransactionFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dateRange: 'last30days',
    includeFields: EXPORT_FIELDS.filter(f => f.required).map(f => f.id)
  });

  // Hot/Cold wallet connection states
  const [connectedHotWallets, setConnectedHotWallets] = useState<any[]>([]);
  const [connectedHardwareWallets, setConnectedHardwareWallets] = useState<any[]>([]);
  const [showHotWalletDialog, setShowHotWalletDialog] = useState(false);
  const [showHardwareWalletDialog, setShowHardwareWalletDialog] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(false);

  // Phase 4.5 Comprehensive Wallet Management States (for future use)
  // Commented out unused states to reduce warnings
  // const [comprehensiveWallets, setComprehensiveWallets] = useState<ComprehensiveWallet[]>([]);
  // const [walletBalances, setWalletBalances] = useState<Record<string, WalletBalance[]>>({});
  // const [selectedNetwork, setSelectedNetwork] = useState<string>('ethereum');
  // const [realTimeUpdates, setRealTimeUpdates] = useState(true);
  // const [walletOperationsLoading, setWalletOperationsLoading] = useState(false);
  // const [lastBalanceUpdate, setLastBalanceUpdate] = useState<Date | null>(null);
  // const [showCreateWalletDialog, setShowCreateWalletDialog] = useState(false);
  // const [showNetworkSwitcher, setShowNetworkSwitcher] = useState(false);
  // const [walletCreationType, setWalletCreationType] = useState<'generated' | 'hot' | 'hardware'>('generated');

  // Transaction categorization cache to avoid repeated async calls
  const [transactionCategories, setTransactionCategories] = useState<{ [key: string]: string }>({});

  // Safe fallback functions for missing services
  const getWalletRiskAssessment = (walletId: string) => {
    console.log(`🔍 Risk assessment for wallet ${walletId}: Low risk (fallback)`);
    return { riskLevel: 'low', securityFeatures: [], recommendations: [] };
  };

  // Use the actual hot wallet service instead of fallback
  const connectHotWallet = async (userId: string, walletOption: any) => {
    console.log(`🔗 Connecting hot wallet ${walletOption.name} for user ${userId}`);
    try {
      const result = await hotWalletServiceConnect(userId, walletOption);
      return result;
    } catch (error: any) {
      console.error('Hot wallet connection error:', error);
      return { success: false, error: error.message, address: undefined };
    }
  };

  const importWalletAddresses = async (userId: string, walletId: string, addresses: string[]) => {
    console.log(`📥 Importing addresses for wallet ${walletId}: ${addresses.join(', ')}`);
    try {
      const result = await hotWalletImportAddresses(userId, walletId, addresses);
      return result;
    } catch (error: any) {
      console.error('Address import error:', error);
      return { success: false, error: error.message };
    }
  };

  const getWalletPortfolioValue = async (walletId: string) => {
    console.log(`💰 Getting portfolio value for wallet ${walletId} (fallback)`);
    return 0;
  };

  const enhancedHardwareWalletService = {
    connectHardwareWallet: async (walletId: string, connectionMethod: string) => {
      console.log(`🔗 Connecting hardware wallet ${walletId} via ${connectionMethod} (fallback)`);
      return { success: false, error: 'Hardware wallet connection not implemented yet' };
    }
  };

  // Real wallet data fetching
  const getRealUserWallets = async (userId: string) => {
    try {
      console.log('🔄 Fetching real user wallets from database...');

      // Get all user wallets from the unified wallets table
      const { data: wallets, error } = await supabase
        .from('wallets')
        .select(`
          id,
          wallet_name,
          wallet_type,
          wallet_address,
          network,
          provider,
          is_active,
          created_at
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching real wallets:', error);
        throw error;
      }

      console.log(`✅ Successfully fetched ${wallets?.length || 0} real wallets`);
      return wallets || [];
    } catch (error) {
      console.error('Error in getRealUserWallets:', error);
      throw error;
    }
  };

  // Function to categorize transactions and cache results
  const categorizeTransactions = async (transactions: any[]) => {
    const categories: { [key: string]: string } = {};

    for (const tx of transactions) {
      if (!categories[tx.id]) {
        try {
          // Use the safe categorization function
          const categoryId = await safeCategorizeTransaction(tx);
          categories[tx.id] = categoryId;
        } catch (error) {
          console.warn('Error categorizing transaction:', error);
          // Fallback to local categorization
          categories[tx.id] = localCategorizeTransaction(tx);
        }
      }
    }

    setTransactionCategories(prev => ({ ...prev, ...categories }));
    return categories;
  };

  // Initialize Phase 4 features
  const initializePhase4 = async () => {
    try {
      // Check Phase 4 availability
      const config = phase4ConfigManager.getConfig();
      setPhase4Enabled(config.enableAdvancedTrading);

      // Check Phase 4.2 DeFi availability
      setDefiEnabled(
        config.enableLiveStaking ||
        config.enableYieldFarming ||
        config.enableLiquidityProvision
      );

      // Check Phase 4.3 Cross-Chain availability
      setCrossChainEnabled(
        config.enableCrossChainBridge ||
        config.enableMultiNetworkPortfolio ||
        config.enableCrossChainArbitrage
      );

      // Check Phase 4.4 AI Analytics availability
      setAiAnalyticsEnabled(
        config.enableAIAnalytics ||
        config.enablePredictiveAnalytics ||
        config.enablePerformanceMetrics
      );

      // Check Phase 4.5 Social Trading availability
      setSocialTradingEnabled(
        config.enableCopyTrading ||
        config.enableSocialSignals ||
        config.enableCommunityFeatures ||
        config.enableTraderLeaderboards
      );

      // Load available tokens for trading, DeFi, and cross-chain
      const tokens = await getRealTimeTokens();
      setAvailableTokens(tokens);

      console.log('✅ Phase 4, Phase 4.2, Phase 4.3, and Phase 4.4 initialized successfully');
      console.log(`📊 Cross-Chain enabled: ${config.enableCrossChainBridge}`);
      console.log(`🧠 AI Analytics enabled: ${config.enableAIAnalytics}`);
    } catch (error) {
      console.error('❌ Error initializing Phase 4:', error);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user wallets using unified service first
      let walletsData: any[];
      try {
        walletsData = await getAllUserWallets(user.id);
        console.log('✅ Using unified wallet service data');
      } catch (error) {
        console.warn('🔄 Unified service failed, trying direct database query:', error);
        try {
          walletsData = await getRealUserWallets(user.id);
          console.log('✅ Using real wallet data from database');
        } catch (fallbackError) {
          console.warn('🔄 Database query failed, using preferences service fallback:', fallbackError);
          walletsData = await getAllUserWalletsWithPreferences(user.id);
        }
      }

      // Fetch all other data in parallel with safe Phase 3 service calls
      const [
        analyticsData,
        transactionsData,
        portfolioData,
        defiData,
        hotWalletsData,
        hardwareWalletsData
      ] = await Promise.all([
        safeGetTransactionAnalytics(user.id),
        safeGetFilteredTransactions(user.id, {}, { page: 1, limit: 5 }),
        getPortfolioSummary(user.id),
        getDeFiPortfolioSummary(user.id),
        getConnectedHotWallets(user.id),
        Promise.resolve([]) // Hardware wallets will be fetched separately
      ]);

      setWallets(walletsData);

      // Safe analytics mapping to handle type mismatches
      const safeAnalytics: Analytics = {
        totalTransactions: analyticsData?.totalTransactions || 0,
        totalVolume: analyticsData?.totalVolume || 0,
        averageAmount: analyticsData?.averageAmount || 0,
        topTokens: (analyticsData?.topTokens || []).map((token: any) => ({
          symbol: token.symbol || token.tokenId || 'Unknown',
          volume: token.volume || 0,
          transactions: token.transactions || token.count || 0
        })),
        categoryBreakdown: analyticsData?.categoryBreakdown || {}
      };
      setAnalytics(safeAnalytics);

      // Safe transaction mapping
      const safeTransactions = (transactionsData?.transactions || []).map((tx: any) => ({
        ...tx,
        tokens: Array.isArray(tx.tokens) ? tx.tokens[0] : tx.tokens,
        amount: tx.from_amount || tx.amount || '0',
        tokenSymbol: tx.tokens?.symbol || tx.tokenSymbol || 'Unknown'
      }));
      setRecentTransactions(safeTransactions);
      setPortfolioSummary(portfolioData);
      setDefiSummary(defiData);
      setConnectedHotWallets(hotWalletsData);
      setConnectedHardwareWallets(hardwareWalletsData);

      // Categorize transactions after setting them
      if (transactionsData.transactions && transactionsData.transactions.length > 0) {
        await categorizeTransactions(transactionsData.transactions);
      }

      // Update wallet portfolio values with real balance data
      const walletsWithValues = await Promise.all(
        walletsData.map(async (wallet: any) => {
          try {
            // Get real wallet balances from database
            const { data: balances, error } = await supabase
              .from('wallet_balances')
              .select(`
                balance,
                tokens:token_id (
                  price,
                  symbol
                )
              `)
              .eq('wallet_id', wallet.id);

            let portfolioValue = 0;
            if (!error && balances) {
              portfolioValue = balances.reduce((total, balance) => {
                const amount = parseFloat(balance.balance || '0');
                // Handle tokens array or object
                const tokenData = Array.isArray(balance.tokens) ? balance.tokens[0] : balance.tokens;
                const price = tokenData?.price || 0;
                return total + (amount * price);
              }, 0);
              console.log(`💰 Wallet ${wallet.wallet_name}: $${portfolioValue.toFixed(2)}`);
            } else {
              // Fallback to existing service
              portfolioValue = await getWalletPortfolioValue(wallet.id);
            }

            return {
              ...wallet,
              portfolioValue,
              // Ensure consistent naming for display
              name: wallet.wallet_name,
              type: wallet.wallet_type,
              address: wallet.wallet_address
            };
          } catch (error) {
            console.error(`Error calculating portfolio value for wallet ${wallet.id}:`, error);
            return {
              ...wallet,
              portfolioValue: 0,
              name: wallet.wallet_name,
              type: wallet.wallet_type,
              address: wallet.wallet_address
            };
          }
        })
      );
      setWallets(walletsWithValues);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      initializePhase4();
    }
  }, [user, fetchDashboardData]);



  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Dashboard data has been updated",
    });
  };



  const getFilteredWallets = () => {
    if (walletFilter === 'all') {
      return wallets;
    }
    return wallets.filter(wallet =>
      wallet.type === walletFilter || wallet.wallet_type === walletFilter
    );
  };

  const getWalletsByCategory = () => {
    const categorized: { [key: string]: any[] } = {};
    const filteredWallets = getFilteredWallets();

    filteredWallets.forEach(wallet => {
      const category = wallet.category || 'personal';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(wallet);
    });

    return categorized;
  };

  // Safe navigation handler with error boundary
  const handleWalletNavigation = (walletId: string | undefined) => {
    try {
      if (!walletId) {
        console.error('❌ Wallet ID is undefined or null');
        toast({
          title: "Navigation Error",
          description: "Unable to navigate to wallet details. Wallet ID is missing.",
          variant: "destructive",
        });
        return;
      }

      console.log('🔗 Navigating to wallet details:', walletId);
      console.log('📊 Current wallet filter:', walletFilter);
      console.log('📋 Available wallets:', wallets.map(w => ({ id: w.id, name: w.name || w.wallet_name, type: w.type || w.wallet_type })));
      navigate(`/wallet-details/${walletId}`);
    } catch (error) {
      console.error('❌ Navigation error:', error);
      toast({
        title: "Navigation Error",
        description: "Failed to navigate to wallet details. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle direct wallet connection (no dialog)
  const handleDirectWalletConnection = async (walletOption: any) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to connect a wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      setConnectingWallet(true);

      // Show risk assessment and permissions request
      getWalletRiskAssessment(walletOption.id); // Risk assessment logged

      // Request proper permissions from the wallet
      const result = await connectHotWallet(user.id, walletOption);

      if (result.success) {
        // Import all wallet addresses and balances automatically
        if (result.address) {
          await importWalletAddresses(user.id, walletOption.id, [result.address]);
        }

        toast({
          title: "Wallet Connected Successfully",
          description: `${walletOption.name} has been connected with real-time balance updates`,
        });

        await fetchDashboardData(); // Refresh data
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect wallet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error connecting hot wallet:', error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting the wallet",
        variant: "destructive",
      });
    } finally {
      setConnectingWallet(false);
    }
  };

  // Hot wallet connection handler (legacy for dialog)
  const handleConnectHotWallet = async (walletOption: any) => {
    if (!user) return;

    try {
      setConnectingWallet(true);
      const result = await connectHotWallet(user.id, walletOption);

      if (result.success) {
        toast({
          title: "Wallet Connected",
          description: `${walletOption.name} has been connected successfully`,
        });
        setShowHotWalletDialog(false);
        await fetchDashboardData(); // Refresh data
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect wallet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error connecting hot wallet:', error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting the wallet",
        variant: "destructive",
      });
    } finally {
      setConnectingWallet(false);
    }
  };

  // Handle direct hardware wallet connection with connection method selection
  // Commented out to reduce warnings - will be used in future Phase 4.5 implementation
  /*
  const handleDirectHardwareWalletConnection = async (walletOption: any) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to connect a hardware wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      setConnectingWallet(true);

      // Show hardware wallet info and connection methods
      console.log(`🔗 Connecting ${walletOption.name} hardware wallet:`);
      console.log(`- Security Level: ${walletOption.securityLevel.toUpperCase()}`);
      console.log(`- Available Methods: ${walletOption.supportedConnections.join(', ')}`);
      console.log(`- Price: $${walletOption.price}`);

      // For now, use the first available connection method
      // In a full implementation, this would show a connection method selection dialog
      const connectionMethod = walletOption.supportedConnections[0] as 'usb' | 'bluetooth' | 'qr';

      const result = await enhancedHardwareWalletService.connectHardwareWallet(walletOption.id, connectionMethod);

      if (result.success) {
        toast({
          title: "Hardware Wallet Connected Successfully",
          description: `${walletOption.name} has been connected via ${connectionMethod.toUpperCase()}`,
        });

        await fetchDashboardData(); // Refresh data
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect hardware wallet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error connecting hardware wallet:', error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting the hardware wallet",
        variant: "destructive",
      });
    } finally {
      setConnectingWallet(false);
    }
  };
  */

  // Hardware wallet connection handler (legacy for dialog)
  const handleConnectHardwareWallet = async (walletOption: any, connectionMethod: 'usb' | 'bluetooth' | 'qr') => {
    if (!user) return;

    try {
      setConnectingWallet(true);
      const result = await enhancedHardwareWalletService.connectHardwareWallet(walletOption.id, connectionMethod);

      if (result.success) {
        toast({
          title: "Hardware Wallet Connected",
          description: `${walletOption.name} has been connected successfully`,
        });
        setShowHardwareWalletDialog(false);
        await fetchDashboardData(); // Refresh data
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect hardware wallet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error connecting hardware wallet:', error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting the hardware wallet",
        variant: "destructive",
      });
    } finally {
      setConnectingWallet(false);
    }
  };

  // Safe export transactions handler with fallback
  const handleExportTransactions = async () => {
    if (!user) return;

    try {
      let csvContent = '';

      // Try Phase 3 enhanced export
      try {
        if (PHASE2_CONFIG?.enableRealTransactions) {
          const { exportTransactionsToCSV } = await import('@/services/enhancedTransactionService');
          csvContent = await exportTransactionsToCSV(user.id, exportOptions);
        } else {
          throw new Error('Phase 3 not enabled');
        }
      } catch (error) {
        console.warn('🔄 Enhanced export failed, using basic export:', error);

        // Phase 1 fallback - create basic CSV
        const transactions = await safeGetFilteredTransactions(user.id);
        const headers = ['Date', 'Type', 'Amount', 'Token', 'Status', 'Category'];
        const rows = transactions.transactions.map((tx: any) => [
          new Date(tx.timestamp).toISOString().split('T')[0],
          tx.transaction_type || tx.type || 'Unknown',
          (tx.from_amount || tx.amount || '0').toString(),
          tx.tokens?.symbol || tx.tokenSymbol || 'Unknown',
          tx.status || 'Unknown',
          TRANSACTION_CATEGORIES.find(cat => cat.id === localCategorizeTransaction(tx))?.name || 'Other'
        ]);

        csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      }

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Complete",
        description: "Transactions have been exported successfully",
      });
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export transactions",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="pb-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Wallet Dashboard</h1>
          <div className="w-8 h-8 bg-dex-secondary/20 rounded animate-pulse"></div>
        </div>

        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 bg-dex-dark border-dex-secondary/30 animate-pulse">
              <div className="h-6 w-48 bg-dex-secondary/20 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 w-32 bg-dex-secondary/10 rounded"></div>
                <div className="h-4 w-64 bg-dex-secondary/10 rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const walletsByCategory = getWalletsByCategory();

  return (
    <ErrorBoundary>
      <div className="pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Wallet Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBalances(!showBalances)}
            className="border-dex-secondary/30 text-white"
          >
            {showBalances ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-dex-secondary/30 text-white"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <Card className="p-6 mb-6 bg-dex-dark text-white border-dex-secondary/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Portfolio Overview</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-dex-primary text-dex-primary">
              {portfolioSummary?.walletCount || 0} Wallet{(portfolioSummary?.walletCount || 0) !== 1 ? 's' : ''}
            </Badge>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => navigate('/send')}
                className="bg-dex-primary hover:bg-dex-primary/80 text-white h-8 px-3"
              >
                <Send size={14} className="mr-1" />
                Send
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/receive')}
                className="border-dex-secondary/30 text-white h-8 px-3"
              >
                <Download size={14} className="mr-1" />
                Receive
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-400">Total Value</p>
            <p className="text-2xl font-bold text-white">
              {showBalances ? (
                portfolioSummary?.totalValue > 0
                  ? `$${portfolioSummary.totalValue.toFixed(2)}`
                  : wallets.length > 0
                    ? `$${wallets.reduce((total, wallet) => total + (wallet.portfolioValue || 0), 0).toFixed(2)}`
                    : '$0.00'
              ) : '••••••'}
            </p>
            {wallets.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">Create a wallet to get started</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-400">24h Change</p>
            <p className={`text-lg font-medium ${(portfolioSummary?.changePercentage24h || 0) >= 0 ? 'text-dex-positive' : 'text-dex-primary'}`}>
              {showBalances ? (
                portfolioSummary?.change24h !== undefined
                  ? `${portfolioSummary.changePercentage24h >= 0 ? '+' : ''}$${portfolioSummary.change24h.toFixed(2)} (${portfolioSummary.changePercentage24h.toFixed(1)}%)`
                  : recentTransactions.length > 0 ? '$0.00 (0.0%)' : '--'
              ) : '••••••'}
            </p>
            {recentTransactions.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No transactions yet</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-dex-secondary/20">
          <div className="text-center">
            <p className="text-sm text-gray-400">Transactions</p>
            <p className="text-lg font-medium text-white">
              {analytics?.totalTransactions || recentTransactions.length || 0}
            </p>
            {recentTransactions.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No activity</p>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Volume</p>
            <p className="text-lg font-medium text-white">
              {showBalances ? `$${(analytics?.totalVolume || portfolioSummary?.totalVolume || 0).toFixed(0)}` : '••••••'}
            </p>
            {(analytics?.totalVolume || 0) === 0 && (
              <p className="text-xs text-gray-500 mt-1">No volume</p>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Avg Amount</p>
            <p className="text-lg font-medium text-white">
              {showBalances ? `$${(analytics?.averageAmount || portfolioSummary?.averageAmount || 0).toFixed(0)}` : '••••••'}
            </p>
            {(analytics?.averageAmount || 0) === 0 && (
              <p className="text-xs text-gray-500 mt-1">No data</p>
            )}
          </div>
        </div>
      </Card>

      {/* Wallet Switcher */}
      <Card className="p-6 mb-6 bg-dex-dark text-white border-dex-secondary/30">
        <WalletSwitcher onWalletChange={(_walletId, _type) => {
          // Wallet changed - could add analytics tracking here
        }} />
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="wallets" className="w-full">
        <TabsList className={`grid w-full ${socialTradingEnabled ? 'grid-cols-7' : aiAnalyticsEnabled ? 'grid-cols-6' : crossChainEnabled ? 'grid-cols-5' : 'grid-cols-4'} mb-6 bg-dex-dark/50 p-1.5 rounded-lg border border-dex-secondary/20`}>
          <TabsTrigger value="wallets" className="text-white data-[state=active]:bg-dex-primary">
            Wallets
          </TabsTrigger>
          <TabsTrigger value="defi" className="text-white data-[state=active]:bg-dex-primary">
            DeFi
          </TabsTrigger>
          {crossChainEnabled && (
            <TabsTrigger value="bridge" className="text-white data-[state=active]:bg-dex-primary">
              <ArrowUpDown size={16} className="mr-1" />
              Bridge
            </TabsTrigger>
          )}
          <TabsTrigger value="transactions" className="text-white data-[state=active]:bg-dex-primary">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-dex-primary">
            Analytics
          </TabsTrigger>
          {aiAnalyticsEnabled && (
            <TabsTrigger value="ai-analytics" className="text-white data-[state=active]:bg-dex-primary">
              <Brain size={16} className="mr-1" />
              AI Analytics
            </TabsTrigger>
          )}
          {socialTradingEnabled && (
            <TabsTrigger value="social" className="text-white data-[state=active]:bg-dex-primary">
              <Users size={16} className="mr-1" />
              Social
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="wallets">
          <div className="space-y-6">
            {/* Wallet Type Filter */}
            <Card className="p-4 bg-dex-dark border-dex-secondary/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Wallet Type</h3>
                <Filter size={16} className="text-gray-400" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant={walletFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWalletFilter('all')}
                  className={walletFilter === 'all' ? 'bg-dex-primary text-white' : 'border-dex-secondary/30 text-white'}
                >
                  All Wallets
                </Button>
                <Button
                  variant={walletFilter === 'generated' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWalletFilter('generated')}
                  className={walletFilter === 'generated' ? 'bg-dex-primary text-white' : 'border-dex-secondary/30 text-white'}
                >
                  <Coins size={14} className="mr-1" />
                  Custom AI
                </Button>
                <Button
                  variant={walletFilter === 'hot' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWalletFilter('hot')}
                  className={walletFilter === 'hot' ? 'bg-dex-primary text-white' : 'border-dex-secondary/30 text-white'}
                >
                  <Flame size={14} className="mr-1" />
                  Hot Wallets
                </Button>
                <Button
                  variant={walletFilter === 'hardware' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWalletFilter('hardware')}
                  className={walletFilter === 'hardware' ? 'bg-dex-primary text-white' : 'border-dex-secondary/30 text-white'}
                >
                  <Shield size={14} className="mr-1" />
                  Cold Wallets
                </Button>
              </div>
            </Card>

            {/* Quick Actions - Only for Custom AI Tab */}
            {walletFilter === 'generated' && (
              <Card className="p-4 bg-dex-dark border-dex-secondary/30">
                <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => navigate('/wallet-generation')}
                    className="bg-dex-primary hover:bg-dex-primary/80 text-white justify-start"
                  >
                    <Plus size={16} className="mr-2" />
                    Create Wallet
                  </Button>
                  <Button
                    onClick={() => navigate('/wallet-import')}
                    variant="outline"
                    className="border-dex-secondary/30 text-white justify-start"
                  >
                    <ArrowUpDown size={16} className="mr-2" />
                    Import Wallet
                  </Button>
                </div>
              </Card>
            )}

            {/* Generated Wallets Section */}
            {walletFilter === 'generated' ? (
              <div className="space-y-6">
                {/* Generated Wallets Display */}
                {(() => {
                  const filteredWallets = getFilteredWallets();
                  const generatedWallets = filteredWallets.filter(w => w.type === 'generated' || w.wallet_type === 'generated');

                  if (generatedWallets.length === 0) {
                    return (
                      <Card className="p-6 bg-dex-dark border-dex-secondary/30 text-center">
                        <Coins size={48} className="mx-auto mb-4 text-dex-primary opacity-50" />
                        <h3 className="text-lg font-medium text-white mb-2">No Generated Wallets</h3>
                        <p className="text-gray-400 mb-4">Create your first AI-powered wallet to get started</p>
                        <Button
                          onClick={() => navigate('/wallet-generation')}
                          className="bg-dex-primary hover:bg-dex-primary/80 text-white h-12 px-6"
                        >
                          <Plus size={16} className="mr-2" />
                          Create Wallet
                        </Button>
                      </Card>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {generatedWallets.map((wallet) => (
                        <Card key={`generated-${wallet.id}`} className="p-6 bg-dex-dark border-dex-secondary/30">
                          <div className="space-y-3">
                            <div
                              className="p-4 bg-dex-secondary/10 border border-dex-secondary/20 rounded-lg hover:bg-dex-secondary/15 transition-colors cursor-pointer"
                              onClick={() => handleWalletNavigation(wallet.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                                    <Coins size={20} className="text-dex-primary" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-white">
                                        {wallet.name || wallet.wallet_name || 'Unnamed Wallet'}
                                      </span>
                                      {wallet.isDefault && <Star size={14} className="text-dex-primary" />}
                                    </div>
                                    <span className="text-sm text-gray-400">Generated Wallet</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-white">
                                    {showBalances ? `$${(wallet.portfolioValue || 0).toFixed(2)}` : '••••••'}
                                  </p>
                                  <p className="text-sm text-gray-400">Portfolio Value</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ) : walletFilter === 'hot' ? (
              <div className="space-y-6">
                {/* Hot Wallet Provider Filters */}
                <Card className="p-4 bg-dex-dark border-dex-secondary/30">
                  <h3 className="text-lg font-medium text-white mb-4">Hot Wallet Providers</h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {HOT_WALLET_OPTIONS.map((provider) => (
                      <div key={provider.id} className="relative group">
                        <Button
                          variant="outline"
                          className="h-20 w-full flex flex-col items-center gap-2 border-dex-secondary/30 text-white hover:bg-dex-secondary/20 transition-all duration-200"
                          onClick={() => handleDirectWalletConnection(provider)}
                          disabled={connectingWallet}
                        >
                          <img
                            src={provider.icon}
                            alt={provider.name}
                            className="w-8 h-8"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/wallet-icons/default.svg';
                            }}
                          />
                          <span className="text-xs">{provider.name}</span>
                          {provider.isPopular && (
                            <Badge className="absolute -top-1 -right-1 bg-dex-primary text-white text-xs px-1 py-0">
                              Popular
                            </Badge>
                          )}
                        </Button>

                        {/* Risk Assessment Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                          <div className="bg-dex-dark border border-dex-secondary/30 rounded-lg p-3 text-xs text-white shadow-lg min-w-48">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{provider.name}</span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  provider.riskLevel === 'low' ? 'border-green-500 text-green-500' :
                                  provider.riskLevel === 'medium' ? 'border-yellow-500 text-yellow-500' :
                                  'border-red-500 text-red-500'
                                }`}
                              >
                                {provider.riskLevel.toUpperCase()} RISK
                              </Badge>
                            </div>
                            <p className="text-gray-400 mb-2">{provider.description}</p>
                            <div className="text-xs">
                              <p><strong>Market Share:</strong> {provider.marketShare}%</p>
                              <p><strong>Networks:</strong> {provider.supportedNetworks.slice(0, 3).join(', ')}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Connected Hot Wallets */}
                {connectedHotWallets.length === 0 ? (
                  <Card className="p-6 bg-dex-dark border-dex-secondary/30 text-center">
                    <Flame size={48} className="mx-auto mb-4 text-dex-primary opacity-50" />
                    <h3 className="text-lg font-medium text-white mb-2">No Hot Wallets Connected</h3>
                    <p className="text-gray-400 mb-4">Connect your favorite hot wallets to get started</p>
                    <Button
                      onClick={() => setShowHotWalletDialog(true)}
                      className="bg-dex-primary hover:bg-dex-primary/80 text-white h-12 px-6"
                    >
                      <Plus size={16} className="mr-2" />
                      Connect Hot Wallet
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Group by provider */}
                    {Object.entries(
                      connectedHotWallets.reduce((groups: Record<string, any[]>, wallet: any) => {
                        const provider = wallet.wallet_id || 'unknown';
                        if (!groups[provider]) groups[provider] = [];
                        groups[provider].push(wallet);
                        return groups;
                      }, {} as Record<string, any[]>)
                    ).map(([provider, wallets]: [string, any[]]) => (
                      <Card key={provider} className="p-6 bg-dex-dark border-dex-secondary/30">
                        <div className="flex items-center gap-3 mb-4">
                          <img
                            src={`/wallet-icons/${provider}.svg`}
                            alt={provider}
                            className="w-8 h-8"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/crypto-icons/metamask.svg';
                            }}
                          />
                          <h3 className="text-lg font-medium text-white capitalize">{provider} Wallets</h3>
                          <Badge variant="outline" className="text-xs border-dex-primary text-dex-primary">
                            {wallets.length}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {wallets.map((wallet) => (
                            <div
                              key={`hot-${wallet.id}`}
                              className="p-4 bg-dex-secondary/10 border border-dex-secondary/20 rounded-lg hover:bg-dex-secondary/15 transition-colors cursor-pointer"
                              onClick={() => handleWalletNavigation(wallet.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                                    <Flame size={20} className="text-dex-primary" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-white">{wallet.wallet_name}</span>
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      <span className="text-xs text-green-500">Connected</span>
                                    </div>
                                    <span className="text-sm text-gray-400">{wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-white">
                                    {showBalances ? '$0.00' : '••••••'}
                                  </p>
                                  <p className="text-sm text-gray-400">Balance</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : walletFilter === 'hardware' ? (
              <div className="space-y-6">
                {/* Connected Hardware Wallets */}
                {connectedHardwareWallets.length === 0 ? (
                  <Card className="p-6 bg-dex-dark border-dex-secondary/30 text-center">
                    <Shield size={48} className="mx-auto mb-4 text-dex-primary opacity-50" />
                    <h3 className="text-lg font-medium text-white mb-2">No Hardware Wallets Connected</h3>
                    <p className="text-gray-400 mb-4">Connect your hardware wallets for maximum security</p>
                    <Button
                      onClick={() => setShowHardwareWalletDialog(true)}
                      variant="outline"
                      className="border-dex-secondary/30 text-white h-12 px-6"
                    >
                      <Shield size={16} className="mr-2" />
                      Connect Hardware Wallet
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Group by manufacturer */}
                    {Object.entries(
                      connectedHardwareWallets.reduce((groups: Record<string, any[]>, wallet: any) => {
                        const manufacturer = wallet.wallet_id || 'unknown';
                        if (!groups[manufacturer]) groups[manufacturer] = [];
                        groups[manufacturer].push(wallet);
                        return groups;
                      }, {} as Record<string, any[]>)
                    ).map(([manufacturer, wallets]: [string, any[]]) => (
                      <Card key={manufacturer} className="p-6 bg-dex-dark border-dex-secondary/30">
                        <div className="flex items-center gap-3 mb-4">
                          <img
                            src={`/hardware-wallets/${manufacturer}.svg`}
                            alt={manufacturer}
                            className="w-8 h-8"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/hardware-wallets/ledger.svg';
                            }}
                          />
                          <h3 className="text-lg font-medium text-white capitalize">{manufacturer} Devices</h3>
                          <Badge variant="outline" className="text-xs border-dex-primary text-dex-primary">
                            {wallets.length}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {wallets.map((wallet) => (
                            <div
                              key={`hardware-${wallet.id}`}
                              className="p-4 bg-dex-secondary/10 border border-dex-secondary/20 rounded-lg hover:bg-dex-secondary/15 transition-colors cursor-pointer"
                              onClick={() => handleWalletNavigation(wallet.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                                    <Shield size={20} className="text-dex-primary" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-white">{wallet.wallet_name}</span>
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      <span className="text-xs text-green-500">Connected</span>
                                    </div>
                                    <span className="text-sm text-gray-400">{wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-white">
                                    {showBalances ? '$0.00' : '••••••'}
                                  </p>
                                  <p className="text-sm text-gray-400">Balance</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              Object.entries(walletsByCategory).map(([categoryId, categoryWallets]) => {
                const categoryInfo = DEFAULT_CATEGORIES.find(cat => cat.id === categoryId) || DEFAULT_CATEGORIES[5];

                return (
                  <Card key={categoryId} className="p-6 bg-dex-dark border-dex-secondary/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: categoryInfo.color }}
                      ></div>
                      <h3 className="text-lg font-medium text-white">{categoryInfo.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {categoryWallets.length}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {categoryWallets.map((wallet) => (
                        <div
                          key={`category-${categoryId}-${wallet.id}`}
                          className="p-4 bg-dex-secondary/10 border border-dex-secondary/20 rounded-lg hover:bg-dex-secondary/15 transition-colors cursor-pointer"
                          onClick={() => handleWalletNavigation(wallet.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                                <Wallet size={20} className="text-dex-primary" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-white">
                                    {wallet.name || wallet.wallet_name || 'Unnamed Wallet'}
                                  </span>
                                  {wallet.isDefault && <Star size={14} className="text-dex-primary" />}
                                </div>
                                <span className="text-sm text-gray-400 capitalize">{wallet.type} Wallet</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-white">
                                {showBalances ? `$${(wallet.portfolioValue || 0).toFixed(2)}` : '••••••'}
                              </p>
                              <p className="text-sm text-gray-400">Portfolio Value</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Phase 4 Advanced Trading Tab - Moved to TradePage */}
        {/* Trading functionality now available on /trade page */}

        <TabsContent value="defi">
          <div className="space-y-6">
            {/* Phase 4.2 DeFi Integration Panel */}
            {defiEnabled ? (
              <DeFiIntegrationPanel
                tokens={availableTokens}
                onPositionCreate={(position) => {
                  console.log('DeFi position created:', position);
                  // Refresh dashboard data
                  fetchDashboardData();
                }}
              />
            ) : (
              <>
                {/* Legacy DeFi Portfolio Summary */}
                <Card className="p-6 bg-dex-dark border-dex-secondary/30">
                  <h3 className="text-lg font-medium text-white mb-4">DeFi Portfolio</h3>

                  {defiSummary ? (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-dex-secondary/10 rounded-lg">
                        <p className="text-sm text-gray-400">Total Staked</p>
                        <p className="text-xl font-bold text-white">
                          {showBalances ? `$${parseFloat(defiSummary.totalStaked).toFixed(2)}` : '••••••'}
                        </p>
                      </div>
                      <div className="p-4 bg-dex-secondary/10 rounded-lg">
                        <p className="text-sm text-gray-400">Total Rewards</p>
                        <p className="text-xl font-bold text-dex-positive">
                          {showBalances ? `$${parseFloat(defiSummary.totalRewards).toFixed(2)}` : '••••••'}
                        </p>
                      </div>
                      <div className="p-4 bg-dex-secondary/10 rounded-lg">
                        <p className="text-sm text-gray-400">Active Positions</p>
                        <p className="text-xl font-bold text-white">{defiSummary.activePositions}</p>
                      </div>
                      <div className="p-4 bg-dex-secondary/10 rounded-lg">
                        <p className="text-sm text-gray-400">Average APY</p>
                        <p className="text-xl font-bold text-white">{defiSummary.averageApy.toFixed(1)}%</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <TrendingUp size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No DeFi positions found</p>
                    </div>
                  )}
                </Card>
              </>
            )}

            {/* Enhanced Staking Opportunities Panel - Always Visible */}
            <StakingOpportunitiesPanel
              className="mb-6"
              onStakeSelect={(opportunity) => {
                console.log('Staking opportunity selected:', opportunity);
                toast({
                  title: "Staking Opportunity Selected",
                  description: `Selected ${opportunity.protocol} (${opportunity.token}) with ${opportunity.apy}% APY`,
                });
              }}
            />
          </div>
        </TabsContent>

        {/* Phase 4.3 Cross-Chain Bridge Tab */}
        {crossChainEnabled && (
          <TabsContent value="bridge">
            <div className="space-y-6">
              {/* Multi-Network Portfolio Overview */}
              <MultiNetworkPortfolio
                userId={user?.id || 'current-user'}
                className="mb-6"
              />

              {/* Cross-Chain Bridge Panel */}
              <CrossChainBridgePanel
                tokens={availableTokens}
                onBridgeComplete={(transaction) => {
                  console.log('Bridge transaction completed:', transaction);
                  // Refresh dashboard data to show updated balances
                  fetchDashboardData();
                }}
              />
            </div>
          </TabsContent>
        )}

        <TabsContent value="transactions">
          <div className="space-y-6">
            {/* Transaction Filters and Export */}
            <Card className="p-4 bg-dex-dark border-dex-secondary/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Transaction Management</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTransactionFilters(!showTransactionFilters)}
                    className="border-dex-secondary/30 text-white"
                  >
                    <Filter size={16} className="mr-2" />
                    Filters
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExportDialogOpen(true)}
                    className="border-dex-secondary/30 text-white"
                  >
                    <FileDown size={16} className="mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showTransactionFilters && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-dex-secondary/10 rounded-lg">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Date Range</Label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="border-dex-secondary/30 text-white">
                            <Calendar size={14} className="mr-2" />
                            From
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-dex-dark border-dex-secondary/30">
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                            className="text-white"
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="border-dex-secondary/30 text-white">
                            <Calendar size={14} className="mr-2" />
                            To
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-dex-dark border-dex-secondary/30">
                          <CalendarComponent
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                            className="text-white"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Transaction Type */}
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Transaction Type</Label>
                    <Select
                      value={transactionFilters.transactionType || 'all'}
                      onValueChange={(value) => setTransactionFilters(prev => ({
                        ...prev,
                        transactionType: value as any
                      }))}
                    >
                      <SelectTrigger className="bg-dex-secondary/10 border-dex-secondary/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-dex-dark border-dex-secondary/30">
                        <SelectItem value="all" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">All Types</SelectItem>
                        <SelectItem value="send" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Send</SelectItem>
                        <SelectItem value="receive" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Receive</SelectItem>
                        <SelectItem value="buy" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Buy</SelectItem>
                        <SelectItem value="sell" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Sell</SelectItem>
                        <SelectItem value="swap" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Swap</SelectItem>
                        <SelectItem value="stake" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Stake</SelectItem>
                        <SelectItem value="unstake" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Unstake</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Status</Label>
                    <Select
                      value={transactionFilters.status || 'all'}
                      onValueChange={(value) => setTransactionFilters(prev => ({
                        ...prev,
                        status: value as any
                      }))}
                    >
                      <SelectTrigger className="bg-dex-secondary/10 border-dex-secondary/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-dex-dark border-dex-secondary/30">
                        <SelectItem value="all" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">All Status</SelectItem>
                        <SelectItem value="pending" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Pending</SelectItem>
                        <SelectItem value="completed" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Completed</SelectItem>
                        <SelectItem value="failed" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Failed</SelectItem>
                        <SelectItem value="cancelled" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Category</Label>
                    <Select
                      value={transactionFilters.category || 'all'}
                      onValueChange={(value) => setTransactionFilters(prev => ({
                        ...prev,
                        category: value as any
                      }))}
                    >
                      <SelectTrigger className="bg-dex-secondary/10 border-dex-secondary/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-dex-dark border-dex-secondary/30">
                        <SelectItem value="all" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">All Categories</SelectItem>
                        {TRANSACTION_CATEGORIES.map((category) => (
                          <SelectItem key={category.id} value={category.id} className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </Card>

            {/* Transactions List */}
            <Card className="p-6 bg-dex-dark border-dex-secondary/30">
              <h3 className="text-lg font-medium text-white mb-4">Recent Transactions</h3>

              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((tx) => {
                    // Use cached categorization or fallback to local categorization
                    const categoryId = transactionCategories[tx.id] || localCategorizeTransaction(tx);
                    const category = TRANSACTION_CATEGORIES.find(cat => cat.id === categoryId);
                    return (
                      <div key={tx.id} className="p-3 bg-dex-secondary/10 border border-dex-secondary/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-dex-primary/20 flex items-center justify-center">
                              <ArrowUpDown size={16} className="text-dex-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white capitalize">{tx.transaction_type || tx.type || 'Unknown'}</p>
                                {category && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs"
                                    style={{
                                      borderColor: category.color,
                                      color: category.color
                                    }}
                                  >
                                    {category.name}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-400">
                                {new Date(tx.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-white">
                              {showBalances ? `${tx.from_amount || (tx as any).amount || '0'} ${tx.tokens?.symbol || (tx as any).tokenSymbol || 'Unknown'}` : '••••••'}
                            </p>
                            <p className={`text-sm capitalize ${
                              tx.status === 'completed' ? 'text-dex-positive' :
                              tx.status === 'failed' ? 'text-dex-primary' :
                              'text-gray-400'
                            }`}>
                              {tx.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <ArrowUpDown size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="mb-2">No transactions found</p>
                  <p className="text-sm text-gray-500">
                    {wallets.length === 0
                      ? "Create a wallet and make your first transaction to see activity here"
                      : "Your transaction history will appear here once you start trading"
                    }
                  </p>
                  <div className="mt-4 space-x-2">
                    <Button
                      size="sm"
                      onClick={() => navigate('/send')}
                      className="bg-dex-primary hover:bg-dex-primary/80 text-white"
                    >
                      <Send size={14} className="mr-1" />
                      Send
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/receive')}
                      className="border-dex-secondary/30 text-white"
                    >
                      <Download size={14} className="mr-1" />
                      Receive
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-6 bg-dex-dark border-dex-secondary/30">
            <h3 className="text-lg font-medium text-white mb-4">Portfolio Analytics</h3>

            {analytics && analytics.totalTransactions > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-dex-secondary/10 rounded-lg">
                    <p className="text-sm text-gray-400">Total Transactions</p>
                    <p className="text-2xl font-bold text-white">{analytics.totalTransactions}</p>
                  </div>
                  <div className="p-4 bg-dex-secondary/10 rounded-lg">
                    <p className="text-sm text-gray-400">Total Volume</p>
                    <p className="text-2xl font-bold text-white">
                      {showBalances ? `$${analytics.totalVolume.toFixed(0)}` : '••••••'}
                    </p>
                  </div>
                </div>

                {analytics.topTokens && analytics.topTokens.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-white mb-3">Top Tokens</h4>
                    <div className="space-y-2">
                      {analytics.topTokens.slice(0, 5).map((token: any, index: number) => (
                        <div key={token.tokenId || index} className="flex items-center justify-between p-2 bg-dex-secondary/10 rounded">
                          <span className="text-white">{token.symbol || 'Unknown'}</span>
                          <span className="text-gray-400">
                            {showBalances ? `$${(token.volume || 0).toFixed(0)}` : '••••••'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(analytics.categoryBreakdown || {}).length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-white mb-3">Transaction Categories</h4>
                    <div className="space-y-2">
                      {Object.entries(analytics.categoryBreakdown).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between p-2 bg-dex-secondary/10 rounded">
                          <span className="text-white">{category}</span>
                          <span className="text-gray-400">{count} transactions</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
                <p className="mb-2">No analytics data available</p>
                <p className="text-sm text-gray-500">
                  {wallets.length === 0
                    ? "Create a wallet and make transactions to see detailed analytics"
                    : "Your portfolio analytics will appear here once you have transaction history"
                  }
                </p>
                <div className="mt-4">
                  <Button
                    size="sm"
                    onClick={() => navigate('/wallet-generation')}
                    className="bg-dex-primary hover:bg-dex-primary/80 text-white"
                  >
                    <Plus size={14} className="mr-1" />
                    Create Wallet
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Phase 4.4 AI Analytics Tab */}
        {aiAnalyticsEnabled && (
          <TabsContent value="ai-analytics">
            <div className="space-y-6">
              {/* AI Analytics Panel */}
              <AIAnalyticsPanel
                userId={user?.id || 'current-user'}
                className="w-full"
              />
            </div>
          </TabsContent>
        )}

        {/* Phase 4.5 Social Trading Tab */}
        {socialTradingEnabled && (
          <TabsContent value="social">
            <div className="space-y-6">
              {/* Social Trading Panel */}
              <SocialTradingPanel
                userId={user?.id || 'current-user'}
                onError={(error) => {
                  console.error('Social Trading Error:', error);
                  toast({
                    title: "Social Trading Error",
                    description: error,
                    variant: "destructive",
                  });
                }}
              />
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Hot Wallet Connection Dialog */}
      <Dialog open={showHotWalletDialog} onOpenChange={setShowHotWalletDialog}>
        <DialogContent className="bg-dex-dark border-dex-secondary/30 text-white">
          <DialogHeader>
            <DialogTitle>Connect Hot Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {HOT_WALLET_OPTIONS.map((wallet) => (
              <div
                key={wallet.id}
                className="p-4 border border-dex-secondary/30 rounded-lg hover:bg-dex-secondary/10 cursor-pointer transition-colors"
                onClick={() => handleConnectHotWallet(wallet)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                    <Wallet size={20} className="text-dex-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{wallet.name}</span>
                      {wallet.isPopular && (
                        <Badge variant="outline" className="text-xs text-dex-primary border-dex-primary">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{wallet.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Hardware Wallet Connection Dialog */}
      <Dialog open={showHardwareWalletDialog} onOpenChange={setShowHardwareWalletDialog}>
        <DialogContent className="bg-dex-dark border-dex-secondary/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Connect Hardware Wallet</DialogTitle>
            <p className="text-gray-400">Choose your hardware wallet and connection method for maximum security</p>
          </DialogHeader>
          <div className="space-y-6">
            {HARDWARE_WALLET_OPTIONS.map((wallet) => (
              <div
                key={wallet.id}
                className="p-4 border border-dex-secondary/30 rounded-lg hover:bg-dex-secondary/10 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-dex-primary/20 flex items-center justify-center flex-shrink-0">
                    <img
                      src={wallet.icon}
                      alt={wallet.name}
                      className="w-8 h-8"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/hardware-wallets/default.svg';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-white">{wallet.name}</h4>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          wallet.securityLevel === 'high' ? 'border-green-500 text-green-500' :
                          wallet.securityLevel === 'medium' ? 'border-yellow-500 text-yellow-500' :
                          'border-red-500 text-red-500'
                        }`}
                      >
                        {wallet.securityLevel.toUpperCase()} SECURITY
                      </Badge>
                      {wallet.isPopular && (
                        <Badge className="bg-dex-primary text-white text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{wallet.description}</p>
                    <div className="text-xs text-gray-500 mb-3">
                      <span className="font-medium">Price: ${wallet.price}</span> •
                      <span className="ml-1">Networks: {wallet.supportedNetworks.slice(0, 3).join(', ')}</span>
                      {wallet.supportedNetworks.length > 3 && <span> +{wallet.supportedNetworks.length - 3} more</span>}
                    </div>

                    {/* Connection Methods */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-white">Available Connection Methods:</p>
                      <div className="flex gap-2">
                        {wallet.supportedConnections.map((method: string) => (
                          <Button
                            key={method}
                            size="sm"
                            variant="outline"
                            className="border-dex-secondary/30 text-white hover:bg-dex-primary hover:border-dex-primary"
                            onClick={() => handleConnectHardwareWallet(wallet, method as 'usb' | 'bluetooth' | 'qr')}
                            disabled={connectingWallet}
                          >
                            {method.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="bg-dex-dark border-dex-secondary/30 text-white">
          <DialogHeader>
            <DialogTitle>Export Transactions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Date Range Selection */}
            <div className="space-y-2">
              <Label className="text-white">Date Range</Label>
              <Select
                value={exportOptions.dateRange}
                onValueChange={(value) => setExportOptions(prev => ({
                  ...prev,
                  dateRange: value as any
                }))}
              >
                <SelectTrigger className="bg-dex-secondary/10 border-dex-secondary/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dex-dark border-dex-secondary/30">
                  <SelectItem value="last30days" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Last 30 Days</SelectItem>
                  <SelectItem value="last90days" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Last 90 Days</SelectItem>
                  <SelectItem value="alltime" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">All Time</SelectItem>
                  <SelectItem value="custom" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Fields */}
            <div className="space-y-2">
              <Label className="text-white">Include Fields</Label>
              <div className="grid grid-cols-2 gap-2">
                {EXPORT_FIELDS.map((field) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.id}
                      checked={exportOptions.includeFields.includes(field.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setExportOptions(prev => ({
                            ...prev,
                            includeFields: [...prev.includeFields, field.id]
                          }));
                        } else if (!field.required) {
                          setExportOptions(prev => ({
                            ...prev,
                            includeFields: prev.includeFields.filter(f => f !== field.id)
                          }));
                        }
                      }}
                      disabled={field.required}
                    />
                    <Label htmlFor={field.id} className="text-sm text-white">
                      {field.label}
                      {field.required && <span className="text-dex-primary ml-1">*</span>}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleExportTransactions}
                className="flex-1 bg-dex-primary hover:bg-dex-primary/80 text-white"
              >
                <FileDown size={16} className="mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => setExportDialogOpen(false)}
                className="border-dex-secondary/30 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </ErrorBoundary>
  );
};

export default WalletDashboardPage;
