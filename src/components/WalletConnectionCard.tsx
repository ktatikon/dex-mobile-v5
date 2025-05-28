/**
 * Phase 2: Wallet Connection Component
 * Allows users to connect real cryptocurrency wallets
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Copy
} from 'lucide-react';
import { useRealWalletBalances } from '@/hooks/useRealWalletBalances';
import { PHASE2_CONFIG } from '@/services/fallbackDataService';

interface WalletConnectionCardProps {
  className?: string;
}

const WalletConnectionCard: React.FC<WalletConnectionCardProps> = ({ className }) => {
  const {
    connectedWallets,
    loading,
    error,
    totalPortfolioValue,
    connectWallet,
    disconnectWallet,
    refreshBalances,
    isWalletConnected,
    balanceStatus
  } = useRealWalletBalances({
    autoRefresh: true,
    refreshInterval: 2 * 60 * 1000, // 2 minutes
    enableMultiWallet: true
  });

  const [showConnectForm, setShowConnectForm] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [connecting, setConnecting] = useState(false);

  const handleConnectWallet = async () => {
    if (!newWalletAddress.trim()) return;

    setConnecting(true);
    try {
      await connectWallet(newWalletAddress.trim(), selectedNetwork, 'manual');
      setNewWalletAddress('');
      setShowConnectForm(false);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectWallet = (address: string, network: string) => {
    disconnectWallet(address, network);
  };

  const handleRefreshBalances = async () => {
    await refreshBalances();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkColor = (network: string) => {
    switch (network) {
      case 'ethereum': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'bitcoin': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'polygon': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'bsc': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (!PHASE2_CONFIG.enableRealWallets) {
    return (
      <Card className={`bg-dex-dark/80 border-dex-primary/30 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-dex-text-secondary">
            <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Real wallet connectivity is disabled</p>
            <p className="text-sm mt-2">Using demo mode with simulated balances</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-dex-dark/80 border-dex-primary/30 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connected Wallets
          </CardTitle>
          <div className="flex items-center gap-2">
            {balanceStatus.lastUpdated && (
              <span className="text-xs text-dex-text-secondary">
                Updated {balanceStatus.lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshBalances}
              disabled={balanceStatus.isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`w-4 h-4 ${balanceStatus.isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Portfolio Summary */}
        {isWalletConnected && (
          <div className="p-4 bg-dex-secondary/20 rounded-lg">
            <div className="text-sm text-dex-text-secondary mb-1">Total Portfolio Value</div>
            <div className="text-2xl font-bold text-white">
              ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error.message}</span>
            </div>
          </div>
        )}

        {/* Failed Wallets Warning */}
        {balanceStatus.failedWallets.length > 0 && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                Failed to refresh {balanceStatus.failedWallets.length} wallet(s)
              </span>
            </div>
          </div>
        )}

        {/* Connected Wallets List */}
        {connectedWallets.length > 0 ? (
          <div className="space-y-3">
            {connectedWallets.map((wallet, index) => (
              <div key={`${wallet.address}_${wallet.network}`} className="p-3 bg-dex-secondary/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getNetworkColor(wallet.network)}>
                      {wallet.network.toUpperCase()}
                    </Badge>
                    <span className="text-white font-mono text-sm">
                      {formatAddress(wallet.address)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(wallet.address)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://etherscan.io/address/${wallet.address}`, '_blank')}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnectWallet(wallet.address, wallet.network)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-dex-text-secondary">
                  {wallet.balances.length} tokens • {wallet.provider}
                  {wallet.isConnected && (
                    <CheckCircle className="w-3 h-3 inline ml-2 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-dex-text-secondary">
            <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No wallets connected</p>
            <p className="text-sm mt-2">Connect your first wallet to see real balances</p>
          </div>
        )}

        {/* Connect New Wallet */}
        {!showConnectForm ? (
          <Button
            onClick={() => setShowConnectForm(true)}
            disabled={connectedWallets.length >= PHASE2_CONFIG.maxWalletConnections}
            className="w-full bg-dex-primary text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        ) : (
          <div className="space-y-4 p-4 bg-dex-secondary/10 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="wallet-address" className="text-white">Wallet Address</Label>
              <Input
                id="wallet-address"
                type="text"
                placeholder="Enter wallet address (0x... or bc1...)"
                value={newWalletAddress}
                onChange={(e) => setNewWalletAddress(e.target.value)}
                className="bg-dex-dark/70 border-dex-primary/30 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="network" className="text-white">Network</Label>
              <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                <SelectTrigger className="bg-dex-dark/70 border-dex-primary/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dex-dark border-dex-primary/30">
                  {PHASE2_CONFIG.supportedNetworks.map(network => (
                    <SelectItem key={network} value={network} className="text-white">
                      {network.charAt(0).toUpperCase() + network.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleConnectWallet}
                disabled={connecting || !newWalletAddress.trim()}
                className="flex-1 bg-dex-primary text-white"
              >
                {connecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowConnectForm(false);
                  setNewWalletAddress('');
                }}
                className="border-dex-primary/30 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-4">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-dex-primary" />
            <p className="text-sm text-dex-text-secondary mt-2">Loading wallet data...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletConnectionCard;
