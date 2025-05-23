import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/services/realTimeData';
import { Transaction } from '@/types';
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Copy,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TokenIcon from './TokenIcon';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  const { toast } = useToast();

  if (!transaction) return null;

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'completed':
        return <CheckCircle2 className="text-dex-positive" size={18} />;
      case 'pending':
        return <Clock className="text-yellow-500" size={18} />;
      case 'failed':
        return <XCircle className="text-dex-negative" size={18} />;
      default:
        return <AlertCircle className="text-gray-400" size={18} />;
    }
  };

  const getTypeIcon = () => {
    switch (transaction.type) {
      case 'send':
        return <ArrowUpRight className="text-dex-negative" size={18} />;
      case 'receive':
        return <ArrowDownLeft className="text-dex-positive" size={18} />;
      case 'swap':
        return <RefreshCw className="text-blue-500" size={18} />;
      default:
        return null;
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Address copied to clipboard",
    });
  };

  const handleOpenExplorer = () => {
    // Determine the block explorer URL based on the chain
    let explorerUrl = '';
    
    switch (transaction.chain) {
      case 'ethereum':
        explorerUrl = `https://etherscan.io/tx/${transaction.hash}`;
        break;
      case 'solana':
        explorerUrl = `https://explorer.solana.com/tx/${transaction.hash}`;
        break;
      case 'bitcoin':
        explorerUrl = `https://www.blockchain.com/explorer/transactions/btc/${transaction.hash}`;
        break;
      default:
        explorerUrl = `https://etherscan.io/tx/${transaction.hash}`;
    }
    
    window.open(explorerUrl, '_blank');
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    });
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-dex-dark border-dex-secondary/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Transaction Details
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            View detailed information about this transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Transaction Status */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {getTypeIcon()}
              <span className="text-white font-medium capitalize">
                {transaction.type}
              </span>
            </div>
            <Badge
              variant={
                transaction.status === 'completed' ? 'success' :
                transaction.status === 'pending' ? 'warning' :
                transaction.status === 'failed' ? 'destructive' : 'outline'
              }
              className="flex items-center gap-1"
            >
              {getStatusIcon()}
              <span className="capitalize">{transaction.status}</span>
            </Badge>
          </div>

          {/* Transaction Amount */}
          <div className="bg-dex-secondary/10 rounded-lg p-4 border border-dex-secondary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TokenIcon token={transaction.token} size="sm" />
                <span className="text-white font-medium">{transaction.token.symbol}</span>
              </div>
              <span className="text-lg font-bold text-white">
                {transaction.type === 'send' ? '-' : transaction.type === 'receive' ? '+' : ''}
                {transaction.amount} {transaction.token.symbol}
              </span>
            </div>
            <div className="text-right text-gray-400 text-sm">
              ≈ {formatCurrency(transaction.amount * transaction.token.price)}
            </div>
          </div>

          <Separator className="bg-dex-secondary/20" />

          {/* Transaction Details */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Date</span>
              <span className="text-white">{formatDate(transaction.timestamp)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Network Fee</span>
              <span className="text-white">{transaction.fee} {transaction.token.symbol}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Network</span>
              <span className="text-white capitalize">{transaction.chain}</span>
            </div>
          </div>

          <Separator className="bg-dex-secondary/20" />

          {/* Addresses */}
          <div className="space-y-3">
            <div>
              <span className="text-gray-400 block mb-1">From</span>
              <div className="flex items-center justify-between">
                <span className="text-white font-mono">{formatAddress(transaction.from)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCopyAddress(transaction.from)}
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>
            
            <div>
              <span className="text-gray-400 block mb-1">To</span>
              <div className="flex items-center justify-between">
                <span className="text-white font-mono">{formatAddress(transaction.to)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCopyAddress(transaction.to)}
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>
            
            <div>
              <span className="text-gray-400 block mb-1">Transaction Hash</span>
              <div className="flex items-center justify-between">
                <span className="text-white font-mono">{formatAddress(transaction.hash)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCopyAddress(transaction.hash)}
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>
          </div>

          {/* Notes/Memo */}
          {transaction.memo && (
            <>
              <Separator className="bg-dex-secondary/20" />
              <div>
                <span className="text-gray-400 block mb-1">Memo</span>
                <div className="bg-dex-secondary/10 rounded-lg p-3 border border-dex-secondary/20">
                  <p className="text-white">{transaction.memo}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="flex-1 border-dex-secondary/30"
            onClick={handleOpenExplorer}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View in Explorer
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailsModal;
