import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { exportWalletBackup, verifyWalletPassword } from '@/services/walletGenerationService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Copy, 
  Download, 
  AlertTriangle,
  Lock,
  CheckCircle
} from 'lucide-react';

interface SeedPhraseBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletId: string;
  walletName: string;
}

const SeedPhraseBackupModal: React.FC<SeedPhraseBackupModalProps> = ({
  isOpen,
  onClose,
  walletId,
  walletName
}) => {
  const [step, setStep] = useState<'password' | 'backup'>('password');
  const [password, setPassword] = useState('');
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [backupData, setBackupData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasWrittenDown, setHasWrittenDown] = useState(false);
  const [understands, setUnderstands] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !password.trim()) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Verify password first
      const isValid = await verifyWalletPassword(walletId, password, user.id);
      
      if (!isValid) {
        setError('Incorrect password. Please try again.');
        setIsLoading(false);
        return;
      }

      // Get backup data
      const backup = await exportWalletBackup(walletId, password, user.id);
      
      if (!backup) {
        setError('Failed to retrieve wallet backup. Please try again.');
        setIsLoading(false);
        return;
      }

      setBackupData(backup);
      setSeedPhrase(backup.seedPhrase);
      setStep('backup');
    } catch (error) {
      console.error('Error verifying password:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySeedPhrase = () => {
    if (seedPhrase) {
      navigator.clipboard.writeText(seedPhrase);
      toast({
        title: "Seed Phrase Copied",
        description: "Your seed phrase has been copied to clipboard. Store it securely!",
      });
    }
  };

  const handleDownloadBackup = () => {
    if (!backupData) return;

    const backupContent = {
      walletName: backupData.name,
      seedPhrase: backupData.seedPhrase,
      addresses: backupData.addresses,
      createdAt: backupData.createdAt,
      backupDate: new Date().toISOString(),
      warning: "KEEP THIS FILE SECURE! Anyone with access to this seed phrase can control your wallet."
    };

    const blob = new Blob([JSON.stringify(backupContent, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${backupData.name}_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Backup Downloaded",
      description: "Wallet backup file has been downloaded. Store it in a secure location!",
    });
  };

  const handleClose = () => {
    if (!isLoading) {
      setStep('password');
      setPassword('');
      setShowSeedPhrase(false);
      setSeedPhrase('');
      setBackupData(null);
      setError('');
      setHasWrittenDown(false);
      setUnderstands(false);
      onClose();
    }
  };

  const seedWords = seedPhrase ? seedPhrase.split(' ') : [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-dex-dark border-dex-secondary/30 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Shield size={20} className="text-dex-primary" />
            Backup Wallet - {walletName}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {step === 'password' 
              ? 'Enter your password to access your wallet backup'
              : 'Your seed phrase is the master key to your wallet. Keep it safe!'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Wallet Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter your wallet password"
                className="bg-dex-secondary/20 border-dex-secondary/30 text-white placeholder:text-gray-500 focus:border-dex-primary"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-dex-negative/10 border border-dex-negative/20 rounded-lg">
                <AlertTriangle size={16} className="text-dex-negative" />
                <span className="text-sm text-dex-negative">{error}</span>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !password.trim()}
                className="bg-dex-primary hover:bg-dex-primary/80 text-white"
              >
                {isLoading ? 'Verifying...' : 'Access Backup'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'backup' && (
          <div className="space-y-6">
            {/* Security Warning */}
            <div className="p-4 bg-dex-negative/10 border border-dex-negative/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-dex-negative min-w-[20px] mt-1" size={20} />
                <div>
                  <h4 className="text-white font-medium mb-2">🔒 Security Warning</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Never share your seed phrase with anyone</li>
                    <li>• Store it offline in a secure location</li>
                    <li>• Anyone with this phrase can access your wallet</li>
                    <li>• Write it down on paper and store multiple copies</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Seed Phrase Display */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white font-medium">Your Seed Phrase</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                  className="border-dex-secondary/30 text-white"
                >
                  {showSeedPhrase ? <EyeOff size={16} /> : <Eye size={16} />}
                  <span className="ml-2">{showSeedPhrase ? 'Hide' : 'Show'}</span>
                </Button>
              </div>

              <div className={`p-4 bg-dex-secondary/10 border border-dex-secondary/20 rounded-lg ${
                !showSeedPhrase ? 'filter blur-sm' : ''
              }`}>
                <div className="grid grid-cols-3 gap-3">
                  {seedWords.map((word, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-dex-dark/50 rounded border border-dex-secondary/20"
                    >
                      <span className="text-xs text-gray-400 w-6">{index + 1}.</span>
                      <span className="font-mono text-white">{showSeedPhrase ? word : '••••••'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {showSeedPhrase && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopySeedPhrase}
                    className="border-dex-secondary/30 text-white flex-1"
                  >
                    <Copy size={16} />
                    <span className="ml-2">Copy Seed Phrase</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadBackup}
                    className="border-dex-secondary/30 text-white flex-1"
                  >
                    <Download size={16} />
                    <span className="ml-2">Download Backup</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Confirmation Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="written"
                  checked={hasWrittenDown}
                  onCheckedChange={(checked) => setHasWrittenDown(checked as boolean)}
                  className="mt-1 border-dex-secondary/30 data-[state=checked]:bg-dex-primary data-[state=checked]:border-dex-primary"
                />
                <div className="space-y-1">
                  <Label htmlFor="written" className="text-white cursor-pointer">
                    I have written down my seed phrase
                  </Label>
                  <p className="text-xs text-gray-400">
                    Confirm that you have securely recorded your seed phrase
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="understand"
                  checked={understands}
                  onCheckedChange={(checked) => setUnderstands(checked as boolean)}
                  className="mt-1 border-dex-secondary/30 data-[state=checked]:bg-dex-primary data-[state=checked]:border-dex-primary"
                />
                <div className="space-y-1">
                  <Label htmlFor="understand" className="text-white cursor-pointer">
                    I understand the security implications
                  </Label>
                  <p className="text-xs text-gray-400">
                    Acknowledge that you understand the importance of keeping this secure
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleClose}
                disabled={!hasWrittenDown || !understands}
                className="bg-dex-primary hover:bg-dex-primary/80 text-white w-full"
              >
                <CheckCircle size={16} />
                <span className="ml-2">I've Secured My Backup</span>
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SeedPhraseBackupModal;
