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
import { useToast } from '@/hooks/use-toast';
import { updateWalletName } from '@/services/walletGenerationService';
import { useAuth } from '@/contexts/AuthContext';
import { Edit3, AlertCircle } from 'lucide-react';

interface WalletRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletId: string;
  currentName: string;
  onSuccess: () => void;
}

const WalletRenameModal: React.FC<WalletRenameModalProps> = ({
  isOpen,
  onClose,
  walletId,
  currentName,
  onSuccess
}) => {
  const [newName, setNewName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const validateName = (name: string): string => {
    if (!name.trim()) {
      return 'Wallet name is required';
    }
    if (name.trim().length < 3) {
      return 'Wallet name must be at least 3 characters';
    }
    if (name.trim().length > 50) {
      return 'Wallet name must be less than 50 characters';
    }
    if (!/^[a-zA-Z0-9_\s-]+$/.test(name.trim())) {
      return 'Wallet name can only contain letters, numbers, spaces, hyphens, and underscores';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('User not authenticated');
      return;
    }

    const validationError = validateName(newName);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (newName.trim() === currentName) {
      onClose();
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await updateWalletName(walletId, newName.trim(), user.id);
      
      if (success) {
        toast({
          title: "Wallet Renamed",
          description: `Wallet renamed to "${newName.trim()}" successfully`,
        });
        onSuccess();
        onClose();
      } else {
        setError('Failed to rename wallet. Please try again.');
      }
    } catch (error) {
      console.error('Error renaming wallet:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setNewName(currentName);
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-dex-dark border-dex-secondary/30 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Edit3 size={20} className="text-dex-primary" />
            Rename Wallet
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter a new name for your wallet. This will help you identify it more easily.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="walletName" className="text-white">
              Wallet Name
            </Label>
            <Input
              id="walletName"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError('');
              }}
              placeholder="Enter wallet name"
              className="bg-dex-secondary/20 border-dex-secondary/30 text-white placeholder:text-gray-500 focus:border-dex-primary"
              disabled={isLoading}
              maxLength={50}
            />
            <div className="text-xs text-gray-500">
              {newName.length}/50 characters
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-dex-negative/10 border border-dex-negative/20 rounded-lg">
              <AlertCircle size={16} className="text-dex-negative" />
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
              disabled={isLoading || !!validateName(newName)}
              className="bg-dex-primary hover:bg-dex-primary/80 text-white"
            >
              {isLoading ? 'Renaming...' : 'Rename Wallet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WalletRenameModal;
