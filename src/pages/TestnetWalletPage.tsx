import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import { Beaker, RefreshCw, Plus, Send, Download, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { useTestnet } from '@/contexts/TestnetContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatAddress } from '@/services/ethersService';
import { isMetaMaskInstalled, connectMetaMask, switchToSepoliaNetwork } from '@/services/metamaskService';
import { isPhantomInstalled, connectPhantom } from '@/services/solanaService';
import { NETWORKS } from '@/services/ethersService';
import { SOLANA_NETWORKS } from '@/services/solanaService';
import EmptyStateCard from '@/components/EmptyStateCard';

const TestnetWalletPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeNetwork,
    setActiveNetwork,
    wallets,
    transactions,
    loading,
    error,
    createWallet,
    importWallet,
    sendTransaction,
    requestTestTokens,
    refreshWalletData,
  } = useTestnet();

  const [showCreateWalletDialog, setShowCreateWalletDialog] = useState(false);
  const [showImportWalletDialog, setShowImportWalletDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [importWalletName, setImportWalletName] = useState('');
  const [importPrivateKey, setImportPrivateKey] = useState('');
  const [sendToAddress, setSendToAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  // Format last updated time
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const handleRefresh = async () => {
    await refreshWalletData();
    setLastUpdated(new Date());
  };

  const handleCreateWallet = async () => {
    if (!newWalletName.trim()) {
      return;
    }

    await createWallet(newWalletName, activeNetwork);
    setNewWalletName('');
    setShowCreateWalletDialog(false);
  };

  const handleImportWallet = async () => {
    if (!importWalletName.trim() || !importPrivateKey.trim()) {
      return;
    }

    await importWallet(importPrivateKey, importWalletName, activeNetwork);
    setImportWalletName('');
    setImportPrivateKey('');
    setShowImportWalletDialog(false);
  };

  const handleSendTransaction = async () => {
    if (!sendToAddress.trim() || !sendAmount.trim() || !selectedWalletId) {
      return;
    }

    await sendTransaction(sendToAddress, sendAmount, selectedWalletId);
    setSendToAddress('');
    setSendAmount('');
    setSelectedWalletId(null);
    setShowSendDialog(false);
  };

  const handleConnectMetaMask = async () => {
    if (!isMetaMaskInstalled()) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      const address = await connectMetaMask();

      if (activeNetwork === 'sepolia') {
        await switchToSepoliaNetwork();
      }

      await createWallet('MetaMask Wallet', activeNetwork);
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
    }
  };

  const handleConnectPhantom = async () => {
    if (!isPhantomInstalled()) {
      window.open('https://phantom.app/download', '_blank');
      return;
    }

    try {
      const address = await connectPhantom();
      await createWallet('Phantom Wallet', 'solana-devnet');
    } catch (error) {
      console.error('Error connecting to Phantom:', error);
    }
  };

  const openFaucet = () => {
    if (activeNetwork === 'sepolia') {
      window.open(NETWORKS.sepolia.faucetUrl, '_blank');
    } else if (activeNetwork === 'solana-devnet') {
      window.open(SOLANA_NETWORKS['solana-devnet'].faucetUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw size={24} className="animate-spin text-dex-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-20">
        <Card className="p-4 mb-6 bg-dex-dark text-white border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Testnet Wallet</h2>
            <div className="flex gap-3">
              <Button
                variant="primary"
                className="h-11 min-w-[110px] px-4 py-3 rounded-lg flex items-center justify-center"
                onClick={() => refreshWalletData()}
              >
                <RefreshCw size={20} className="mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </Card>

        <EmptyStateCard
          title="Error Loading Testnet Data"
          description={error.message || "Failed to load testnet wallet data. Please try again."}
          icon={<AlertCircle size={40} className="text-dex-negative" />}
          actionLabel="Retry"
          onAction={() => refreshWalletData()}
        />
      </div>
    );
  }

  const filteredWallets = wallets.filter(wallet => wallet.network === activeNetwork);

  return (
    <div className="pb-20">
      <Card className="p-4 mb-6 bg-dex-dark text-white border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            <Beaker size={20} className="mr-2 text-dex-primary" />
            <h2 className="text-lg font-semibold">Testnet Wallet</h2>
          </div>
          {lastUpdated && (
            <div className="text-xs text-gray-400 flex items-center">
              <RefreshCw size={12} className="mr-1" />
              Updated {formattedLastUpdated}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-11 px-4 py-3 rounded-lg flex items-center justify-center"
              onClick={() => setShowInfoDialog(true)}
            >
              <Info size={20} className="mr-2 text-dex-primary" />
              <span className="text-white">About Testnets</span>
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              className="h-11 px-4 py-3 rounded-lg flex items-center justify-center"
              onClick={handleRefresh}
            >
              <RefreshCw size={20} className="mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="wallets" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-dex-dark/50 h-12 min-h-[48px]">
          <TabsTrigger
            value="wallets"
            className="text-white data-[state=active]:bg-dex-primary/50 py-2.5 px-2 h-12 min-h-[48px] justify-center items-center"
          >
            Wallets
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="text-white data-[state=active]:bg-dex-primary/50 py-2.5 px-2 h-12 min-h-[48px] justify-center items-center"
          >
            Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallets">
          <Card className="p-4 mb-6 bg-dex-dark text-white border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-medium">Network</h3>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <Button
                variant={activeNetwork === 'sepolia' ? 'primary' : 'outline'}
                className="h-11 px-4 py-3 rounded-lg flex items-center justify-center"
                onClick={() => setActiveNetwork('sepolia')}
              >
                Sepolia
              </Button>
              <Button
                variant={activeNetwork === 'ganache' ? 'primary' : 'outline'}
                className="h-11 px-4 py-3 rounded-lg flex items-center justify-center"
                onClick={() => setActiveNetwork('ganache')}
              >
                Ganache
              </Button>
              <Button
                variant={activeNetwork === 'solana-devnet' ? 'primary' : 'outline'}
                className="h-11 px-4 py-3 rounded-lg flex items-center justify-center"
                onClick={() => setActiveNetwork('solana-devnet')}
              >
                Solana
              </Button>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-medium">Connect Wallet</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {(activeNetwork === 'sepolia' || activeNetwork === 'ganache') && (
                <Button
                  variant="outline"
                  className="h-11 px-4 py-3 rounded-lg flex items-center justify-center"
                  onClick={handleConnectMetaMask}
                >
                  <img src="/crypto-icons/metamask.svg" alt="MetaMask" className="w-6 h-6 mr-2" />
                  <span className="text-white">MetaMask</span>
                </Button>
              )}

              {activeNetwork === 'solana-devnet' && (
                <Button
                  variant="outline"
                  className="h-11 px-4 py-3 rounded-lg flex items-center justify-center"
                  onClick={handleConnectPhantom}
                >
                  <img src="/crypto-icons/phantom.svg" alt="Phantom" className="w-6 h-6 mr-2" />
                  <span className="text-white">Phantom</span>
                </Button>
              )}

              <Button
                variant="outline"
                className="h-11 px-4 py-3 rounded-lg flex items-center justify-center"
                onClick={() => setShowCreateWalletDialog(true)}
              >
                <Plus size={20} className="mr-2 text-dex-primary" />
                <span className="text-white">Create New</span>
              </Button>

              <Button
                variant="outline"
                className="h-11 px-4 py-3 rounded-lg flex items-center justify-center"
                onClick={() => setShowImportWalletDialog(true)}
              >
                <Download size={20} className="mr-2 text-dex-primary" />
                <span className="text-white">Import</span>
              </Button>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-medium">Your Wallets</h3>
              <Button
                variant="outline"
                className="h-11 px-3 py-2 rounded-lg flex items-center justify-center text-sm"
                onClick={openFaucet}
              >
                <ExternalLink size={16} className="mr-2 text-dex-primary" />
                <span className="text-white">Faucet</span>
              </Button>
            </div>

            {filteredWallets.length > 0 ? (
              <div className="space-y-4">
                {filteredWallets.map(wallet => (
                  <Card key={wallet.id} className="p-4 bg-dex-secondary/10 border-dex-secondary/20 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{wallet.name}</h4>
                      <span className="text-xs bg-dex-secondary/20 px-2 py-1 rounded-full">
                        {wallet.network === 'sepolia' ? 'Sepolia' :
                         wallet.network === 'ganache' ? 'Ganache' : 'Solana Devnet'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mb-2">
                      {formatAddress(wallet.address)}
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-lg font-semibold">
                          {parseFloat(wallet.balance).toFixed(4)} {wallet.network === 'solana-devnet' ? 'SOL' : 'ETH'}
                        </div>
                        <div className="text-xs text-gray-400">
                          Testnet tokens
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-11 px-3 py-2 rounded-lg flex items-center justify-center"
                          onClick={() => {
                            setSelectedWalletId(wallet.id);
                            setShowSendDialog(true);
                          }}
                        >
                          <Send size={16} className="mr-2 text-dex-primary" />
                          <span className="text-white">Send</span>
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="h-11 px-3 py-2 rounded-lg flex items-center justify-center"
                          onClick={() => requestTestTokens(wallet.id)}
                        >
                          <Beaker size={16} className="mr-2" />
                          Get Test Tokens
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyStateCard
                title="No Testnet Wallets"
                description="Create or import a testnet wallet to get started with testing."
                icon={<Beaker size={40} />}
                actionLabel="Create Wallet"
                onAction={() => setShowCreateWalletDialog(true)}
              />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="p-4 mb-6 bg-dex-dark text-white border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-medium">Transaction History</h3>
            </div>

            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map(tx => (
                  <Card key={tx.id} className="p-4 bg-dex-secondary/10 border-dex-secondary/20 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          tx.type === 'receive' ? 'bg-green-500/20' : 'bg-dex-primary/20'
                        }`}>
                          {tx.type === 'receive' ? (
                            <Download size={16} className="text-green-500" />
                          ) : (
                            <Send size={16} className="text-dex-primary" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {tx.type === 'receive' ? 'Received' : 'Sent'} {tx.tokenSymbol}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(tx.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${
                          tx.type === 'receive' ? 'text-green-500' : 'text-dex-primary'
                        }`}>
                          {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.tokenSymbol}
                        </div>
                        <div className="text-xs text-gray-400">
                          {tx.status === 'pending' ? 'Pending' :
                           tx.status === 'confirmed' ? 'Confirmed' : 'Failed'}
                        </div>
                      </div>
                    </div>
                    {tx.hash && (
                      <div className="text-xs text-gray-400 mt-2">
                        Tx: {tx.hash.substring(0, 10)}...{tx.hash.substring(tx.hash.length - 6)}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyStateCard
                title="No Transactions"
                description="Your transaction history will appear here."
                icon={<AlertCircle size={40} />}
              />
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Wallet Dialog */}
      <Dialog open={showCreateWalletDialog} onOpenChange={setShowCreateWalletDialog}>
        <DialogContent className="bg-dex-dark text-white border-dex-secondary/30">
          <DialogHeader>
            <DialogTitle>Create New Testnet Wallet</DialogTitle>
            <DialogDescription>
              Create a new wallet for testing on the {activeNetwork} network.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Wallet Name</Label>
              <Input
                id="name"
                placeholder="My Testnet Wallet"
                value={newWalletName}
                onChange={(e) => setNewWalletName(e.target.value)}
                className="bg-dex-secondary/10 border-dex-secondary/30 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateWalletDialog(false)}>
              <span className="text-white">Cancel</span>
            </Button>
            <Button variant="primary" onClick={handleCreateWallet}>
              Create Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Wallet Dialog */}
      <Dialog open={showImportWalletDialog} onOpenChange={setShowImportWalletDialog}>
        <DialogContent className="bg-dex-dark text-white border-dex-secondary/30">
          <DialogHeader>
            <DialogTitle>Import Testnet Wallet</DialogTitle>
            <DialogDescription>
              Import an existing wallet for testing on the {activeNetwork} network.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="import-name">Wallet Name</Label>
              <Input
                id="import-name"
                placeholder="My Imported Wallet"
                value={importWalletName}
                onChange={(e) => setImportWalletName(e.target.value)}
                className="bg-dex-secondary/10 border-dex-secondary/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="private-key">Private Key</Label>
              <Input
                id="private-key"
                placeholder="Enter private key"
                value={importPrivateKey}
                onChange={(e) => setImportPrivateKey(e.target.value)}
                className="bg-dex-secondary/10 border-dex-secondary/30 text-white"
                type="password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportWalletDialog(false)}>
              <span className="text-white">Cancel</span>
            </Button>
            <Button variant="primary" onClick={handleImportWallet}>
              Import Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="bg-dex-dark text-white border-dex-secondary/30">
          <DialogHeader>
            <DialogTitle>Send Testnet Tokens</DialogTitle>
            <DialogDescription>
              Send test tokens to another address on the {activeNetwork} network.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="to-address">Recipient Address</Label>
              <Input
                id="to-address"
                placeholder="Enter recipient address"
                value={sendToAddress}
                onChange={(e) => setSendToAddress(e.target.value)}
                className="bg-dex-secondary/10 border-dex-secondary/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                placeholder="0.01"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                className="bg-dex-secondary/10 border-dex-secondary/30 text-white"
                type="number"
                step="0.001"
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              <span className="text-white">Cancel</span>
            </Button>
            <Button variant="primary" onClick={handleSendTransaction}>
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="bg-dex-dark text-white border-dex-secondary/30">
          <DialogHeader>
            <DialogTitle>About Testnets</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">
              Testnets are separate blockchain networks designed for testing applications without using real cryptocurrency.
            </p>
            <h4 className="font-medium">Available Testnets:</h4>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>Sepolia:</strong> Ethereum testnet that uses Proof of Work consensus.
              </li>
              <li>
                <strong>Ganache:</strong> Local Ethereum blockchain for development.
              </li>
              <li>
                <strong>Solana Devnet:</strong> Solana's development network for testing.
              </li>
            </ul>
            <p className="text-sm">
              Test tokens have no real value and can be obtained for free from faucets.
            </p>
          </div>
          <DialogFooter>
            <Button variant="primary" onClick={() => setShowInfoDialog(false)} className="h-11 px-4 py-3">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestnetWalletPage;
