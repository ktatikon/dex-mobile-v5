import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  Shield,
  Wallet,
  Download,
  Trash2,
  AlertTriangle,
  Edit3,
  RefreshCw,
  Send,
  QrCode
} from 'lucide-react';
import { getGeneratedWallets, getGeneratedWalletBalances } from '@/services/walletGenerationService';
import WalletRenameModal from '@/components/WalletRenameModal';
import WalletDeleteModal from '@/components/WalletDeleteModal';
import SeedPhraseBackupModal from '@/components/SeedPhraseBackupModal';

interface GeneratedWallet {
  id: string;
  name: string;
  type: string;
  addresses: { [key: string]: string };
  createdAt: string;
}

const WalletDetailsPage: React.FC = () => {
  const { walletId } = useParams<{ walletId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [wallet, setWallet] = useState<GeneratedWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddresses, setShowAddresses] = useState(false);
  const [balances, setBalances] = useState<any[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);

  useEffect(() => {
    const fetchWalletDetails = async () => {
      if (!user || !walletId) {
        setLoading(false);
        setBalancesLoading(false);
        return;
      }

      try {
        // Fetch wallet details
        const wallets = await getGeneratedWallets(user.id);
        const foundWallet = wallets.find(w => w.id === walletId);

        if (foundWallet) {
          setWallet(foundWallet);

          // Fetch wallet balances
          setBalancesLoading(true);
          const walletBalances = await getGeneratedWalletBalances(user.id, walletId);
          setBalances(walletBalances);
        } else {
          toast({
            title: "Wallet Not Found",
            description: "The requested wallet could not be found.",
            variant: "destructive",
          });
          navigate('/wallet-dashboard');
        }
      } catch (error) {
        console.error('Error fetching wallet details:', error);
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
    navigate('/wallet');
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

  const formatPrice = (price: number): string => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    return `$${price.toFixed(2)}`;
  };

  const getTotalValue = (): number => {
    return balances.reduce((total, balance) => {
      const balanceNum = parseFloat(balance.balance) / Math.pow(10, balance.tokens?.decimals || 18);
      const value = balanceNum * (balance.tokens?.price || 0);
      return total + value;
    }, 0);
  };

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
        <h1 className="text-2xl font-bold text-white">Wallet Details</h1>
      </div>

      {/* Wallet Info Card */}
      <Card className="p-6 mb-6 bg-dex-dark text-white border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-dex-primary/20 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-dex-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{wallet.name}</h2>
              <p className="text-gray-400">
                Created on {new Date(wallet.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRenameWallet}
            className="border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
          >
            <Edit3 size={16} />
          </Button>
        </div>

        {/* Portfolio Value */}
        <div className="mb-4 p-4 bg-dex-secondary/10 border border-dex-secondary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Portfolio Value</p>
              <p className="text-2xl font-bold text-white">
                ${getTotalValue().toFixed(2)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshBalances}
              disabled={balancesLoading}
              className="border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
            >
              <RefreshCw size={16} className={balancesLoading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        <Separator className="bg-dex-secondary/20 my-4" />

        {/* Balances Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-4">Token Balances</h3>

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
            <div className="space-y-3">
              {balances.map((balance) => {
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
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400">
              <Wallet size={32} className="mx-auto mb-2 opacity-50" />
              <p>No token balances found</p>
              <p className="text-sm">Balances will appear here once you receive tokens</p>
            </div>
          )}
        </div>

        <Separator className="bg-dex-secondary/20 my-4" />

        {/* Addresses Section */}
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
            {Object.entries(wallet.addresses).map(([currency, address]) => (
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                      onClick={() => handleCopyAddress(currency, address)}
                    >
                      <Copy size={16} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
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

      {/* Modals */}
      {wallet && (
        <>
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
