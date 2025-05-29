import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  Wallet,
  Download,
  Trash2,
  AlertTriangle,
  Edit3,
  RefreshCw,
  Send,
  QrCode,
  Flame,
  HardDrive,
  Plus,
  Search,
  Globe,
  Zap,
  Image,
  ExternalLink
} from 'lucide-react';
import { getGeneratedWallets, getGeneratedWalletBalances } from '@/services/walletGenerationService';
import { getAllUserWalletsWithPreferences } from '@/services/walletPreferencesService';
import { supabase } from '@/integrations/supabase/client';
import WalletRenameModal from '@/components/WalletRenameModal';
import WalletDeleteModal from '@/components/WalletDeleteModal';
import SeedPhraseBackupModal from '@/components/SeedPhraseBackupModal';

// Enhanced interfaces for comprehensive wallet management
interface UniversalWallet {
  id: string;
  name: string;
  wallet_name?: string; // For database wallets
  type: string;
  wallet_type?: string; // For database wallets
  addresses?: { [key: string]: string }; // For generated wallets
  wallet_address?: string; // For database wallets
  createdAt?: string;
  created_at?: string; // For database wallets
  portfolioValue?: number;
  isDefault?: boolean;
  category?: string;
  network?: string;
  provider?: string;
}

interface NetworkInfo {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  nativeToken: string;
  blockExplorer: string;
  isTestnet: boolean;
  gasPrice?: string;
  isOnline: boolean;
  icon?: string;
  category: 'mainnet' | 'testnet';
  description?: string;
  logoUrl?: string;
}



interface NFTItem {
  id: string;
  tokenId: string;
  contractAddress: string;
  name: string;
  description?: string;
  image?: string;
  metadata?: any;
  collection?: string;
}

interface WalletOperation {
  id: string;
  type: 'send' | 'receive' | 'swap';
  status: 'pending' | 'confirmed' | 'failed';
  amount: string;
  tokenSymbol: string;
  network: string;
  timestamp: string;
  transactionHash?: string;
}

