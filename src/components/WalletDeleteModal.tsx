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
import { deleteWalletComprehensively } from '@/services/unifiedWalletService';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, AlertTriangle, Shield } from 'lucide-react';

interface WalletDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletId: string;
  walletName: string;
  onSuccess: () => void;
}

const WalletDeleteModal: React.FC<WalletDeleteModalProps> = ({
  isOpen,
  onClose,
  walletId,
  walletName,
  onSuccess
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [hasBackup, setHasBackup] = useState(false);
  const [understands, setUnderstands] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const expectedText = `DELETE ${walletName}`;
  const isConfirmationValid = confirmationText === expectedText;
  const canDelete = isConfirmationValid && hasBackup && understands;



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !canDelete) {
      return;
    }

    setIsLoading(true);

    try {
      const success = await deleteWalletComprehensively(walletId, user.id);

      if (success) {
        toast({
          title: "Wallet Deleted",
          description: `"${walletName}" has been permanently deleted`,
          variant: "destructive",
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: "Deletion Failed",
          description: "Failed to delete wallet. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting wallet:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setConfirmationText('');
      setHasBackup(false);
      setUnderstands(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-dex-dark border-dex-negative/30 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-dex-negative">
            <Trash2 size={20} />
            Delete Wallet
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            This action cannot be undone. Please read the warnings below carefully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Section */}
          <div className="p-4 bg-dex-negative/10 border border-dex-negative/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-dex-negative min-w-[20px] mt-1" size={20} />
              <div>
                <h4 className="text-white font-medium mb-2">⚠️ Critical Warning</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• This will permanently delete your wallet and all associated data</li>
                  <li>• Any cryptocurrency in this wallet will become inaccessible</li>
                  <li>• This action cannot be reversed or undone</li>
                  <li>• Make sure you have backed up your seed phrase</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Backup Confirmation */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="backup"
                checked={hasBackup}
                onCheckedChange={(checked) => setHasBackup(checked as boolean)}
                className="mt-1 border-dex-secondary/30 data-[state=checked]:bg-dex-primary data-[state=checked]:border-dex-primary"
              />
              <div className="space-y-1">
                <Label htmlFor="backup" className="text-white cursor-pointer">
                  I have backed up my seed phrase
                </Label>
                <p className="text-xs text-gray-400">
                  Confirm that you have securely stored your wallet's seed phrase
                </p>
              </div>
            </div>

            {/* Understanding Confirmation */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="understand"
                checked={understands}
                onCheckedChange={(checked) => setUnderstands(checked as boolean)}
                className="mt-1 border-dex-secondary/30 data-[state=checked]:bg-dex-primary data-[state=checked]:border-dex-primary"
              />
              <div className="space-y-1">
                <Label htmlFor="understand" className="text-white cursor-pointer">
                  I understand this action is permanent
                </Label>
                <p className="text-xs text-gray-400">
                  Acknowledge that wallet deletion cannot be undone
                </p>
              </div>
            </div>

            {/* Confirmation Text */}
            <div className="space-y-2">
              <Label htmlFor="confirmation" className="text-white">
                Type <span className="font-mono text-dex-negative">{expectedText}</span> to confirm
              </Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={expectedText}
                className="bg-dex-secondary/20 border-dex-secondary/30 text-white placeholder:text-gray-500 focus:border-dex-negative font-mono"
                disabled={isLoading}
              />
            </div>

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
                disabled={!canDelete || isLoading}
                className="bg-dex-negative hover:bg-dex-negative/80 text-white"
              >
                {isLoading ? 'Deleting...' : 'Delete Wallet'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletDeleteModal;
