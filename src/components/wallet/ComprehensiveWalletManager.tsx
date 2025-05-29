/**
 * PHASE 4.5: COMPREHENSIVE WALLET MANAGER COMPONENT
 *
 * Enterprise-grade wallet management component with functional hot/cold wallet icons,
 * real-time balance updates, and comprehensive error handling.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Wallet,
  Flame,
  Shield,
  Plus,
  RefreshCw,
  Send,
  Download,
  ArrowUpDown,
  Network,
  Eye,
  EyeOff,
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import {
  comprehensiveWalletService,
  ComprehensiveWallet,
  SUPPORTED_NETWORKS
} from '@/services/comprehensiveWalletService';
import {
  walletOperationsService,
  WalletBalance,
  SendTransactionRequest,
  SwapRequest
} from '@/services/walletOperationsService';

interface ComprehensiveWalletManagerProps {
  className?: string;
  showBalances?: boolean;
  onWalletSelect?: (wallet: ComprehensiveWallet) => void;
}

const ComprehensiveWalletManager: React.FC<ComprehensiveWalletManagerProps> = ({
  className = '',
  showBalances = true,
  onWalletSelect
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State Management
  const [wallets, setWallets] = useState<ComprehensiveWallet[]>([]);
  const [walletBalances, setWalletBalances] = useState<Record<string, WalletBalance[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<ComprehensiveWallet | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('ethereum');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Dialog States
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showHotWalletDialog, setShowHotWalletDialog] = useState(false);
  const [showHardwareWalletDialog, setShowHardwareWalletDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [showNetworkDialog, setShowNetworkDialog] = useState(false);

  // Form States
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<'generated' | 'hot' | 'hardware'>('generated');
  const [creating, setCreating] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Transaction States
  const [sendForm, setSendForm] = useState<Partial<SendTransactionRequest>>({
    toAddress: '',
    amount: '',
    tokenSymbol: 'ETH',
    network: 'ethereum'
  });
  const [swapForm, setSwapForm] = useState<Partial<SwapRequest>>({
    fromToken: 'ETH',
    toToken: 'USDC',
    amount: '',
    network: 'ethereum',
    slippage: 0.5,
    dexProtocol: 'uniswap'
  });

  /**
   * Load user wallets and balances
   */
  const loadWallets = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🔄 Loading comprehensive wallets...');

      // Fetch wallets from comprehensive service
      const userWallets = await comprehensiveWalletService.getUserWallets(user.id);
      setWallets(userWallets);

      // Load balances for each wallet
      const balances: Record<string, WalletBalance[]> = {};
      for (const wallet of userWallets) {
        try {
          const walletBalances = await walletOperationsService.getWalletBalances(wallet.id);
          balances[wallet.id] = walletBalances;
        } catch (error) {
          console.error(`Failed to load balances for wallet ${wallet.id}:`, error);
          balances[wallet.id] = [];
        }
      }
      setWalletBalances(balances);
      setLastUpdate(new Date());

      console.log(`✅ Loaded ${userWallets.length} wallets with balances`);

    } catch (error) {
      console.error('❌ Error loading wallets:', error);
      toast({
        title: "Error Loading Wallets",
        description: "Failed to load wallet data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  /**
   * Refresh wallet data
   */
  const refreshWallets = useCallback(async () => {
    setRefreshing(true);
    await loadWallets();
    setRefreshing(false);
  }, [loadWallets]);

  /**
   * Create new wallet
   */
  const handleCreateWallet = async () => {
    if (!user || !walletName.trim()) return;

    try {
      setCreating(true);
      console.log(`🔨 Creating ${walletType} wallet: ${walletName}`);

      const newWallet = await comprehensiveWalletService.createWallet(
        user.id,
        walletName.trim(),
        walletType,
        selectedNetwork
      );

      toast({
        title: "Wallet Created",
        description: `${walletName} has been created successfully`,
      });

      // Reset form and close dialog
      setWalletName('');
      setShowCreateDialog(false);

      // Refresh wallets
      await loadWallets();

      // Navigate to wallet details
      navigate(`/wallet-details/${newWallet.id}`);

    } catch (error) {
      console.error('❌ Error creating wallet:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create wallet",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  /**
   * Connect hot wallet - ENHANCED WITH PROPER DETECTION AND REDIRECTS
   */
  const handleConnectHotWallet = async (provider: string) => {
    if (!user) return;

    try {
      setConnecting(true);
      console.log(`🔥 Connecting hot wallet: ${provider}`);

      // Import the enhanced hot wallet service
      const { connectHotWallet, HOT_WALLET_OPTIONS } = await import('@/services/hotWalletService');

      // Find wallet configuration
      const wallet = HOT_WALLET_OPTIONS.find(w => w.name.toLowerCase().includes(provider.toLowerCase()));
      if (!wallet) {
        throw new Error(`Wallet configuration not found for ${provider}`);
      }

      // Attempt connection with proper error handling and redirects
      const address = await connectHotWallet(wallet);

      // Create wallet in database
      const newWallet = await comprehensiveWalletService.createWallet(
        user.id,
        `${provider} Wallet`,
        'hot',
        selectedNetwork,
        undefined,
        undefined,
        provider
      );

      toast({
        title: "Hot Wallet Connected",
        description: `${provider} wallet has been connected successfully`,
      });

      setShowHotWalletDialog(false);
      await loadWallets();

    } catch (error: any) {
      console.error('❌ Error connecting hot wallet:', error);

      // Enhanced error handling with specific messages
      let errorMessage = "Failed to connect hot wallet";

      if (error.message.includes('not found') || error.message.includes('not detected')) {
        errorMessage = `${error.message} The download page has been opened in a new tab.`;
      } else if (error.message.includes('rejected')) {
        errorMessage = "Connection rejected by user. Please approve the connection request in your wallet.";
      } else if (error.message.includes('pending')) {
        errorMessage = "Connection request already pending. Please check your wallet.";
      } else {
        errorMessage = error.message;
      }

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Connect hardware wallet - ENHANCED WITH DEVICE-SPECIFIC PROTOCOLS
   */
  const handleConnectHardwareWallet = async (device: string) => {
    if (!user) return;

    try {
      setConnecting(true);
      console.log(`🛡️ Connecting hardware wallet: ${device}`);

      // Import the consolidated hardware wallet service
      const { enhancedHardwareWalletService, HARDWARE_WALLETS } = await import('@/services/enhancedHardwareWalletService');

      // Find device configuration
      const deviceConfig = HARDWARE_WALLETS[device.toLowerCase()];
      if (!deviceConfig) {
        throw new Error(`Hardware wallet not supported: ${device}`);
      }

      // Determine best connection method for the device
      const connectionMethod = deviceConfig.supportedConnections[0]; // Use first supported method

      // Attempt connection with proper device protocols
      const result = await enhancedHardwareWalletService.connectHardwareWallet(
        device.toLowerCase(),
        connectionMethod
      );

      if (!result.success) {
        throw new Error(result.error || 'Hardware wallet connection failed');
      }

      // Create wallet in database
      if (result.address) {
        const newWallet = await comprehensiveWalletService.createWallet(
          user.id,
          `${device} Hardware`,
          'hardware',
          selectedNetwork,
          undefined,
          undefined,
          device
        );

        toast({
          title: "Hardware Wallet Connected",
          description: `${device} hardware wallet has been connected successfully`,
        });

        setShowHardwareWalletDialog(false);
        await loadWallets();
      }

    } catch (error: any) {
      console.error('❌ Error connecting hardware wallet:', error);

      // Enhanced error handling with specific messages
      let errorMessage = "Failed to connect hardware wallet";

      if (error.message.includes('not supported')) {
        errorMessage = `${device} is not supported yet. Please use a supported hardware wallet.`;
      } else if (error.message.includes('camera access') || error.message.includes('QR')) {
        errorMessage = `${error.message} Please ensure camera permissions are granted for QR scanning.`;
      } else if (error.message.includes('USB') || error.message.includes('Bluetooth')) {
        errorMessage = `${error.message} Please check your device connection and try again.`;
      } else if (error.message.includes('setup required')) {
        errorMessage = `${error.message} The setup page has been opened in a new tab.`;
      } else {
        errorMessage = error.message;
      }

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Handle wallet selection
   */
  const handleWalletSelect = (wallet: ComprehensiveWallet) => {
    setSelectedWallet(wallet);
    if (onWalletSelect) {
      onWalletSelect(wallet);
    }
  };

  /**
   * Navigate to wallet details
   */
  const handleWalletDetails = (walletId: string) => {
    navigate(`/wallet-details/${walletId}`);
  };

  /**
   * Get wallet type icon
   */
  const getWalletTypeIcon = (type: string) => {
    switch (type) {
      case 'hot':
        return <Flame size={20} className="text-orange-500" />;
      case 'hardware':
        return <Shield size={20} className="text-blue-500" />;
      case 'generated':
      default:
        return <Wallet size={20} className="text-dex-primary" />;
    }
  };

  /**
   * Get wallet balance display
   */
  const getWalletBalanceDisplay = (walletId: string) => {
    const balances = walletBalances[walletId] || [];
    if (balances.length === 0) return 'Loading...';

    const totalUsd = balances.reduce((sum, balance) => sum + parseFloat(balance.usdValue || '0'), 0);
    return showBalances ? `$${totalUsd.toFixed(2)}` : '••••••';
  };

  /**
   * Get network badge color
   */
  const getNetworkBadgeColor = (network: string) => {
    const colors: Record<string, string> = {
      ethereum: '#627EEA',
      polygon: '#8247E5',
      bsc: '#F3BA2F',
      arbitrum: '#28A0F0',
      optimism: '#FF0420',
      avalanche: '#E84142',
      fantom: '#1969FF'
    };
    return colors[network] || '#8E8E93';
  };

  // Load wallets on component mount
  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!refreshing) {
        refreshWallets();
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshWallets, refreshing]);

  if (loading) {
    return (
      <Card className={`p-6 bg-dex-dark border-dex-secondary/30 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-dex-primary" />
          <span className="ml-3 text-white">Loading wallets...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Actions */}
      <Card className="p-6 bg-dex-dark border-dex-secondary/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Wallet className="h-6 w-6 text-dex-primary" />
            <h2 className="text-xl font-bold text-white">Wallet Management</h2>
            {lastUpdate && (
              <Badge variant="outline" className="text-xs text-gray-400">
                Updated {lastUpdate.toLocaleTimeString()}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshWallets}
              disabled={refreshing}
              className="border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-dex-primary hover:bg-dex-primary/80 text-white"
            >
              <Plus size={16} className="mr-2" />
              Create Wallet
            </Button>
          </div>
        </div>

        {/* Quick Actions - FIXED HOT/COLD WALLET ICONS */}
        <div className="grid grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-20 flex flex-col items-center gap-2 border-dex-secondary/30 text-white hover:bg-orange-500/10 hover:border-orange-500/30 transition-all"
            onClick={() => setShowHotWalletDialog(true)}
          >
            <Flame size={24} className="text-orange-500" />
            <span className="text-sm">Connect Hot Wallet</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex flex-col items-center gap-2 border-dex-secondary/30 text-white hover:bg-blue-500/10 hover:border-blue-500/30 transition-all"
            onClick={() => setShowHardwareWalletDialog(true)}
          >
            <Shield size={24} className="text-blue-500" />
            <span className="text-sm">Connect Hardware</span>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex flex-col items-center gap-2 border-dex-secondary/30 text-white hover:bg-dex-primary/10 hover:border-dex-primary/30 transition-all"
            onClick={() => {
              setWalletType('generated');
              setShowCreateDialog(true);
            }}
          >
            <Wallet size={24} className="text-dex-primary" />
            <span className="text-sm">Generate Wallet</span>
          </Button>
        </div>
      </Card>

      {/* Wallets List */}
      {wallets.length === 0 ? (
        <Card className="p-8 bg-dex-dark border-dex-secondary/30 text-center">
          <Wallet size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-white mb-2">No Wallets Found</h3>
          <p className="text-gray-400 mb-4">Create your first wallet to get started</p>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-dex-primary hover:bg-dex-primary/80 text-white"
          >
            <Plus size={16} className="mr-2" />
            Create Wallet
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {wallets.map((wallet) => (
            <Card
              key={wallet.id}
              className={`p-4 bg-dex-dark border-dex-secondary/30 hover:bg-dex-secondary/10 transition-all cursor-pointer ${
                selectedWallet?.id === wallet.id ? 'ring-2 ring-dex-primary' : ''
              }`}
              onClick={() => handleWalletSelect(wallet)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-dex-primary/20 flex items-center justify-center">
                    {getWalletTypeIcon(wallet.wallet_type)}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{wallet.wallet_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: getNetworkBadgeColor(wallet.network),
                          color: getNetworkBadgeColor(wallet.network)
                        }}
                        className="text-xs"
                      >
                        {wallet.network.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {wallet.wallet_address.slice(0, 6)}...{wallet.wallet_address.slice(-4)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-medium text-white">
                    {getWalletBalanceDisplay(wallet.id)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWalletDetails(wallet.id);
                      }}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                    >
                      <Settings size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWallet(wallet);
                        setShowSendDialog(true);
                      }}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                    >
                      <Send size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWallet(wallet);
                        setShowSwapDialog(true);
                      }}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                    >
                      <ArrowUpDown size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Wallet Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-dex-dark border-dex-secondary/30 text-white">
          <DialogHeader>
            <DialogTitle>Create New Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="walletName">Wallet Name</Label>
              <Input
                id="walletName"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="Enter wallet name"
                className="bg-dex-secondary/20 border-dex-secondary/30 text-white"
              />
            </div>

            <div>
              <Label htmlFor="walletType">Wallet Type</Label>
              <Select value={walletType} onValueChange={(value: any) => setWalletType(value)}>
                <SelectTrigger className="bg-dex-secondary/20 border-dex-secondary/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dex-dark border-dex-secondary/30">
                  <SelectItem value="generated">Generated Wallet</SelectItem>
                  <SelectItem value="hot">Hot Wallet</SelectItem>
                  <SelectItem value="hardware">Hardware Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="network">Network</Label>
              <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                <SelectTrigger className="bg-dex-secondary/20 border-dex-secondary/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dex-dark border-dex-secondary/30">
                  {Object.entries(SUPPORTED_NETWORKS).map(([key, network]) => (
                    <SelectItem key={key} value={key}>
                      {network.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 border-dex-secondary/30 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateWallet}
                disabled={creating || !walletName.trim()}
                className="flex-1 bg-dex-primary hover:bg-dex-primary/80 text-white"
              >
                {creating ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Wallet'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hot Wallet Connection Dialog */}
      <Dialog open={showHotWalletDialog} onOpenChange={setShowHotWalletDialog}>
        <DialogContent className="bg-dex-dark border-dex-secondary/30 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="text-orange-500" />
              Connect Hot Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-400">Choose a hot wallet provider to connect:</p>
            <div className="grid grid-cols-2 gap-3">
              {['MetaMask', 'WalletConnect', 'Coinbase Wallet', 'Trust Wallet'].map((provider) => (
                <Button
                  key={provider}
                  variant="outline"
                  onClick={() => handleConnectHotWallet(provider)}
                  disabled={connecting}
                  className="h-16 flex flex-col items-center gap-2 border-dex-secondary/30 text-white hover:bg-orange-500/10"
                >
                  <Flame size={20} className="text-orange-500" />
                  <span className="text-sm">{provider}</span>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hardware Wallet Connection Dialog */}
      <Dialog open={showHardwareWalletDialog} onOpenChange={setShowHardwareWalletDialog}>
        <DialogContent className="bg-dex-dark border-dex-secondary/30 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="text-blue-500" />
              Connect Hardware Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-400">Choose a hardware wallet to connect:</p>
            <div className="grid grid-cols-2 gap-3">
              {['Ledger', 'Trezor', 'KeepKey', 'SafePal'].map((device) => (
                <Button
                  key={device}
                  variant="outline"
                  onClick={() => handleConnectHardwareWallet(device)}
                  disabled={connecting}
                  className="h-16 flex flex-col items-center gap-2 border-dex-secondary/30 text-white hover:bg-blue-500/10"
                >
                  <Shield size={20} className="text-blue-500" />
                  <span className="text-sm">{device}</span>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComprehensiveWalletManager;
