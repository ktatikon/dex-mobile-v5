import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  importWalletFromSeedPhrase,
  importWalletFromPrivateKey,
  validateImportedWallet,
  validateMnemonic
} from '@/services/walletGenerationService';
import {
  ArrowLeft,
  Download,
  Key,
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

const WalletImportPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [importType, setImportType] = useState<'seed' | 'private'>('seed');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  // Seed phrase import state
  const [seedPhrase, setSeedPhrase] = useState('');
  const [seedWalletName, setSeedWalletName] = useState('');
  const [seedPassword, setSeedPassword] = useState('');
  const [seedConfirmPassword, setSeedConfirmPassword] = useState('');

  // Private key import state
  const [privateKey, setPrivateKey] = useState('');
  const [privateKeyNetwork, setPrivateKeyNetwork] = useState('ethereum');
  const [privateKeyWalletName, setPrivateKeyWalletName] = useState('');
  const [privateKeyPassword, setPrivateKeyPassword] = useState('');
  const [privateKeyConfirmPassword, setPrivateKeyConfirmPassword] = useState('');

  // Validation state
  const [validationResult, setValidationResult] = useState<any>(null);

  const supportedNetworks = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
    { id: 'solana', name: 'Solana', symbol: 'SOL' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
    { id: 'binance', name: 'Binance Smart Chain', symbol: 'BNB' }
  ];

  const validateSeedPhraseInput = () => {
    if (!seedPhrase.trim()) {
      toast({
        title: "Error",
        description: "Please enter a seed phrase",
        variant: "destructive",
      });
      return false;
    }

    if (!validateMnemonic(seedPhrase.trim())) {
      toast({
        title: "Invalid Seed Phrase",
        description: "Please enter a valid 12 or 24-word seed phrase",
        variant: "destructive",
      });
      return false;
    }

    if (!seedWalletName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a wallet name",
        variant: "destructive",
      });
      return false;
    }

    if (!seedPassword) {
      toast({
        title: "Error",
        description: "Please enter a password",
        variant: "destructive",
      });
      return false;
    }

    if (seedPassword !== seedConfirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return false;
    }

    if (seedPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const validatePrivateKeyInput = () => {
    if (!privateKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a private key",
        variant: "destructive",
      });
      return false;
    }

    if (!privateKeyWalletName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a wallet name",
        variant: "destructive",
      });
      return false;
    }

    if (!privateKeyPassword) {
      toast({
        title: "Error",
        description: "Please enter a password",
        variant: "destructive",
      });
      return false;
    }

    if (privateKeyPassword !== privateKeyConfirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return false;
    }

    if (privateKeyPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSeedPhraseImport = async () => {
    if (!user || !validateSeedPhraseInput()) return;

    try {
      setLoading(true);

      const wallet = await importWalletFromSeedPhrase(
        user.id,
        seedWalletName.trim(),
        seedPhrase.trim(),
        seedPassword
      );

      // Validate the imported wallet
      setValidating(true);
      const validation = await validateImportedWallet(wallet.id, user.id);
      setValidationResult(validation);
      setValidating(false);

      toast({
        title: "Wallet Imported",
        description: `${seedWalletName} has been imported successfully`,
      });

      // Navigate to wallet details
      setTimeout(() => {
        navigate(`/wallet-details/${wallet.id}`);
      }, 2000);

    } catch (error) {
      console.error('Error importing wallet:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import wallet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setValidating(false);
    }
  };

  const handlePrivateKeyImport = async () => {
    if (!user || !validatePrivateKeyInput()) return;

    try {
      setLoading(true);

      const wallet = await importWalletFromPrivateKey(
        user.id,
        privateKeyWalletName.trim(),
        privateKey.trim(),
        privateKeyPassword,
        privateKeyNetwork
      );

      // Validate the imported wallet
      setValidating(true);
      const validation = await validateImportedWallet(wallet.id, user.id);
      setValidationResult(validation);
      setValidating(false);

      toast({
        title: "Wallet Imported",
        description: `${privateKeyWalletName} has been imported successfully`,
      });

      // Navigate to wallet details
      setTimeout(() => {
        navigate(`/wallet-details/${wallet.id}`);
      }, 2000);

    } catch (error) {
      console.error('Error importing wallet:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import wallet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setValidating(false);
    }
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/wallet-dashboard')}
          className="border-dex-secondary/30 text-white"
        >
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-2xl font-bold text-white">Import Wallet</h1>
      </div>

      {/* Security Warning */}
      <Alert className="mb-6 border-yellow-500/30 bg-yellow-500/10">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-yellow-200">
          <strong>Security Warning:</strong> Never share your seed phrase or private key with anyone.
          Make sure you're in a secure environment before entering sensitive information.
        </AlertDescription>
      </Alert>

      {/* Import Options */}
      <Tabs value={importType} onValueChange={(value) => setImportType(value as 'seed' | 'private')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-dex-dark/50 p-1.5 rounded-lg border border-dex-secondary/20">
          <TabsTrigger value="seed" className="text-white data-[state=active]:bg-dex-primary">
            <Download size={16} className="mr-2" />
            Seed Phrase
          </TabsTrigger>
          <TabsTrigger value="private" className="text-white data-[state=active]:bg-dex-primary">
            <Key size={16} className="mr-2" />
            Private Key
          </TabsTrigger>
        </TabsList>

        <TabsContent value="seed">
          <Card className="p-6 bg-dex-dark border-dex-secondary/30">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-white flex items-center gap-2">
                <Download size={20} />
                Import from Seed Phrase
              </CardTitle>
              <p className="text-gray-400 text-sm">
                Import an existing wallet using a 12 or 24-word seed phrase
              </p>
            </CardHeader>

            <CardContent className="px-0 space-y-4">
              <div>
                <Label htmlFor="seedPhrase" className="text-white">Seed Phrase</Label>
                <Textarea
                  id="seedPhrase"
                  placeholder="Enter your 12 or 24-word seed phrase separated by spaces"
                  value={seedPhrase}
                  onChange={(e) => setSeedPhrase(e.target.value)}
                  className="bg-dex-secondary/20 border-dex-secondary/30 text-white min-h-[100px]"
                  type={showSensitiveData ? 'text' : 'password'}
                />
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSensitiveData(!showSensitiveData)}
                    className="text-gray-400 hover:text-white"
                  >
                    {showSensitiveData ? <EyeOff size={16} /> : <Eye size={16} />}
                    {showSensitiveData ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="seedWalletName" className="text-white">Wallet Name</Label>
                <Input
                  id="seedWalletName"
                  placeholder="Enter a name for your wallet"
                  value={seedWalletName}
                  onChange={(e) => setSeedWalletName(e.target.value)}
                  className="bg-dex-secondary/20 border-dex-secondary/30 text-white"
                />
              </div>

              <div>
                <Label htmlFor="seedPassword" className="text-white">Password</Label>
                <Input
                  id="seedPassword"
                  type="password"
                  placeholder="Enter a strong password"
                  value={seedPassword}
                  onChange={(e) => setSeedPassword(e.target.value)}
                  className="bg-dex-secondary/20 border-dex-secondary/30 text-white"
                />
              </div>

              <div>
                <Label htmlFor="seedConfirmPassword" className="text-white">Confirm Password</Label>
                <Input
                  id="seedConfirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={seedConfirmPassword}
                  onChange={(e) => setSeedConfirmPassword(e.target.value)}
                  className="bg-dex-secondary/20 border-dex-secondary/30 text-white"
                />
              </div>

              <Button
                onClick={handleSeedPhraseImport}
                disabled={loading || validating}
                className="w-full bg-dex-primary hover:bg-dex-primary/80 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Importing Wallet...
                  </>
                ) : validating ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Download size={16} className="mr-2" />
                    Import Wallet
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="private">
          <Card className="p-6 bg-dex-dark border-dex-secondary/30">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-white flex items-center gap-2">
                <Key size={20} />
                Import from Private Key
              </CardTitle>
              <p className="text-gray-400 text-sm">
                Import a wallet using a private key for a specific network
              </p>
            </CardHeader>

            <CardContent className="px-0 space-y-4">
              <div>
                <Label htmlFor="privateKeyNetwork" className="text-white">Network</Label>
                <Select value={privateKeyNetwork} onValueChange={setPrivateKeyNetwork}>
                  <SelectTrigger className="bg-dex-secondary/20 border-dex-secondary/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-dex-dark border-dex-secondary/30">
                    {supportedNetworks.map((network) => (
                      <SelectItem key={network.id} value={network.id} className="text-white">
                        {network.name} ({network.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="privateKey" className="text-white">Private Key</Label>
                <Input
                  id="privateKey"
                  placeholder="Enter your private key (64 characters)"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="bg-dex-secondary/20 border-dex-secondary/30 text-white"
                  type={showSensitiveData ? 'text' : 'password'}
                />
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSensitiveData(!showSensitiveData)}
                    className="text-gray-400 hover:text-white"
                  >
                    {showSensitiveData ? <EyeOff size={16} /> : <Eye size={16} />}
                    {showSensitiveData ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="privateKeyWalletName" className="text-white">Wallet Name</Label>
                <Input
                  id="privateKeyWalletName"
                  placeholder="Enter a name for your wallet"
                  value={privateKeyWalletName}
                  onChange={(e) => setPrivateKeyWalletName(e.target.value)}
                  className="bg-dex-secondary/20 border-dex-secondary/30 text-white"
                />
              </div>

              <div>
                <Label htmlFor="privateKeyPassword" className="text-white">Password</Label>
                <Input
                  id="privateKeyPassword"
                  type="password"
                  placeholder="Enter a strong password"
                  value={privateKeyPassword}
                  onChange={(e) => setPrivateKeyPassword(e.target.value)}
                  className="bg-dex-secondary/20 border-dex-secondary/30 text-white"
                />
              </div>

              <div>
                <Label htmlFor="privateKeyConfirmPassword" className="text-white">Confirm Password</Label>
                <Input
                  id="privateKeyConfirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={privateKeyConfirmPassword}
                  onChange={(e) => setPrivateKeyConfirmPassword(e.target.value)}
                  className="bg-dex-secondary/20 border-dex-secondary/30 text-white"
                />
              </div>

              <Button
                onClick={handlePrivateKeyImport}
                disabled={loading || validating}
                className="w-full bg-dex-primary hover:bg-dex-primary/80 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Importing Wallet...
                  </>
                ) : validating ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Key size={16} className="mr-2" />
                    Import Wallet
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Validation Result */}
      {validationResult && (
        <Card className="mt-6 p-6 bg-dex-dark border-dex-secondary/30">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={20} className="text-green-500" />
            <h3 className="text-lg font-medium text-white">Import Successful</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Value:</span>
              <span className="text-white font-medium">${validationResult.totalValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Networks:</span>
              <span className="text-white font-medium">{validationResult.balances.length}</span>
            </div>
          </div>

          <p className="text-sm text-gray-400 mt-4">
            Your wallet has been imported and validated successfully. You will be redirected to the wallet details page.
          </p>
        </Card>
      )}
    </div>
  );
};

export default WalletImportPage;