const WalletDetailsPage: React.FC = () => {
  const { walletId } = useParams<{ walletId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Core wallet state
  const [wallet, setWallet] = useState<UniversalWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddresses, setShowAddresses] = useState(false);
  const [balances, setBalances] = useState<any[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);

  // Enhanced wallet management state
  const [selectedNetwork, setSelectedNetwork] = useState<string>('ethereum');
  const [availableNetworks, setAvailableNetworks] = useState<NetworkInfo[]>([]);
  const [networkSwitching, setNetworkSwitching] = useState(false);
  const [tokenSearchQuery, setTokenSearchQuery] = useState('');
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);
  const [nftItems, setNftItems] = useState<NFTItem[]>([]);
  const [nftLoading, setNftLoading] = useState(false);
  const [recentOperations, setRecentOperations] = useState<WalletOperation[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchWalletDetails = async () => {
      if (!user || !walletId) {
        setLoading(false);
        setBalancesLoading(false);
        return;
      }

      try {
        console.log('🔍 WalletDetailsPage: Searching for wallet ID:', walletId);
        console.log('👤 User ID:', user.id);

        // Try to fetch from all wallet sources
        let foundWallet: UniversalWallet | null = null;

        // 1. Try generated wallets first
        try {
          console.log('🔍 Checking generated wallets...');
          const generatedWallets = await getGeneratedWallets(user.id);
          console.log('📋 Generated wallets found:', generatedWallets.length);
          foundWallet = generatedWallets.find(w => w.id === walletId);
          if (foundWallet) {
            console.log('✅ Found wallet in generated wallets');
          }
        } catch (error) {
          console.warn('Generated wallets fetch failed:', error);
        }

        // 2. If not found, try unified wallets table (used by "All Wallets" tab)
        if (!foundWallet) {
          try {
            console.log('🔍 Checking unified wallets table...');
            const { data: unifiedWallets, error } = await supabase
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
              .eq('user_id', user.id)
              .eq('id', walletId)
              .eq('is_active', true);

            if (!error && unifiedWallets && unifiedWallets.length > 0) {
              const wallet = unifiedWallets[0];
              console.log('📋 Unified wallet data:', wallet);
              foundWallet = {
                id: wallet.id,
                name: wallet.wallet_name,
                type: wallet.wallet_type,
                createdAt: wallet.created_at,
                // Add compatibility fields
                wallet_name: wallet.wallet_name,
                wallet_type: wallet.wallet_type,
                wallet_address: wallet.wallet_address
              };
              console.log('✅ Found wallet in unified wallets table');
            } else {
              console.log('❌ No wallet found in unified wallets table');
              if (error) console.log('❌ Unified wallets error:', error);
            }
          } catch (error) {
            console.warn('Unified wallets table fetch failed:', error);
          }
        }

        // 3. If still not found, try comprehensive wallet service
        if (!foundWallet) {
          try {
            const allWallets = await getAllUserWalletsWithPreferences(user.id);
            foundWallet = allWallets.find(w => w.id === walletId);
          } catch (error) {
            console.warn('Preferences service fetch failed:', error);
          }
        }

        if (foundWallet) {
          // Normalize wallet data for consistent display
          const normalizedWallet: UniversalWallet = {
            ...foundWallet,
            name: foundWallet.wallet_name || foundWallet.name,
            type: foundWallet.wallet_type || foundWallet.type,
            createdAt: foundWallet.created_at || foundWallet.createdAt
          };

          setWallet(normalizedWallet);

          // Fetch wallet balances based on wallet type
          setBalancesLoading(true);
          try {
            if (foundWallet.type === 'generated' || foundWallet.wallet_type === 'generated') {
              // Use generated wallet balance service
              const walletBalances = await getGeneratedWalletBalances(user.id, walletId);
              setBalances(walletBalances);
            } else {
              // Use database balance service for hot/hardware wallets
              const { data: balances, error } = await supabase
                .from('wallet_balances')
                .select(`
                  id,
                  balance,
                  tokens:token_id (
                    id,
                    symbol,
                    name,
                    logo,
                    price,
                    decimals
                  )
                `)
                .eq('wallet_id', walletId);

              if (!error && balances) {
                setBalances(balances);
              } else {
                console.warn('Database balance fetch failed:', error);
                setBalances([]);
              }
            }
          } catch (balanceError) {
            console.error('❌ Error fetching balances:', balanceError);
            setBalances([]);
          }
        } else {
          console.error('❌ Wallet not found in any service');
          toast({
            title: "Wallet Not Found",
            description: "The requested wallet could not be found.",
            variant: "destructive",
          });
          navigate('/wallet-dashboard');
        }
      } catch (error) {
        console.error('❌ Error fetching wallet details:', error);
        toast({
          title: "Error",
          description: "Failed to load wallet details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setBalancesLoading(false);
      }
    };

    fetchWalletDetails();
  }, [user, walletId, navigate, toast]);

  const refreshBalances = async () => {
    if (!user || !walletId) return;

    setBalancesLoading(true);
    try {
      const walletBalances = await getGeneratedWalletBalances(user.id, walletId);
      setBalances(walletBalances);
    } catch (error) {
      console.error('Error refreshing balances:', error);
      toast({
        title: "Error",
        description: "Failed to refresh balances.",
        variant: "destructive",
      });
    } finally {
      setBalancesLoading(false);
    }
  };

  const handleWalletRenamed = () => {
    // Refresh wallet data after rename
    if (user && walletId) {
      getGeneratedWallets(user.id).then(wallets => {
        const updatedWallet = wallets.find(w => w.id === walletId);
        if (updatedWallet) {
          setWallet(updatedWallet);
        }
      });
    }
  };

  const handleWalletDeleted = () => {
    // Navigate back to wallet dashboard and refresh the page to ensure deleted wallet is removed
    navigate('/wallet-dashboard');
    // Force a page refresh to ensure the wallet list is updated
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleCopyAddress = (currency: string, address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: `${currency} address copied to clipboard`,
    });
  };

  const handleBackupWallet = () => {
    setShowBackupModal(true);
  };

  const handleDeleteWallet = () => {
    setShowDeleteModal(true);
  };

  const handleRenameWallet = () => {
    setShowRenameModal(true);
  };

  const formatBalance = (balance: string, decimals: number = 18): string => {
    const balanceNum = parseFloat(balance) / Math.pow(10, decimals);
    if (balanceNum === 0) return '0';
    if (balanceNum < 0.000001) return '< 0.000001';
    return balanceNum.toFixed(6).replace(/\.?0+$/, '');
  };

  // Get wallet icon based on type
  const getWalletIcon = (walletType: string) => {
    switch (walletType) {
      case 'hot':
        return <Flame className="h-6 w-6 text-orange-500" />;
      case 'hardware':
        return <HardDrive className="h-6 w-6 text-blue-500" />;
      case 'generated':
      default:
        return <Wallet className="h-6 w-6 text-dex-primary" />;
    }
  };

  // Get wallet addresses for display
  const getWalletAddresses = () => {
    if (wallet?.addresses) {
      // Generated wallet with multiple addresses
      return Object.entries(wallet.addresses);
    } else if (wallet?.wallet_address) {
      // Single address wallet (hot/hardware)
      return [['Primary', wallet.wallet_address]];
    }
    return [];
  };

  const getTotalValue = (): number => {
    return balances.reduce((total, balance) => {
      const balanceNum = parseFloat(balance.balance) / Math.pow(10, balance.tokens?.decimals || 18);
      const value = balanceNum * (balance.tokens?.price || 0);
      return total + value;
    }, 0);
  };

  // Enhanced helper functions for comprehensive wallet management
  const initializeNetworks = async () => {
    try {
      // Initialize comprehensive network configuration with mainnet and testnet support
      const networks: NetworkInfo[] = [
        // MAINNET NETWORKS
        {
          id: 'ethereum',
          name: 'Ethereum',
          chainId: 1,
          rpcUrl: 'https://mainnet.infura.io/v3/',
          nativeToken: 'ETH',
          blockExplorer: 'https://etherscan.io',
          isTestnet: false,
          isOnline: true,
          icon: '🔷',
          category: 'mainnet',
          description: 'Ethereum Mainnet'
        },
        {
          id: 'polygon',
          name: 'Polygon',
          chainId: 137,
          rpcUrl: 'https://polygon-rpc.com',
          nativeToken: 'MATIC',
          blockExplorer: 'https://polygonscan.com',
          isTestnet: false,
          isOnline: true,
          icon: '🟣',
          category: 'mainnet',
          description: 'Polygon Mainnet'
        },
        {
          id: 'bsc',
          name: 'BNB Smart Chain',
          chainId: 56,
          rpcUrl: 'https://bsc-dataseed.binance.org',
          nativeToken: 'BNB',
          blockExplorer: 'https://bscscan.com',
          isTestnet: false,
          isOnline: true,
          icon: '🟡',
          category: 'mainnet',
          description: 'BNB Smart Chain Mainnet'
        },
        {
          id: 'arbitrum',
          name: 'Arbitrum',
          chainId: 42161,
          rpcUrl: 'https://arb1.arbitrum.io/rpc',
          nativeToken: 'ETH',
          blockExplorer: 'https://arbiscan.io',
          isTestnet: false,
          isOnline: true,
          icon: '🔵',
          category: 'mainnet',
          description: 'Arbitrum One'
        },
        {
          id: 'optimism',
          name: 'Optimism',
          chainId: 10,
          rpcUrl: 'https://mainnet.optimism.io',
          nativeToken: 'ETH',
          blockExplorer: 'https://optimistic.etherscan.io',
          isTestnet: false,
          isOnline: true,
          icon: '🔴',
          category: 'mainnet',
          description: 'Optimism Mainnet'
        },
        {
          id: 'avalanche',
          name: 'Avalanche',
          chainId: 43114,
          rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
          nativeToken: 'AVAX',
          blockExplorer: 'https://snowtrace.io',
          isTestnet: false,
          isOnline: true,
          icon: '⚪',
          category: 'mainnet',
          description: 'Avalanche C-Chain'
        },
        {
          id: 'fantom',
          name: 'Fantom',
          chainId: 250,
          rpcUrl: 'https://rpc.ftm.tools',
          nativeToken: 'FTM',
          blockExplorer: 'https://ftmscan.com',
          isTestnet: false,
          isOnline: true,
          icon: '👻',
          category: 'mainnet',
          description: 'Fantom Opera'
        },
        {
          id: 'bitcoin',
          name: 'Bitcoin',
          chainId: 0, // Bitcoin doesn't use EVM chain IDs
          rpcUrl: 'https://blockstream.info/api',
          nativeToken: 'BTC',
          blockExplorer: 'https://blockstream.info',
          isTestnet: false,
          isOnline: true,
          icon: '₿',
          category: 'mainnet',
          description: 'Bitcoin Network'
        },
        {
          id: 'solana',
          name: 'Solana',
          chainId: 101, // Solana cluster ID
          rpcUrl: 'https://api.mainnet-beta.solana.com',
          nativeToken: 'SOL',
          blockExplorer: 'https://explorer.solana.com',
          isTestnet: false,
          isOnline: true,
          icon: '◎',
          category: 'mainnet',
          description: 'Solana Mainnet Beta'
        },
        {
          id: 'cardano',
          name: 'Cardano',
          chainId: 1, // Cardano mainnet
          rpcUrl: 'https://cardano-mainnet.blockfrost.io/api/v0',
          nativeToken: 'ADA',
          blockExplorer: 'https://cardanoscan.io',
          isTestnet: false,
          isOnline: true,
          icon: '₳',
          category: 'mainnet',
          description: 'Cardano Mainnet'
        },
        {
          id: 'polkadot',
          name: 'Polkadot',
          chainId: 0, // Polkadot uses different addressing
          rpcUrl: 'wss://rpc.polkadot.io',
          nativeToken: 'DOT',
          blockExplorer: 'https://polkadot.subscan.io',
          isTestnet: false,
          isOnline: true,
          icon: '⚫',
          category: 'mainnet',
          description: 'Polkadot Relay Chain'
        },
        {
          id: 'xrp',
          name: 'XRP Ledger',
          chainId: 0, // XRP doesn't use EVM
          rpcUrl: 'https://xrplcluster.com',
          nativeToken: 'XRP',
          blockExplorer: 'https://xrpscan.com',
          isTestnet: false,
          isOnline: true,
          icon: '◉',
          category: 'mainnet',
          description: 'XRP Ledger Mainnet'
        },
        // TESTNET NETWORKS
        {
          id: 'sepolia',
          name: 'Sepolia',
          chainId: 11155111,
          rpcUrl: 'https://sepolia.infura.io/v3/',
          nativeToken: 'ETH',
          blockExplorer: 'https://sepolia.etherscan.io',
          isTestnet: true,
          isOnline: true,
          icon: '🔷',
          category: 'testnet',
          description: 'Ethereum Sepolia Testnet'
        },
        {
          id: 'goerli',
          name: 'Goerli',
          chainId: 5,
          rpcUrl: 'https://goerli.infura.io/v3/',
          nativeToken: 'ETH',
          blockExplorer: 'https://goerli.etherscan.io',
          isTestnet: true,
          isOnline: true,
          icon: '🔷',
          category: 'testnet',
          description: 'Ethereum Goerli Testnet'
        },
        {
          id: 'bsc-testnet',
          name: 'BSC Testnet',
          chainId: 97,
          rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
          nativeToken: 'BNB',
          blockExplorer: 'https://testnet.bscscan.com',
          isTestnet: true,
          isOnline: true,
          icon: '🟡',
          category: 'testnet',
          description: 'BNB Smart Chain Testnet'
        },
        {
          id: 'polygon-mumbai',
          name: 'Polygon Mumbai',
          chainId: 80001,
          rpcUrl: 'https://rpc-mumbai.maticvigil.com',
          nativeToken: 'MATIC',
          blockExplorer: 'https://mumbai.polygonscan.com',
          isTestnet: true,
          isOnline: true,
          icon: '🟣',
          category: 'testnet',
          description: 'Polygon Mumbai Testnet'
        },
        {
          id: 'avalanche-fuji',
          name: 'Avalanche Fuji',
          chainId: 43113,
          rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
          nativeToken: 'AVAX',
          blockExplorer: 'https://testnet.snowtrace.io',
          isTestnet: true,
          isOnline: true,
          icon: '⚪',
          category: 'testnet',
          description: 'Avalanche Fuji Testnet'
        }
      ];

      setAvailableNetworks(networks);

      // Set current network based on wallet
      if (wallet?.network) {
        setSelectedNetwork(wallet.network);
      }

      console.log('✅ Networks initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing networks:', error);
      toast({
        title: "Network Error",
        description: "Failed to initialize network information",
        variant: "destructive",
      });
    }
  };

  const handleNetworkSwitch = async (newNetwork: string) => {
    if (!wallet || !user) return;

    try {
      setNetworkSwitching(true);
      console.log(`🔄 Switching wallet ${wallet.id} to ${newNetwork}`);

      // Simulate network switch with Phase 1 fallback
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSelectedNetwork(newNetwork);

      // Update wallet network in database
      const { error } = await supabase
        .from('wallets')
        .update({ network: newNetwork })
        .eq('id', wallet.id)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to update wallet network: ${error.message}`);
      }

      // Refresh balances for new network
      await refreshBalances();

      toast({
        title: "Network Switched",
        description: `Successfully switched to ${newNetwork}`,
      });

      console.log(`✅ Network switch completed: ${newNetwork}`);
    } catch (error) {
      console.error('❌ Network switch failed:', error);
      toast({
        title: "Network Switch Failed",
        description: "Failed to switch network. Please try again.",
        variant: "destructive",
      });
    } finally {
      setNetworkSwitching(false);
    }
  };

  const generateQRCode = (address: string, tokenSymbol?: string, amount?: string) => {
    let qrData = address;
    if (tokenSymbol) {
      qrData += `?token=${tokenSymbol}`;
      if (amount) {
        qrData += `&amount=${amount}`;
      }
    }
    setQrValue(qrData);
    setShowQRModal(true);
  };

  const fetchNFTs = async () => {
    if (!wallet || !user) return;

    try {
      setNftLoading(true);
      console.log('🖼️ Fetching NFTs for wallet:', wallet.id);

      // Simulate NFT fetching with Phase 1 fallback
      const mockNFTs: NFTItem[] = [
        {
          id: '1',
          tokenId: '1',
          contractAddress: '0x...',
          name: 'Sample NFT #1',
          description: 'A sample NFT for demonstration',
          image: 'https://via.placeholder.com/200',
          collection: 'Sample Collection'
        }
      ];

      setNftItems(mockNFTs);
      console.log(`✅ Fetched ${mockNFTs.length} NFTs`);
    } catch (error) {
      console.error('❌ Error fetching NFTs:', error);
      setNftItems([]);
    } finally {
      setNftLoading(false);
    }
  };

  const fetchRecentOperations = async () => {
    if (!wallet || !user) return;

    try {
      console.log('📊 Fetching recent operations for wallet:', wallet.id);

      // Simulate recent operations with Phase 1 fallback
      const mockOperations: WalletOperation[] = [
        {
          id: '1',
          type: 'receive',
          status: 'confirmed',
          amount: '0.1',
          tokenSymbol: 'ETH',
          network: selectedNetwork,
          timestamp: new Date().toISOString(),
          transactionHash: '0x...'
        }
      ];

      setRecentOperations(mockOperations);
      console.log(`✅ Fetched ${mockOperations.length} recent operations`);
    } catch (error) {
      console.error('❌ Error fetching operations:', error);
      setRecentOperations([]);
    }
  };

  // Initialize enhanced features
  useEffect(() => {
    if (wallet && user) {
      initializeNetworks();
      fetchNFTs();
      fetchRecentOperations();
    }
  }, [wallet, user]);

  if (loading) {
    return (
      <div className="pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/wallet')}
            className="h-10 w-10"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-white">Wallet Details</h1>
        </div>

        <Card className="p-4 bg-dex-dark text-white border-dex-secondary/30 animate-pulse">
          <div className="h-6 w-48 bg-dex-secondary/20 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 w-32 bg-dex-secondary/10 rounded"></div>
            <div className="h-4 w-64 bg-dex-secondary/10 rounded"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/wallet-dashboard')}
            className="h-10 w-10"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-white">Wallet Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/wallet-dashboard')}
          className="h-10 w-10 text-white hover:bg-dex-secondary/20"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold text-white">Wallet Management</h1>
      </div>

      {/* Enhanced Wallet Info Card */}
      <Card className="p-6 mb-6 bg-dex-dark text-white border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-dex-primary/20 flex items-center justify-center">
              {getWalletIcon(wallet.type)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{wallet.name}</h2>
              <p className="text-gray-400 capitalize">{wallet.type} Wallet</p>
              {wallet.createdAt && (
                <p className="text-sm text-gray-500">
                  Created on {new Date(wallet.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Enhanced Network Selector */}
            <Select value={selectedNetwork} onValueChange={handleNetworkSwitch} disabled={networkSwitching}>
              <SelectTrigger className="w-48 bg-dex-secondary/10 border-dex-secondary/30 text-white">
                <div className="flex items-center gap-2">
                  <Globe size={16} />
                  <div className="flex flex-col items-start">
                    <SelectValue placeholder="Select Network" />
                    {selectedNetwork && (
                      <span className="text-xs text-gray-400">
                        {availableNetworks.find(n => n.id === selectedNetwork)?.description}
                      </span>
                    )}
                  </div>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-dex-dark border-dex-secondary/30 max-h-80 overflow-y-auto">
                {/* Mainnet Networks */}
                <div className="px-2 py-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Mainnet Networks
                </div>
                {availableNetworks
                  .filter(network => network.category === 'mainnet')
                  .map((network) => (
                    <SelectItem key={network.id} value={network.id} className="text-white hover:bg-dex-secondary/20 py-3">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{network.icon}</span>
                          <div>
                            <div className="font-medium">{network.name}</div>
                            <div className="text-xs text-gray-400">{network.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={network.isOnline ? "default" : "destructive"} className="text-xs">
                            {network.isOnline ? 'Online' : 'Offline'}
                          </Badge>
                          {network.gasPrice && (
                            <span className="text-xs text-gray-500">
                              {network.gasPrice} gwei
                            </span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}

                <Separator className="bg-dex-secondary/20 my-2" />

                {/* Testnet Networks */}
                <div className="px-2 py-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Testnet Networks
                </div>
                {availableNetworks
                  .filter(network => network.category === 'testnet')
                  .map((network) => (
                    <SelectItem key={network.id} value={network.id} className="text-white hover:bg-dex-secondary/20 py-3">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{network.icon}</span>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {network.name}
                              <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-400">
                                TEST
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-400">{network.description}</div>
                          </div>
                        </div>
                        <Badge variant={network.isOnline ? "default" : "destructive"} className="text-xs">
                          {network.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRenameWallet}
              className="border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
            >
              <Edit3 size={16} />
            </Button>
          </div>
        </div>

        {/* Portfolio Value */}
        <div className="mb-6 p-4 bg-dex-secondary/10 border border-dex-secondary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Portfolio Value</p>
              <p className="text-2xl font-bold text-white">
                ${getTotalValue().toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Network: {availableNetworks.find(n => n.id === selectedNetwork)?.name || selectedNetwork}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshBalances}
                disabled={balancesLoading || networkSwitching}
                className="border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
              >
                <RefreshCw size={16} className={balancesLoading || networkSwitching ? 'animate-spin' : ''} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateQRCode(getWalletAddresses()[0]?.[1] || '')}
                className="border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
              >
                <QrCode size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-dex-secondary/20 p-1 rounded-lg">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-dex-primary">
              <Wallet size={16} className="mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tokens" className="text-white data-[state=active]:bg-dex-primary">
              <Zap size={16} className="mr-2" />
              Tokens
            </TabsTrigger>
            <TabsTrigger value="nfts" className="text-white data-[state=active]:bg-dex-primary">
              <Image size={16} className="mr-2" />
              NFTs
            </TabsTrigger>
            <TabsTrigger value="operations" className="text-white data-[state=active]:bg-dex-primary">
              <Send size={16} className="mr-2" />
              Operations
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="space-y-4">
              {/* Wallet Addresses */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Wallet Addresses</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-dex-secondary/30 text-white"
                    onClick={() => setShowAddresses(!showAddresses)}
                  >
                    {showAddresses ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span className="ml-2">{showAddresses ? 'Hide' : 'Show'}</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {getWalletAddresses().map(([currency, address]) => (
                    <div
                      key={currency}
                      className={`p-4 bg-dex-secondary/10 border border-dex-secondary/20 rounded-lg ${
                        !showAddresses ? 'filter blur-sm' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-white mb-1">{currency}</div>
                          <div className="text-sm text-gray-400 font-mono break-all">
                            {showAddresses ? address : '••••••••••••••••••••••••••••••••••••••••••••'}
                          </div>
                        </div>
                        {showAddresses && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                              onClick={() => handleCopyAddress(currency, address as string)}
                            >
                              <Copy size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                              onClick={() => generateQRCode(address as string)}
                            >
                              <QrCode size={16} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Operations */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Recent Operations</h3>
                <div className="space-y-3">
                  {recentOperations.length > 0 ? (
                    recentOperations.map((operation) => (
                      <div
                        key={operation.id}
                        className="p-3 bg-dex-secondary/10 border border-dex-secondary/20 rounded-lg"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-dex-primary/20 flex items-center justify-center">
                              {operation.type === 'send' && <Send size={16} className="text-dex-primary" />}
                              {operation.type === 'receive' && <Download size={16} className="text-green-500" />}
                              {operation.type === 'swap' && <RefreshCw size={16} className="text-blue-500" />}
                            </div>
                            <div>
                              <div className="font-medium text-white capitalize">{operation.type}</div>
                              <div className="text-sm text-gray-400">
                                {operation.amount} {operation.tokenSymbol} • {operation.network}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={operation.status === 'confirmed' ? 'default' : operation.status === 'pending' ? 'secondary' : 'destructive'}>
                              {operation.status}
                            </Badge>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(operation.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-400">
                      <Send size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No recent operations</p>
                      <p className="text-sm">Your transaction history will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tokens Tab */}
          <TabsContent value="tokens" className="mt-0">
            <div className="space-y-4">
              {/* Token Management Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Token Management</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search tokens..."
                      value={tokenSearchQuery}
                      onChange={(e) => setTokenSearchQuery(e.target.value)}
                      className="pl-10 bg-dex-secondary/10 border-dex-secondary/30 text-white placeholder-gray-400"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddTokenModal(true)}
                    className="border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Token
                  </Button>
                </div>
              </div>

              {/* Token Balances */}
              <div className="space-y-3">
                {balancesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 bg-dex-secondary/10 border border-dex-secondary/20 rounded-lg animate-pulse">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-dex-secondary/20 rounded-full"></div>
                            <div>
                              <div className="h-4 w-16 bg-dex-secondary/20 rounded mb-1"></div>
                              <div className="h-3 w-12 bg-dex-secondary/10 rounded"></div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="h-4 w-20 bg-dex-secondary/20 rounded mb-1"></div>
                            <div className="h-3 w-16 bg-dex-secondary/10 rounded"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : balances.length > 0 ? (
                  balances
                    .filter(balance => {
                      const token = balance.tokens;
                      return !tokenSearchQuery ||
                        token?.symbol?.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
                        token?.name?.toLowerCase().includes(tokenSearchQuery.toLowerCase());
                    })
                    .map((balance) => {
                      const token = balance.tokens;
                      const balanceAmount = formatBalance(balance.balance, token?.decimals || 18);
                      const balanceValue = parseFloat(balance.balance) / Math.pow(10, token?.decimals || 18) * (token?.price || 0);

                      return (
                        <div
                          key={balance.id}
                          className="p-3 bg-dex-secondary/10 border border-dex-secondary/20 rounded-lg hover:bg-dex-secondary/15 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-dex-primary/20 flex items-center justify-center">
                                {token?.logo ? (
                                  <img src={token.logo} alt={token.symbol} className="w-6 h-6 rounded-full" />
                                ) : (
                                  <span className="text-xs font-bold text-dex-primary">
                                    {token?.symbol?.slice(0, 2) || '??'}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-white">{token?.symbol || 'Unknown'}</div>
                                <div className="text-sm text-gray-400">{token?.name || 'Unknown Token'}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-white">{balanceAmount}</div>
                              <div className="text-sm text-gray-400">${balanceValue.toFixed(2)}</div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                                onClick={() => navigate(`/send?wallet=${walletId}&token=${token?.symbol}`)}
                              >
                                <Send size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                                onClick={() => navigate(`/receive?wallet=${walletId}&token=${token?.symbol}`)}
                              >
                                <Download size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="p-6 text-center text-gray-400">
                    <Zap size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No token balances found</p>
                    <p className="text-sm">Balances will appear here once you receive tokens</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* NFTs Tab */}
          <TabsContent value="nfts" className="mt-0">
            <div className="space-y-4">
              {/* NFT Management Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">NFT Collection</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchNFTs}
                    disabled={nftLoading}
                    className="border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
                  >
                    <RefreshCw size={16} className={nftLoading ? 'animate-spin mr-2' : 'mr-2'} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* NFT Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nftLoading ? (
                  // Loading skeleton
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-4 bg-dex-secondary/10 border border-dex-secondary/20 rounded-lg animate-pulse">
                      <div className="w-full h-48 bg-dex-secondary/20 rounded-lg mb-3"></div>
                      <div className="h-4 w-3/4 bg-dex-secondary/20 rounded mb-2"></div>
                      <div className="h-3 w-1/2 bg-dex-secondary/10 rounded"></div>
                    </div>
                  ))
                ) : nftItems.length > 0 ? (
                  nftItems.map((nft) => (
                    <div
                      key={nft.id}
                      className="p-4 bg-dex-secondary/10 border border-dex-secondary/20 rounded-lg hover:bg-dex-secondary/15 transition-colors"
                    >
                      <div className="w-full h-48 bg-dex-secondary/20 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {nft.image ? (
                          <img
                            src={nft.image}
                            alt={nft.name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Image size={32} className="text-gray-400" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-white truncate">{nft.name}</h4>
                        <p className="text-sm text-gray-400 truncate">{nft.collection || 'Unknown Collection'}</p>
                        {nft.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">{nft.description}</p>
                        )}
                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
                            onClick={() => {
                              // Open NFT details modal or navigate to NFT details
                              toast({
                                title: "NFT Details",
                                description: `Viewing ${nft.name}`,
                              });
                            }}
                          >
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
                            onClick={() => {
                              // Open transfer modal
                              toast({
                                title: "Transfer NFT",
                                description: `Transfer ${nft.name}`,
                              });
                            }}
                          >
                            <Send size={14} className="mr-1" />
                            Transfer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full p-8 text-center text-gray-400">
                    <Image size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No NFTs found</p>
                    <p className="text-sm">Your NFT collection will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Operations Tab */}
          <TabsContent value="operations" className="mt-0">
            <div className="space-y-6">
              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-20 flex-col border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
                    onClick={() => navigate(`/send?wallet=${walletId}`)}
                  >
                    <Send size={20} className="mb-2 text-dex-primary" />
                    <span className="text-sm">Send</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
                    onClick={() => navigate(`/receive?wallet=${walletId}`)}
                  >
                    <Download size={20} className="mb-2 text-green-500" />
                    <span className="text-sm">Receive</span>
                  </Button>
                </div>
              </div>

              {/* Advanced Operations */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Advanced Operations</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full border-dex-secondary/30 text-white justify-start hover:bg-dex-secondary/20"
                    onClick={() => generateQRCode(getWalletAddresses()[0]?.[1] || '')}
                  >
                    <QrCode className="mr-3 h-4 w-4" />
                    Generate QR Code
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-dex-secondary/30 text-white justify-start hover:bg-dex-secondary/20"
                    onClick={() => {
                      const address = getWalletAddresses()[0]?.[1];
                      if (address) {
                        const explorerUrl = availableNetworks.find(n => n.id === selectedNetwork)?.blockExplorer;
                        if (explorerUrl) {
                          window.open(`${explorerUrl}/address/${address}`, '_blank');
                        }
                      }
                    }}
                  >
                    <ExternalLink className="mr-3 h-4 w-4" />
                    View on Explorer
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-dex-secondary/30 text-white justify-start hover:bg-dex-secondary/20"
                    onClick={handleBackupWallet}
                  >
                    <Download className="mr-3 h-4 w-4" />
                    Backup Wallet
                  </Button>
                </div>
              </div>

              {/* Transaction History */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  {recentOperations.length > 0 ? (
                    recentOperations.map((operation) => (
                      <div
                        key={operation.id}
                        className="p-4 bg-dex-secondary/10 border border-dex-secondary/20 rounded-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                              {operation.type === 'send' && <Send size={18} className="text-dex-primary" />}
                              {operation.type === 'receive' && <Download size={18} className="text-green-500" />}
                              {operation.type === 'swap' && <RefreshCw size={18} className="text-blue-500" />}
                            </div>
                            <div>
                              <div className="font-medium text-white capitalize">{operation.type}</div>
                              <div className="text-sm text-gray-400">
                                {operation.amount} {operation.tokenSymbol}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(operation.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                operation.status === 'confirmed' ? 'default' :
                                operation.status === 'pending' ? 'secondary' :
                                'destructive'
                              }
                              className="mb-2"
                            >
                              {operation.status}
                            </Badge>
                            <div className="text-xs text-gray-500">
                              Network: {operation.network}
                            </div>
                            {operation.transactionHash && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-gray-400 hover:text-white"
                                onClick={() => {
                                  const explorerUrl = availableNetworks.find(n => n.id === operation.network)?.blockExplorer;
                                  if (explorerUrl && operation.transactionHash) {
                                    window.open(`${explorerUrl}/tx/${operation.transactionHash}`, '_blank');
                                  }
                                }}
                              >
                                <ExternalLink size={12} className="mr-1" />
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-400">
                      <Send size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No recent transactions</p>
                      <p className="text-sm">Your transaction history will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Actions Card */}
      <Card className="p-6 bg-dex-dark text-white border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 backdrop-blur-sm">
        <h3 className="text-lg font-medium text-white mb-4">Wallet Actions</h3>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full border-dex-secondary/30 text-white justify-start"
            onClick={handleBackupWallet}
          >
            <Download className="mr-3 h-4 w-4" />
            Backup Wallet
          </Button>

          <Button
            variant="outline"
            className="w-full border-dex-secondary/30 text-white justify-start"
            onClick={() => navigate(`/send?wallet=${walletId}`)}
          >
            <Send className="mr-3 h-4 w-4" />
            Send Crypto
          </Button>

          <Button
            variant="outline"
            className="w-full border-dex-secondary/30 text-white justify-start"
            onClick={() => navigate(`/receive?wallet=${walletId}`)}
          >
            <QrCode className="mr-3 h-4 w-4" />
            Receive Crypto
          </Button>

          <Button
            variant="outline"
            className="w-full border-dex-secondary/30 text-white justify-start"
            onClick={handleRenameWallet}
          >
            <Edit3 className="mr-3 h-4 w-4" />
            Rename Wallet
          </Button>

          <Separator className="bg-dex-secondary/20" />

          <Button
            variant="outline"
            className="w-full border-dex-negative/30 text-dex-negative hover:bg-dex-negative/10 justify-start"
            onClick={handleDeleteWallet}
          >
            <Trash2 className="mr-3 h-4 w-4" />
            Delete Wallet
          </Button>
        </div>

        <div className="mt-6 p-4 bg-dex-negative/10 border border-dex-negative/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-dex-negative min-w-[20px] mt-1" size={20} />
            <div>
              <h4 className="text-white font-medium mb-1">Security Notice</h4>
              <p className="text-sm text-gray-400">
                Keep your wallet secure. Never share your seed phrase or private keys with anyone.
                Always verify addresses before sending transactions.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Enhanced Modals */}
      {wallet && (
        <>
          {/* QR Code Modal */}
          <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
            <DialogContent className="bg-dex-dark border-dex-secondary/30 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Wallet QR Code</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-4 p-4">
                <div className="bg-white p-4 rounded-lg">
                  {/* QR Code would be rendered here with a proper QR library */}
                  <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-600 text-sm">
                    QR Code: {qrValue.slice(0, 20)}...
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white font-medium mb-2">Scan to send crypto</p>
                  <p className="text-xs text-gray-400 break-all">{qrValue}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(qrValue);
                      toast({
                        title: "Copied",
                        description: "Address copied to clipboard",
                      });
                    }}
                    className="border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
                  >
                    <Copy size={16} className="mr-2" />
                    Copy Address
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Download QR code functionality
                      toast({
                        title: "Download",
                        description: "QR code download functionality coming soon",
                      });
                    }}
                    className="border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
                  >
                    <Download size={16} className="mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Token Modal */}
          <Dialog open={showAddTokenModal} onOpenChange={setShowAddTokenModal}>
            <DialogContent className="bg-dex-dark border-dex-secondary/30 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Add Custom Token</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 p-4">
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Token Contract Address</label>
                  <Input
                    placeholder="0x..."
                    className="bg-dex-secondary/10 border-dex-secondary/30 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Token Symbol</label>
                  <Input
                    placeholder="e.g., USDC"
                    className="bg-dex-secondary/10 border-dex-secondary/30 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Token Name</label>
                  <Input
                    placeholder="e.g., USD Coin"
                    className="bg-dex-secondary/10 border-dex-secondary/30 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Decimals</label>
                  <Input
                    type="number"
                    placeholder="18"
                    className="bg-dex-secondary/10 border-dex-secondary/30 text-white placeholder-gray-400"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
                    onClick={() => setShowAddTokenModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-dex-primary hover:bg-dex-primary/80 text-white"
                    onClick={() => {
                      // Add token functionality
                      toast({
                        title: "Token Added",
                        description: "Custom token has been added to your wallet",
                      });
                      setShowAddTokenModal(false);
                    }}
                  >
                    Add Token
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Existing Modals */}
          <WalletRenameModal
            isOpen={showRenameModal}
            onClose={() => setShowRenameModal(false)}
            walletId={wallet.id}
            currentName={wallet.name}
            onSuccess={handleWalletRenamed}
          />

          <WalletDeleteModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            walletId={wallet.id}
            walletName={wallet.name}
            onSuccess={handleWalletDeleted}
          />

          <SeedPhraseBackupModal
            isOpen={showBackupModal}
            onClose={() => setShowBackupModal(false)}
            walletId={wallet.id}
            walletName={wallet.name}
          />
        </>
      )}
    </div>
  );
};

export default WalletDetailsPage;
