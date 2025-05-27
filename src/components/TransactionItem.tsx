
import React from 'react';
import { Transaction, TransactionStatus, TransactionType } from '@/types';
import TokenIcon from './TokenIcon';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Check, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TransactionItemProps {
  transaction: Transaction;
  onViewDetails?: (transaction: Transaction) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onViewDetails
}) => {
  // Extract transaction properties with fallbacks for the enhanced transaction type
  const {
    type,
    fromToken,
    toToken,
    token, // New field for simplified transactions
    fromAmount,
    toAmount,
    amount, // New field for simplified transactions
    timestamp,
    status,
    hash,
    chain
  } = transaction;

  // Format date
  const date = new Date(typeof timestamp === 'string' ? timestamp : Number(timestamp));
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();

  let formattedDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (isToday) {
    formattedDate = 'Today';
  } else if (isYesterday) {
    formattedDate = 'Yesterday';
  }

  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Get transaction title, icons, and action icon
  const getTransactionDetails = () => {
    // Use the token field if available, otherwise use fromToken/toToken
    const displayToken = token || (type === 'receive' ? toToken : fromToken);
    const displayAmount = amount || (type === 'receive' ? toAmount : fromAmount);

    switch (type) {
      case TransactionType.SWAP:
      case 'swap':
        return {
          title: 'Swap',
          description: `${fromAmount} ${fromToken?.symbol} → ${toAmount} ${toToken?.symbol}`,
          icon: (
            <div className="flex -space-x-2">
              {fromToken && <TokenIcon token={fromToken} size="sm" />}
              {toToken && <TokenIcon token={toToken} size="sm" className="ml-3" />}
            </div>
          ),
          actionIcon: <RefreshCw size={16} className="text-dex-text-secondary" />
        };
      case TransactionType.SEND:
      case 'send':
        return {
          title: 'Send',
          description: `${displayAmount} ${displayToken?.symbol}`,
          icon: displayToken && <TokenIcon token={displayToken} size="sm" />,
          actionIcon: <ArrowUpRight size={16} className="text-dex-negative" />
        };
      case TransactionType.RECEIVE:
      case 'receive':
        return {
          title: 'Receive',
          description: `${displayAmount} ${displayToken?.symbol}`,
          icon: displayToken && <TokenIcon token={displayToken} size="sm" />,
          actionIcon: <ArrowDownLeft size={16} className="text-dex-positive" />
        };
      case TransactionType.APPROVE:
      case 'approve':
        return {
          title: 'Approve',
          description: `${displayToken?.symbol}`,
          icon: displayToken && <TokenIcon token={displayToken} size="sm" />,
          actionIcon: <Check size={16} className="text-dex-text-secondary" />
        };
      default:
        return {
          title: typeof type === 'string' ? type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ') : 'Transaction',
          description: `${displayAmount || ''} ${displayToken?.symbol || ''}`,
          icon: displayToken && <TokenIcon token={displayToken} size="sm" />,
          actionIcon: <RefreshCw size={16} className="text-dex-text-secondary" />
        };
    }
  };

  const { title, description, icon, actionIcon } = getTransactionDetails();

  // Get status badge
  const getStatusBadge = () => {
    switch (status) {
      case TransactionStatus.COMPLETED:
      case 'completed':
        return (
          <Badge variant="outline" className="bg-dex-positive/10 text-dex-positive border-dex-positive/20 flex items-center gap-1">
            <Check size={12} />
            <span>Completed</span>
          </Badge>
        );
      case TransactionStatus.PENDING:
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 flex items-center gap-1">
            <Clock size={12} />
            <span>Pending</span>
          </Badge>
        );
      case TransactionStatus.FAILED:
      case 'failed':
        return (
          <Badge variant="outline" className="bg-dex-negative/10 text-dex-negative border-dex-negative/20 flex items-center gap-1">
            <AlertTriangle size={12} />
            <span>Failed</span>
          </Badge>
        );
      default:
        return null;
    }
  };

  // Format hash for display
  const shortHash = hash ? `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}` : '';

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg bg-dex-secondary/10 border border-dex-secondary/20 mb-2 cursor-pointer hover:bg-dex-secondary/20 transition-colors duration-200"
      onClick={() => onViewDetails && onViewDetails(transaction)}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center bg-dex-primary/10 rounded-full">
          {icon}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{title}</span>
            <div className="w-5 h-5 flex items-center justify-center">
              {actionIcon}
            </div>
          </div>
          <div className="text-xs text-dex-text-secondary mt-1">{description}</div>
          <div className="flex items-center text-xs text-dex-text-secondary mt-1 opacity-60">
            <span>{shortHash}</span>
            {chain && <span className="ml-2 px-1.5 py-0.5 bg-dex-secondary/20 rounded-sm capitalize">{chain}</span>}
          </div>
        </div>
      </div>

      <div className="text-right">
        {getStatusBadge()}
        <div className="text-xs text-dex-text-secondary mt-2">
          {formattedDate} {formattedTime}
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;
