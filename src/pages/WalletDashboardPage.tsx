import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import WalletSwitcher from '@/components/WalletSwitcher';
import {
  getAllUserWalletsWithPreferences,
  updateWalletCategory,
  updateWalletDisplayOrder,
  DEFAULT_CATEGORIES
} from '@/services/walletPreferencesService';
import {
  getFilteredTransactions,
  getTransactionAnalytics,
  TRANSACTION_CATEGORIES,
  exportTransactionsToCSV,
  TransactionFilters,
  ExportOptions,
  EXPORT_FIELDS,
  categorizeTransaction
} from '@/services/enhancedTransactionService';
import {
  connectHotWallet,
  getConnectedHotWallets,
  HOT_WALLET_OPTIONS
} from '@/services/hotWalletService';
import {
  connectHardwareWallet,
  getConnectedHardwareWallets,
  HARDWARE_WALLET_OPTIONS
} from '@/services/hardwareWalletService';
import {
  getPortfolioSummary,
  getWalletPortfolioValue,
  PortfolioSummary
} from '@/services/portfolioService';
import {
  getStakingOpportunities,
  getYieldFarmingPools,
  getUserStakingPositions,
  getDeFiPortfolioSummary
} from '@/services/defiService';
import {
  Wallet,
  Plus,
  TrendingUp,
  BarChart3,
  ArrowUpDown,
  Settings,
  Star,
  DragHandleDots2Icon,
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
  X,
  Search,
  ChevronDown
} from 'lucide-react';

const WalletDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [showBalances, setShowBalances] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [walletFilter, setWalletFilter] = useState<'all' | 'generated' | 'hot' | 'hardware'>('all');
  const [stakingOpportunities, setStakingOpportunities] = useState<any[]>([]);
  const [defiSummary, setDefiSummary] = useState<any>(null);

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

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all data in parallel
      const [
        walletsData,
        analyticsData,
        transactionsData,
        portfolioData,
        stakingData,
        defiData,
        hotWalletsData,
        hardwareWalletsData
      ] = await Promise.all([
        getAllUserWalletsWithPreferences(user.id),
        getTransactionAnalytics(user.id),
        getFilteredTransactions(user.id, {}, { page: 1, limit: 5 }),
        getPortfolioSummary(user.id),
        getStakingOpportunities(),
        getDeFiPortfolioSummary(user.id),
        getConnectedHotWallets(user.id),
        getConnectedHardwareWallets(user.id)
      ]);

      setWallets(walletsData);
      setAnalytics(analyticsData);
      setRecentTransactions(transactionsData.transactions);
      setPortfolioSummary(portfolioData);
      setStakingOpportunities(stakingData);
      setDefiSummary(defiData);
      setConnectedHotWallets(hotWalletsData);
      setConnectedHardwareWallets(hardwareWalletsData);

      // Update wallet portfolio values
      const walletsWithValues = await Promise.all(
        walletsData.map(async (wallet) => {
          const portfolioValue = await getWalletPortfolioValue(wallet.id);
          return { ...wallet, portfolioValue };
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
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Dashboard data has been updated",
    });
  };

  const handleWalletCategoryChange = async (walletId: string, category: string) => {
    if (!user) return;

    try {
      await updateWalletCategory(user.id, walletId, category);
      await fetchDashboardData(); // Refresh data
      toast({
        title: "Category Updated",
        description: "Wallet category has been updated",
      });
    } catch (error) {
      console.error('Error updating wallet category:', error);
      toast({
        title: "Error",
        description: "Failed to update wallet category",
        variant: "destructive",
      });
    }
  };

  const getFilteredWallets = () => {
    if (walletFilter === 'all') {
      return wallets;
    }
    return wallets.filter(wallet => wallet.type === walletFilter);
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

  // Hot wallet connection handler
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

  // Hardware wallet connection handler
  const handleConnectHardwareWallet = async (walletOption: any, connectionMethod: 'usb' | 'bluetooth' | 'qr') => {
    if (!user) return;

    try {
      setConnectingWallet(true);
      const result = await connectHardwareWallet(user.id, walletOption, connectionMethod);

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

  // Export transactions handler
  const handleExportTransactions = async () => {
    if (!user) return;

    try {
      const csvContent = await exportTransactionsToCSV(user.id, exportOptions);

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
              {showBalances ? `$${(portfolioSummary?.totalValue || 0).toFixed(2)}` : '••••••'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">24h Change</p>
            <p className={`text-lg font-medium ${(portfolioSummary?.changePercentage24h || 0) >= 0 ? 'text-dex-positive' : 'text-dex-primary'}`}>
              {showBalances ?
                `${(portfolioSummary?.changePercentage24h || 0) >= 0 ? '+' : ''}$${(portfolioSummary?.change24h || 0).toFixed(2)} (${(portfolioSummary?.changePercentage24h || 0).toFixed(1)}%)`
                : '••••••'
              }
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-dex-secondary/20">
          <div className="text-center">
            <p className="text-sm text-gray-400">Transactions</p>
            <p className="text-lg font-medium text-white">{portfolioSummary?.totalTransactions || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Volume</p>
            <p className="text-lg font-medium text-white">
              {showBalances ? `$${(portfolioSummary?.totalVolume || 0).toFixed(0)}` : '••••••'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Avg Amount</p>
            <p className="text-lg font-medium text-white">
              {showBalances ? `$${(portfolioSummary?.averageAmount || 0).toFixed(0)}` : '••••••'}
            </p>
          </div>
        </div>
      </Card>

      {/* Wallet Switcher */}
      <Card className="p-6 mb-6 bg-dex-dark text-white border-dex-secondary/30">
        <WalletSwitcher onWalletChange={(walletId, type) => {
          console.log('Wallet changed:', walletId, type);
        }} />
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="wallets" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 bg-dex-dark/50 p-1.5 rounded-lg border border-dex-secondary/20">
          <TabsTrigger value="wallets" className="text-white data-[state=active]:bg-dex-primary">
            Wallets
          </TabsTrigger>
          <TabsTrigger value="defi" className="text-white data-[state=active]:bg-dex-primary">
            DeFi
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-white data-[state=active]:bg-dex-primary">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-dex-primary">
            Analytics
          </TabsTrigger>
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

            {/* Quick Actions */}
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

            {/* Wallets by Category or Empty States */}
            {walletFilter === 'hot' && connectedHotWallets.length === 0 ? (
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
            ) : walletFilter === 'hardware' && connectedHardwareWallets.length === 0 ? (
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
                          key={wallet.id}
                          className="p-4 bg-dex-secondary/10 border border-dex-secondary/20 rounded-lg hover:bg-dex-secondary/15 transition-colors cursor-pointer"
                          onClick={() => navigate(`/wallet-details/${wallet.id}`)}
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

        <TabsContent value="defi">
          <div className="space-y-6">
            {/* DeFi Portfolio Summary */}
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

            {/* Staking Opportunities */}
            <Card className="p-6 bg-dex-dark border-dex-secondary/30">
              <h3 className="text-lg font-medium text-white mb-4">Staking Opportunities</h3>

              {stakingOpportunities.length > 0 ? (
                <div className="space-y-3">
                  {stakingOpportunities.map((opportunity) => (
                    <div key={opportunity.id} className="p-4 bg-dex-secondary/10 border border-dex-secondary/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                            <TrendingUp size={20} className="text-dex-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{opportunity.protocol}</span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  opportunity.risk === 'low' ? 'border-green-500 text-green-500' :
                                  opportunity.risk === 'medium' ? 'border-yellow-500 text-yellow-500' :
                                  'border-red-500 text-red-500'
                                }`}
                              >
                                {opportunity.risk.toUpperCase()} RISK
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-400">{opportunity.token} • Min: {opportunity.minimumStake}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-dex-positive">{opportunity.apy}% APY</p>
                          <p className="text-sm text-gray-400">
                            {opportunity.lockPeriod > 0 ? `${opportunity.lockPeriod} days lock` : 'No lock'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Coins size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No staking opportunities available</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

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
                    const categoryId = categorizeTransaction(tx);
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
                                <p className="font-medium text-white capitalize">{tx.transaction_type}</p>
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
                              {showBalances ? `${tx.from_amount} ${tx.tokens?.symbol || 'Unknown'}` : '••••••'}
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
                  <p>No recent transactions</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-6 bg-dex-dark border-dex-secondary/30">
            <h3 className="text-lg font-medium text-white mb-4">Portfolio Analytics</h3>

            {analytics ? (
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

                <div>
                  <h4 className="text-md font-medium text-white mb-3">Top Tokens</h4>
                  <div className="space-y-2">
                    {analytics.topTokens.slice(0, 5).map((token: any, index: number) => (
                      <div key={token.tokenId} className="flex items-center justify-between p-2 bg-dex-secondary/10 rounded">
                        <span className="text-white">{token.symbol}</span>
                        <span className="text-gray-400">
                          {showBalances ? `$${token.volume.toFixed(0)}` : '••••••'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
                <p>No analytics data available</p>
              </div>
            )}
          </Card>
        </TabsContent>
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

      {/* Hardware Wallet Connection Dialog */}
      <Dialog open={showHardwareWalletDialog} onOpenChange={setShowHardwareWalletDialog}>
        <DialogContent className="bg-dex-dark border-dex-secondary/30 text-white">
          <DialogHeader>
            <DialogTitle>Connect Hardware Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {HARDWARE_WALLET_OPTIONS.map((wallet) => (
              <div
                key={wallet.id}
                className="p-4 border border-dex-secondary/30 rounded-lg hover:bg-dex-secondary/10 cursor-pointer transition-colors"
                onClick={() => handleConnectHardwareWallet(wallet, 'usb')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                    <Shield size={20} className="text-dex-primary" />
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
  );
};

export default WalletDashboardPage;
