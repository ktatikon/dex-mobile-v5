
import React from 'react';
import { Transaction, TransactionStatus, TransactionType } from '@/types';
import TokenIcon from './TokenIcon';
import { formatAddress } from '@/services/mockData';

interface TransactionItemProps {
  transaction: Transaction;
  onViewDetails?: (transaction: Transaction) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ 
  transaction,
  onViewDetails
}) => {
  const { type, fromToken, toToken, fromAmount, toAmount, timestamp, status } = transaction;
  
  // Format date
  const date = new Date(timestamp);
  const formattedDate = date.toLocaleDateString();
  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Get transaction title and icons
  const getTransactionDetails = () => {
    switch (type) {
      case TransactionType.SWAP:
        return {
          title: 'Swap',
          description: `${fromAmount} ${fromToken?.symbol} → ${toAmount} ${toToken?.symbol}`,
          icon: (
            <div className="flex -space-x-2">
              {fromToken && <TokenIcon token={fromToken} size="sm" />}
              {toToken && <TokenIcon token={toToken} size="sm" />}
            </div>
          )
        };
      case TransactionType.SEND:
        return {
          title: 'Send',
          description: `${fromAmount} ${fromToken?.symbol}`,
          icon: fromToken && <TokenIcon token={fromToken} size="sm" />
        };
      case TransactionType.RECEIVE:
        return {
          title: 'Receive',
          description: `${toAmount} ${toToken?.symbol}`,
          icon: toToken && <TokenIcon token={toToken} size="sm" />
        };
      case TransactionType.APPROVE:
        return {
          title: 'Approve',
          description: `${fromToken?.symbol}`,
          icon: fromToken && <TokenIcon token={fromToken} size="sm" />
        };
      default:
        return {
          title: type,
          description: `${fromAmount || ''} ${fromToken?.symbol || ''} ${toAmount ? '→ ' + toAmount : ''} ${toToken?.symbol || ''}`,
          icon: fromToken && <TokenIcon token={fromToken} size="sm" />
        };
    }
  };
  
  const { title, description, icon } = getTransactionDetails();
  
  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return 'text-dex-success';
      case TransactionStatus.PENDING:
        return 'text-dex-warning';
      case TransactionStatus.FAILED:
        return 'text-dex-error';
      default:
        return 'text-gray-500';
    }
  };
  
  return (
    <div 
      className="flex items-center justify-between p-3 border-b border-gray-800 cursor-pointer hover:bg-gray-900"
      onClick={() => onViewDetails && onViewDetails(transaction)}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full">
          {icon}
        </div>
        
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-gray-400">{description}</div>
        </div>
      </div>
      
      <div className="text-right">
        <div className={`text-sm ${getStatusColor()}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
        <div className="text-xs text-gray-400">
          {formattedDate} {formattedTime}
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;
