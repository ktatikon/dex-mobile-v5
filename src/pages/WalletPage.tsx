
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TokenListItem from '@/components/TokenListItem';
import { formatCurrency } from '@/services/realTimeData';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, Shield, Flame, Plus, ChevronDown, Usb, Check, AlertCircle, RefreshCw,
  Clock, Settings, QrCode, Search, Filter, ArrowUpDown, Calendar, Download, Upload
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import TokenIcon from '@/components/TokenIcon';
import { useWalletData } from '@/hooks/useWalletData';
import EmptyStateCard from '@/components/EmptyStateCard';
import TransactionItem from '@/components/TransactionItem';
import TransactionDetailsModal from '@/components/TransactionDetailsModal';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import HotWalletOptions, { WalletOption } from '@/components/wallet/HotWalletOptions';
import HardwareWalletOptions, { HardwareWalletOption } from '@/components/wallet/HardwareWalletOptions';
import HardwareWalletConnectionModal from '@/components/wallet/HardwareWalletConnectionModal';
import { useAuth } from '@/contexts/AuthContext';
import { saveHotWalletConnection, saveHardwareWalletConnection } from '@/services/walletConnectionService';
import { Transaction } from '@/types';

// Hardware wallet options
interface HardwareWallet {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
}

const hardwareWallets: HardwareWallet[] = [
  {
    id: 'ledger',
    name: 'Ledger',
    icon: '/hardware-wallets/ledger.svg',
    connected: false
  },
  {
    id: 'trezor',
    name: 'Trezor',
    icon: '/hardware-wallets/trezor.svg',
    connected: true
  },
  {
    id: 'safepal',
    name: 'SafePal',
    icon: '/hardware-wallets/safepal.svg',
    connected: false
  },
  {
    id: 'keystone',
    name: 'Keystone',
    icon: '/hardware-wallets/keystone.svg',
    connected: false
  },
  {
    id: 'ellipal',
    name: 'Ellipal',
    icon: '/hardware-wallets/ellipal.svg',
    connected: false
  }
];

// Additional altcoins for the Hot Wallet
const additionalAltcoins = [
  {
    id: "dogecoin",
    symbol: "DOGE",
    name: "Dogecoin",
    logo: "/crypto-icons/doge.svg",
    decimals: 8,
    balance: "1250.75",
    price: 0.12,
    priceChange24h: 2.3,
  },
  {
    id: "polkadot",
    symbol: "DOT",
    name: "Polkadot",
    logo: "/crypto-icons/dot.svg",
    decimals: 10,
    balance: "45.32",
    price: 5.87,
    priceChange24h: -1.2,
  },
  {
    id: "avalanche",
    symbol: "AVAX",
    name: "Avalanche",
    logo: "/crypto-icons/avax.svg",
    decimals: 18,
    balance: "12.75",
    price: 28.45,
    priceChange24h: 4.8,
  },
  {
    id: "chainlink",
    symbol: "LINK",
    name: "Chainlink",
    logo: "/crypto-icons/link.svg",
    decimals: 18,
    balance: "35.42",
    price: 13.28,
    priceChange24h: 3.1,
  },
  {
    id: "polygon",
    symbol: "MATIC",
    name: "Polygon",
    logo: "/crypto-icons/matic.svg",
    decimals: 18,
    balance: "325.67",
    price: 0.58,
    priceChange24h: 1.9,
  }
];

const WalletPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedHardwareWallet, setSelectedHardwareWallet] = useState<HardwareWallet | null>(null);
  const [mainTab, setMainTab] = useState<string>("assets");
  const [transactionFilter, setTransactionFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("7d");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Wallet connection states
  const [showHotWalletOptions, setShowHotWalletOptions] = useState<boolean>(false);
  const [showHardwareWalletOptions, setShowHardwareWalletOptions] = useState<boolean>(false);
  const [selectedHardwareWalletOption, setSelectedHardwareWalletOption] = useState<HardwareWalletOption | null>(null);
  const [showConnectionModal, setShowConnectionModal] = useState<boolean>(false);

  // Transaction details modal state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState<boolean>(false);

  const {
    address,
    totalBalance,
    hotWalletTokens,
    coldWalletTokens,
    hotWalletBalance,
    coldWalletBalance,
    portfolioChange24h,
    loading,
    error,
    refreshData,
    activeWalletType,
    setActiveWalletType,
    lastUpdated,
    transactions
  } = useWalletData();

  // Format last updated time
  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  // Format portfolio change for display
  const formattedPortfolioChange = portfolioChange24h.toFixed(2);
  const isPositiveChange = portfolioChange24h >= 0;

  const handleCopyAddress = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(address)
        .then(() => {
          toast({
            title: "Address Copied",
            description: "Wallet address copied to clipboard",
          });
        })
        .catch(() => {
          toast({
            title: "Failed to copy",
            description: "Could not copy address to clipboard",
            variant: "destructive",
          });
        });
    }
  };

  const handleGoToSwap = (token: any) => {
    navigate('/swap', { state: { preSelectedToken: token } });
  };

  const handleConnectHardwareWallet = (wallet: HardwareWallet) => {
    setSelectedHardwareWallet(wallet);
    toast({
      title: `Connecting to ${wallet.name}`,
      description: "Please follow the instructions on your device",
    });
  };

  const handleAddWallet = () => {
    setShowHardwareWalletOptions(true);
  };

  // Handle navigation to wallet generation page
  const handleNavigateToWalletGeneration = () => {
    console.log('Navigating to wallet generation page');
    navigate('/wallet-generation');
  };

  // Handle hot wallet selection
  const handleHotWalletSelect = async (wallet: WalletOption) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to connect a wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      // In a real implementation, this would use the wallet's SDK to get the address
      // For demonstration, we'll generate a random address
      const address = `0x${Math.random().toString(16).substring(2, 42)}`;

      // Save the wallet connection to Supabase
      const connection = await saveHotWalletConnection(user.id, wallet, address);

      if (connection) {
        toast({
          title: "Wallet Connected",
          description: `${wallet.name} wallet has been connected successfully`,
        });

        // Refresh wallet data
        refreshData();
      } else {
        toast({
          title: "Connection Failed",
          description: `Failed to connect ${wallet.name} wallet`,
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
    }
  };

  // Handle hardware wallet selection
  const handleHardwareWalletSelect = (wallet: HardwareWalletOption) => {
    setSelectedHardwareWalletOption(wallet);
    setShowConnectionModal(true);
  };

  // Handle hardware wallet connection
  const handleHardwareWalletConnect = async (address: string) => {
    if (!user || !selectedHardwareWalletOption) {
      return;
    }

    try {
      // Save the hardware wallet connection to Supabase
      const connection = await saveHardwareWalletConnection(
        user.id,
        selectedHardwareWalletOption,
        address
      );

      if (connection) {
        toast({
          title: "Hardware Wallet Connected",
          description: `${selectedHardwareWalletOption.name} has been connected successfully`,
        });

        // Refresh wallet data
        refreshData();
      } else {
        toast({
          title: "Connection Failed",
          description: `Failed to connect ${selectedHardwareWalletOption.name}`,
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
    }
  };

  // Handle viewing transaction details
  const handleViewTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  // Filter transactions based on selected filters
  const filteredTransactions = transactions.filter(transaction => {
    // Filter by transaction type
    if (transactionFilter !== 'all' && transaction.type !== transactionFilter) {
      return false;
    }

    // Filter by date
    const now = new Date().getTime();
    const txTime = transaction.timestamp;
    const daysDiff = (now - txTime) / (1000 * 60 * 60 * 24);

    if (dateFilter === '7d' && daysDiff > 7) {
      return false;
    } else if (dateFilter === '30d' && daysDiff > 30) {
      return false;
    } else if (dateFilter === '90d' && daysDiff > 90) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fromSymbol = transaction.fromToken?.symbol.toLowerCase() || '';
      const toSymbol = transaction.toToken?.symbol.toLowerCase() || '';
      const hash = transaction.hash.toLowerCase();

      return fromSymbol.includes(query) ||
             toSymbol.includes(query) ||
             hash.includes(query);
    }

    return true;
  });

  // Handle QR code scanning
  const handleScanQRCode = () => {
    toast({
      title: "QR Code Scanner",
      description: "This feature will be available soon",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="pb-20">
        <Card className="p-4 mb-6 bg-dex-dark text-white border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 backdrop-blur-sm">
          <h2 className="text-lg font-semibold mb-1">Wallet</h2>

          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="h-8 w-32 bg-dex-secondary/20 rounded-md animate-pulse mb-2"></div>
              <div className="h-4 w-48 bg-dex-secondary/10 rounded-md animate-pulse"></div>
            </div>

            <div className="flex gap-3">
              <div className="h-11 w-28 bg-dex-secondary/20 rounded-lg animate-pulse"></div>
              <div className="h-11 w-28 bg-dex-secondary/10 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </Card>

        <div className="flex justify-center items-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin text-dex-primary" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="pb-20">
        <Card className="p-4 mb-6 bg-dex-dark text-white border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 backdrop-blur-sm">
          <h2 className="text-lg font-semibold mb-1">Wallet</h2>

          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-2xl font-bold text-white">$0.00</div>
              <button
                className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-all duration-200"
                onClick={handleCopyAddress}
              >
                {address}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
              </button>
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                className="h-11 min-w-[110px] px-4 py-3 rounded-lg flex items-center justify-center"
                onClick={() => refreshData()}
              >
                <RefreshCw size={20} className="mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </Card>

        <EmptyStateCard
          title="Error Loading Wallet Data"
          description={error.message || "Failed to load wallet data. Please try again."}
          icon={<AlertCircle size={40} className="text-dex-negative" />}
          actionLabel="Retry"
          onAction={() => refreshData()}
        />
      </div>
    );
  }

  return (
    <div className="pb-20">
      <Card className="p-4 mb-6 bg-dex-dark text-white border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-lg font-semibold">Wallet</h2>
          {lastUpdated && (
            <div className="text-xs text-gray-400 flex items-center">
              <RefreshCw size={12} className="mr-1" />
              Updated {formattedLastUpdated}
            </div>
          )}
        </div>

        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-white">${formatCurrency(totalBalance)}</div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isPositiveChange ? 'bg-dex-positive/10 text-dex-positive' : 'bg-dex-negative/10 text-dex-negative'}`}>
                {isPositiveChange ? '+' : ''}{formattedPortfolioChange}%
              </span>
            </div>
            <button
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-all duration-200"
              onClick={handleCopyAddress}
            >
              {address}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-lg border-dex-secondary/30 text-white flex items-center justify-center"
              onClick={() => refreshData()}
              title="Refresh wallet data"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </Button>

            <div className="flex gap-2">
              <Button
                variant="primary"
                className="h-11 min-w-[100px] px-4 py-3 rounded-lg flex items-center justify-center"
                onClick={() => navigate('/send')}
              >
                <Upload size={20} className="mr-2" />
                Send
              </Button>

              <Button
                variant="outline"
                className="h-11 min-w-[100px] px-4 py-3 rounded-lg border-dex-secondary/30 text-white flex items-center justify-center"
                onClick={() => navigate('/receive')}
              >
                <Download size={20} className="mr-2" />
                Receive
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            className="h-11 px-4 py-3 rounded-lg border-dex-secondary/30 text-white flex items-center justify-center"
            onClick={handleScanQRCode}
          >
            <QrCode size={18} className="mr-2" />
            Scan Address
          </Button>
        </div>
      </Card>

      {/* Main Wallet Tabs */}
      <Tabs defaultValue="assets" className="w-full mb-6" onValueChange={setMainTab}>
        <TabsList className="grid w-full grid-cols-4 mb-4 bg-dex-dark/50 p-1.5 rounded-lg border border-dex-secondary/20 shadow-[0_2px_8px_rgba(0,0,0,0.2)] gap-1.5">
          <TabsTrigger
            value="assets"
            className="flex items-center justify-center gap-2 py-2.5 px-2 h-12 min-h-[48px] rounded-lg text-center text-white transition-all duration-200
            bg-dex-secondary text-dex-text-primary
            data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
            data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
            data-[state=active]:border data-[state=active]:border-white/10"
          >
            <Wallet size={18} />
            <span className="font-medium">Assets</span>
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="flex items-center justify-center gap-2 py-2.5 px-2 h-12 min-h-[48px] rounded-lg text-center text-white transition-all duration-200
            bg-dex-secondary text-dex-text-primary
            data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
            data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
            data-[state=active]:border data-[state=active]:border-white/10"
          >
            <Clock size={18} />
            <span className="font-medium">Activity</span>
          </TabsTrigger>
          <TabsTrigger
            value="earn"
            className="flex items-center justify-center gap-2 py-2.5 px-2 h-12 min-h-[48px] rounded-lg text-center text-white transition-all duration-200
            bg-dex-secondary text-dex-text-primary
            data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
            data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
            data-[state=active]:border data-[state=active]:border-white/10"
          >
            <ArrowUpDown size={18} />
            <span className="font-medium">Earn</span>
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex items-center justify-center gap-2 py-2.5 px-2 h-12 min-h-[48px] rounded-lg text-center text-white transition-all duration-200
            bg-dex-secondary text-dex-text-primary
            data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
            data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
            data-[state=active]:border data-[state=active]:border-white/10"
          >
            <Settings size={18} />
            <span className="font-medium">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Assets Tab Content */}
        <TabsContent value="assets" className="mt-0">
          <div className="mb-4">
            <Tabs defaultValue="hot" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-dex-dark/50 p-1.5 rounded-lg border border-dex-secondary/20 shadow-[0_2px_8px_rgba(0,0,0,0.2)] gap-1.5">
                <TabsTrigger
                  value="hot"
                  className="flex items-center justify-center gap-2 py-2.5 px-2 h-12 min-h-[48px] rounded-lg text-center text-white transition-all duration-200
                  bg-dex-secondary text-dex-text-primary
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
                  data-[state=active]:border data-[state=active]:border-white/10"
                  onClick={() => setActiveWalletType('hot')}
                >
                  <Flame size={18} />
                  <span className="font-medium">Hot Wallet</span>
                </TabsTrigger>
                <TabsTrigger
                  value="cold"
                  className="flex items-center justify-center gap-2 py-2.5 px-2 h-12 min-h-[48px] rounded-lg text-center text-white transition-all duration-200
                  bg-dex-secondary text-dex-text-primary
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
                  data-[state=active]:border data-[state=active]:border-white/10"
                  onClick={() => setActiveWalletType('cold')}
                >
                  <Shield size={18} />
                  <span className="font-medium">Cold Wallet</span>
                </TabsTrigger>
              </TabsList>

          <TabsContent value="hot">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Hot Wallet</h2>
              <div className="text-sm font-medium text-white">
                ${formatCurrency(hotWalletBalance)}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full mb-4 flex justify-between items-center h-14 px-4 py-3 bg-dex-secondary/10 border-dex-secondary/20 text-white hover:bg-dex-secondary/20"
                >
                  <div className="flex items-center gap-3">
                    <Flame size={22} className="text-dex-primary" />
                    <span className="font-medium">Hot Wallet Cryptocurrencies</span>
                  </div>
                  <ChevronDown size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[calc(100vw-32px)] max-h-[70vh] overflow-y-auto bg-dex-tertiary border border-dex-secondary/30 text-white rounded-xl shadow-lg"
                align="center"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-white font-semibold px-4 py-3 sticky top-0 bg-dex-tertiary z-10">
                  Select Cryptocurrency
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-dex-secondary/30" />

                {hotWalletTokens.map(token => (
                  <DropdownMenuItem
                    key={token.id}
                    className="py-4 px-4 hover:bg-dex-secondary/50 focus:bg-dex-secondary/50 cursor-pointer min-h-[72px]"
                    onClick={() => handleGoToSwap(token)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <TokenIcon token={token} size="sm" />
                        <div>
                          <div className="font-medium text-white">{token.symbol}</div>
                          <div className="text-sm text-gray-400">{token.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">
                          {parseFloat(token.balance || '0').toFixed(token.decimals > 6 ? 4 : 2)}
                        </div>
                        <div className="text-sm text-dex-primary">
                          ${(parseFloat(token.balance || '0') * (token.price || 0)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Hot Wallet Options */}
            <Button
              variant="outline"
              className="w-full justify-between border-dex-secondary/30 text-white min-h-[44px] mb-4"
              onClick={() => setShowHotWalletOptions(!showHotWalletOptions)}
            >
              <div className="flex items-center">
                <Flame size={18} className="mr-2 text-dex-primary" />
                <span>Connect Hot Wallet</span>
              </div>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${showHotWalletOptions ? 'rotate-180' : ''}`}
              />
            </Button>

            {showHotWalletOptions && (
              <HotWalletOptions onWalletSelect={handleHotWalletSelect} />
            )}

            {hotWalletTokens.length > 0 ? (
              <Card className="p-0 bg-dex-dark text-white border-dex-secondary/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)] backdrop-blur-sm mb-4">
                {hotWalletTokens.map(token => (
                  <TokenListItem
                    key={token.id}
                    token={token}
                    onSelect={() => handleGoToSwap(token)}
                  />
                ))}
              </Card>
            ) : (
              <EmptyStateCard
                title="No Tokens in Hot Wallet"
                description="Add funds to your wallet to get started with trading."
                icon={<Wallet size={40} />}
                actionLabel="Add Funds"
                onAction={() => navigate('/receive')}
                className="mb-4"
              />
            )}
          </TabsContent>

          <TabsContent value="cold">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Cold Wallet</h2>
              <div className="text-sm font-medium text-white">
                ${formatCurrency(coldWalletBalance)}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full mb-4 flex justify-between items-center h-14 px-4 py-3 bg-dex-secondary/10 border-dex-secondary/20 text-white hover:bg-dex-secondary/20"
                >
                  <div className="flex items-center gap-3">
                    <Shield size={22} className="text-dex-positive" />
                    <span className="font-medium">Hardware Wallet Connection</span>
                  </div>
                  <ChevronDown size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[calc(100vw-32px)] max-h-[70vh] overflow-y-auto bg-dex-tertiary border border-dex-secondary/30 text-white rounded-xl shadow-lg"
                align="center"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-white font-semibold px-4 py-3 sticky top-0 bg-dex-tertiary z-10">
                  Connect Hardware Wallet
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-dex-secondary/30" />

                {hardwareWallets.map(wallet => (
                  <DropdownMenuItem
                    key={wallet.id}
                    className="py-4 px-4 hover:bg-dex-secondary/50 focus:bg-dex-secondary/50 cursor-pointer min-h-[72px]"
                    onClick={() => handleConnectHardwareWallet(wallet)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
                          <Usb size={22} className="text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{wallet.name}</div>
                          <div className="text-sm text-gray-400">Hardware Wallet</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {wallet.connected ? (
                          <div className="flex items-center text-dex-positive">
                            <Check size={18} className="mr-1" />
                            <span>Connected</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400">
                            <AlertCircle size={18} className="mr-1" />
                            <span>Not Connected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Hardware Wallet Options */}
            <Button
              variant="outline"
              className="w-full justify-between border-dex-secondary/30 text-white min-h-[44px] mb-4"
              onClick={() => setShowHardwareWalletOptions(!showHardwareWalletOptions)}
            >
              <div className="flex items-center">
                <Shield size={18} className="mr-2 text-dex-positive" />
                <span>Connect Hardware Wallet</span>
              </div>
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${showHardwareWalletOptions ? 'rotate-180' : ''}`}
              />
            </Button>

            {showHardwareWalletOptions && (
              <HardwareWalletOptions onWalletSelect={handleHardwareWalletSelect} />
            )}

            {coldWalletTokens.length > 0 ? (
              <Card className="p-0 bg-dex-dark text-white border-dex-secondary/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)] backdrop-blur-sm mb-4">
                {coldWalletTokens.map(token => (
                  <TokenListItem
                    key={token.id}
                    token={token}
                    onSelect={() => handleGoToSwap(token)}
                  />
                ))}
              </Card>
            ) : (
              <EmptyStateCard
                title="No Tokens in Cold Wallet"
                description="Connect your hardware wallet to manage your cold storage assets."
                icon={<Shield size={40} />}
                actionLabel="Connect Hardware Wallet"
                onAction={() => setSelectedHardwareWallet(hardwareWallets[0])}
                className="mb-4"
              />
            )}

            <Button
              variant="primary"
              className="w-full h-14 flex items-center justify-center gap-2 px-4 py-3 text-base font-medium shadow-md shadow-dex-primary/30 hover:shadow-lg hover:shadow-dex-primary/40"
              onClick={handleAddWallet}
            >
              <Plus size={22} strokeWidth={2.5} />
              <span className="font-medium">Add Wallet</span>
            </Button>
          </TabsContent>
        </Tabs>
          </div>
        </TabsContent>

        {/* Activity Tab Content */}
        <TabsContent value="activity" className="mt-0">
          <Card className="bg-dex-dark text-white border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold">Transaction History</CardTitle>
              <CardDescription className="text-gray-400">View and filter your transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 min-h-[44px] bg-dex-secondary/10 border-dex-secondary/30 text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                      <SelectTrigger className="min-h-[44px] w-[130px] bg-dex-secondary/10 border-dex-secondary/30 text-white">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent className="bg-dex-tertiary border-dex-secondary/30 text-white">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="send">Send</SelectItem>
                        <SelectItem value="receive">Receive</SelectItem>
                        <SelectItem value="swap">Swap</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="min-h-[44px] w-[130px] bg-dex-secondary/10 border-dex-secondary/30 text-white">
                        <SelectValue placeholder="Date" />
                      </SelectTrigger>
                      <SelectContent className="bg-dex-tertiary border-dex-secondary/30 text-white">
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                        <SelectItem value="all">All time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Transaction List */}
                <div className="space-y-2">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                      <TransactionItem
                        key={transaction.id}
                        transaction={transaction}
                        onViewDetails={handleViewTransactionDetails}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                      <h3 className="text-lg font-medium text-white mb-1">No transactions found</h3>
                      <p className="text-gray-400">
                        {searchQuery
                          ? "Try adjusting your search or filters"
                          : "Your transaction history will appear here"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Earn Tab Content */}
        <TabsContent value="earn" className="mt-0">
          <Card className="bg-dex-dark text-white border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold">Earn Crypto</CardTitle>
              <CardDescription className="text-gray-400">Stake your assets to earn passive income</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-dex-secondary/10 rounded-lg p-4 border border-dex-secondary/20">
                  <h3 className="text-lg font-medium text-white mb-2">Available Staking Options</h3>
                  <div className="space-y-3">
                    {/* Staking Option 1 */}
                    <div className="flex items-center justify-between p-3 bg-dex-secondary/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                          <TokenIcon token={{ symbol: 'ETH', logo: '/crypto-icons/eth.svg' }} size="sm" />
                        </div>
                        <div>
                          <div className="font-medium text-white">Ethereum</div>
                          <div className="text-sm text-gray-400">Minimum: 0.1 ETH</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-dex-positive">4.5% APY</div>
                        <Button variant="primary" size="sm" className="mt-1 h-8">
                          Stake
                        </Button>
                      </div>
                    </div>

                    {/* Staking Option 2 */}
                    <div className="flex items-center justify-between p-3 bg-dex-secondary/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                          <TokenIcon token={{ symbol: 'SOL', logo: '/crypto-icons/sol.svg' }} size="sm" />
                        </div>
                        <div>
                          <div className="font-medium text-white">Solana</div>
                          <div className="text-sm text-gray-400">Minimum: 1 SOL</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-dex-positive">6.2% APY</div>
                        <Button variant="primary" size="sm" className="mt-1 h-8">
                          Stake
                        </Button>
                      </div>
                    </div>

                    {/* Staking Option 3 */}
                    <div className="flex items-center justify-between p-3 bg-dex-secondary/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                          <TokenIcon token={{ symbol: 'USDT', logo: '/crypto-icons/usdt.svg' }} size="sm" />
                        </div>
                        <div>
                          <div className="font-medium text-white">Tether USD</div>
                          <div className="text-sm text-gray-400">Minimum: 100 USDT</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-dex-positive">3.8% APY</div>
                        <Button variant="primary" size="sm" className="mt-1 h-8">
                          Stake
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-dex-secondary/10 rounded-lg p-4 border border-dex-secondary/20">
                  <h3 className="text-lg font-medium text-white mb-2">Your Staked Assets</h3>
                  <div className="text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-dex-secondary/20 flex items-center justify-center mx-auto mb-3">
                      <ArrowUpDown className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-400 mb-4">You don't have any staked assets yet</p>
                    <Button variant="outline" className="border-dex-secondary/30">
                      Explore Staking Options
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab Content */}
        <TabsContent value="settings" className="mt-0">
          <Card className="bg-dex-dark text-white border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold">Wallet Settings</CardTitle>
              <CardDescription className="text-gray-400">Manage your wallet preferences and security</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Security Settings */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Security</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Transaction Confirmations</Label>
                        <p className="text-sm text-gray-400">Require confirmation for all transactions</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Biometric Authentication</Label>
                        <p className="text-sm text-gray-400">Use fingerprint or face ID for transactions</p>
                      </div>
                      <Switch />
                    </div>
                    <Button variant="outline" className="w-full border-dex-secondary/30 mt-2" onClick={() => navigate('/security')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Advanced Security Settings
                    </Button>
                  </div>
                </div>

                <Separator className="bg-dex-secondary/20" />

                {/* Wallet Management */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Wallet Management</h3>
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full border-dex-secondary/30"
                      onClick={handleNavigateToWalletGeneration}
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Generate New Wallet
                    </Button>
                    <Button variant="outline" className="w-full border-dex-secondary/30" onClick={handleAddWallet}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add External Wallet
                    </Button>
                    <Button variant="outline" className="w-full border-dex-secondary/30">
                      <Download className="mr-2 h-4 w-4" />
                      Backup Wallet
                    </Button>
                  </div>
                </div>

                <Separator className="bg-dex-secondary/20" />

                {/* Display Settings */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Display Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Hide Small Balances</Label>
                        <p className="text-sm text-gray-400">Hide tokens with small balances</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Default Currency</Label>
                        <p className="text-sm text-gray-400">Display values in your preferred currency</p>
                      </div>
                      <Select defaultValue="usd">
                        <SelectTrigger className="w-[100px] bg-dex-secondary/10 border-dex-secondary/30 text-white">
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent className="bg-dex-tertiary border-dex-secondary/30 text-white">
                          <SelectItem value="usd">USD</SelectItem>
                          <SelectItem value="eur">EUR</SelectItem>
                          <SelectItem value="gbp">GBP</SelectItem>
                          <SelectItem value="jpy">JPY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hardware Wallet Connection Modal */}
      <HardwareWalletConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        wallet={selectedHardwareWalletOption}
        onConnect={handleHardwareWalletConnect}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default WalletPage;
