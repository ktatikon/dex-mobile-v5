
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import SwapForm from '@/components/SwapForm';
import { mockTokens, mockTransactions } from '@/services/mockData';
import { Transaction, TransactionStatus, TransactionType, SwapParams, Token } from '@/types';
import { useToast } from '@/hooks/use-toast';

const SwapPage: React.FC = () => {
  const { toast } = useToast();
  const location = useLocation();
  const preSelectedToken = location.state?.preSelectedToken as Token | undefined;
  
  // Set up preselected token if available
  React.useEffect(() => {
    if (preSelectedToken) {
      console.log("Pre-selected token:", preSelectedToken);
      // You could use this to pre-fill the swap form
    }
  }, [preSelectedToken]);
  
  const handleSwap = (params: SwapParams) => {
    const { fromToken, toToken, fromAmount, toAmount } = params;
    
    // Create a new transaction
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      type: TransactionType.SWAP,
      fromToken: fromToken,
      toToken: toToken,
      fromAmount: fromAmount,
      toAmount: toAmount,
      timestamp: Date.now(),
      hash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 8)}`,
      status: TransactionStatus.PENDING,
      account: "0xabc...def",
    };
    
    // Show loading toast
    toast({
      title: "Transaction Submitted",
      description: `Swapping ${fromAmount} ${fromToken?.symbol} for ${toAmount} ${toToken?.symbol}`,
    });
    
    // Simulate transaction confirmation
    setTimeout(() => {
      // Update transaction status
      newTransaction.status = TransactionStatus.COMPLETED;
      
      // Show success toast
      toast({
        title: "Transaction Confirmed",
        description: `Swapped ${fromAmount} ${fromToken?.symbol} for ${toAmount} ${toToken?.symbol}`,
        variant: "default",
      });
    }, 2000);
  };
  
  return (
    <div className="pb-20">
      <h1 className="text-2xl font-bold mb-4">Swap Tokens</h1>
      
      <SwapForm 
        tokens={mockTokens}
        onSwap={handleSwap}
      />
    </div>
  );
};

export default SwapPage;
