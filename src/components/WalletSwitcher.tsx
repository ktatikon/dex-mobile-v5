import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  getAllUserWalletsWithPreferences,
  updateDefaultWallet,
  getWalletCategoryInfo
} from '@/services/walletPreferencesService';
import {
  Wallet,
  ChevronDown,
  Star,
  User,
  Briefcase,
  TrendingUp,
  BarChart3,
  PiggyBank,
  Folder,
  Shield,
  Flame
} from 'lucide-react';

interface WalletSwitcherProps {
  onWalletChange?: (walletId: string, walletType: string) => void;
  className?: string;
  compact?: boolean;
}

const categoryIcons = {
  personal: User,
  business: Briefcase,
  defi: TrendingUp,
  trading: BarChart3,
  savings: PiggyBank,
  other: Folder
};

const typeIcons = {
  generated: Wallet,
  hot: Flame,
  hardware: Shield
};

const WalletSwitcher: React.FC<WalletSwitcherProps> = ({
  onWalletChange,
  className = '',
  compact = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWallets();
    }
  }, [user]);

  const fetchWallets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const walletsWithPreferences = await getAllUserWalletsWithPreferences(user.id);
      setWallets(walletsWithPreferences);

      // Set default wallet
      const defaultWallet = walletsWithPreferences.find(w => w.isDefault);
      if (defaultWallet) {
        setSelectedWallet(defaultWallet.id);
      } else if (walletsWithPreferences.length > 0) {
        setSelectedWallet(walletsWithPreferences[0].id);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast({
        title: "Error",
        description: "Failed to load wallets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWalletChange = async (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet || !user) return;

    try {
      // Update default wallet preference
      await updateDefaultWallet(user.id, walletId, wallet.type);
      
      setSelectedWallet(walletId);
      
      // Notify parent component
      if (onWalletChange) {
        onWalletChange(walletId, wallet.type);
      }

      toast({
        title: "Wallet Switched",
        description: `Switched to ${wallet.name || wallet.wallet_name}`,
      });
    } catch (error) {
      console.error('Error switching wallet:', error);
      toast({
        title: "Error",
        description: "Failed to switch wallet",
        variant: "destructive",
      });
    }
  };

  const getWalletDisplayName = (wallet: any) => {
    return wallet.name || wallet.wallet_name || 'Unnamed Wallet';
  };

  const getWalletAddress = (wallet: any) => {
    if (wallet.type === 'generated' && wallet.addresses) {
      // Get first address from generated wallet
      const firstAddress = Object.values(wallet.addresses)[0] as string;
      return firstAddress ? `${firstAddress.slice(0, 6)}...${firstAddress.slice(-4)}` : '';
    }
    return wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : '';
  };

  const selectedWalletData = wallets.find(w => w.id === selectedWallet);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-dex-secondary/20 rounded-lg"></div>
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <div className={`text-center text-gray-400 ${className}`}>
        <Wallet size={20} className="mx-auto mb-2" />
        <p className="text-sm">No wallets found</p>
      </div>
    );
  }

  if (compact) {
    return (
      <Select value={selectedWallet} onValueChange={handleWalletChange}>
        <SelectTrigger className={`bg-dex-secondary/20 border-dex-secondary/30 text-white ${className}`}>
          <div className="flex items-center gap-2">
            {selectedWalletData && (
              <>
                {React.createElement(typeIcons[selectedWalletData.type as keyof typeof typeIcons], { size: 16 })}
                <span className="truncate">{getWalletDisplayName(selectedWalletData)}</span>
              </>
            )}
          </div>
        </SelectTrigger>
        <SelectContent className="bg-dex-dark border-dex-secondary/30">
          {wallets.map((wallet) => {
            const CategoryIcon = categoryIcons[wallet.category as keyof typeof categoryIcons] || Folder;
            const TypeIcon = typeIcons[wallet.type as keyof typeof typeIcons] || Wallet;
            
            return (
              <SelectItem key={wallet.id} value={wallet.id} className="text-white hover:bg-dex-secondary/20">
                <div className="flex items-center gap-2 w-full">
                  <TypeIcon size={16} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{getWalletDisplayName(wallet)}</span>
                      {wallet.isDefault && <Star size={12} className="text-dex-primary" />}
                    </div>
                    <div className="text-xs text-gray-400">{getWalletAddress(wallet)}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: wallet.categoryInfo.color, color: wallet.categoryInfo.color }}
                  >
                    {wallet.categoryInfo.name}
                  </Badge>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Active Wallet</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchWallets}
          className="border-dex-secondary/30 text-white"
        >
          Refresh
        </Button>
      </div>

      <Select value={selectedWallet} onValueChange={handleWalletChange}>
        <SelectTrigger className="bg-dex-secondary/20 border-dex-secondary/30 text-white h-16">
          <div className="flex items-center gap-3 w-full">
            {selectedWalletData && (
              <>
                <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                  {React.createElement(typeIcons[selectedWalletData.type as keyof typeof typeIcons], { 
                    size: 20, 
                    className: "text-dex-primary" 
                  })}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{getWalletDisplayName(selectedWalletData)}</span>
                    {selectedWalletData.isDefault && <Star size={14} className="text-dex-primary" />}
                  </div>
                  <div className="text-sm text-gray-400">{getWalletAddress(selectedWalletData)}</div>
                </div>
                <Badge
                  variant="outline"
                  style={{ borderColor: selectedWalletData.categoryInfo.color, color: selectedWalletData.categoryInfo.color }}
                >
                  {selectedWalletData.categoryInfo.name}
                </Badge>
                <ChevronDown size={16} className="text-gray-400" />
              </>
            )}
          </div>
        </SelectTrigger>
        <SelectContent className="bg-dex-dark border-dex-secondary/30">
          {wallets.map((wallet) => {
            const CategoryIcon = categoryIcons[wallet.category as keyof typeof categoryIcons] || Folder;
            const TypeIcon = typeIcons[wallet.type as keyof typeof typeIcons] || Wallet;
            
            return (
              <SelectItem key={wallet.id} value={wallet.id} className="text-white hover:bg-dex-secondary/20 h-16">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                    <TypeIcon size={20} className="text-dex-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{getWalletDisplayName(wallet)}</span>
                      {wallet.isDefault && <Star size={14} className="text-dex-primary" />}
                    </div>
                    <div className="text-sm text-gray-400">{getWalletAddress(wallet)}</div>
                  </div>
                  <Badge
                    variant="outline"
                    style={{ borderColor: wallet.categoryInfo.color, color: wallet.categoryInfo.color }}
                  >
                    {wallet.categoryInfo.name}
                  </Badge>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default WalletSwitcher;
