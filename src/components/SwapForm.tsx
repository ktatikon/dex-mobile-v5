
import React, { useState, useEffect } from 'react';
import { Token, SwapParams } from '@/types';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import TokenSelector from './TokenSelector';
import { calculateSwapEstimate } from '@/services/mockData';
import { useToast } from '@/hooks/use-toast';

interface SwapFormProps {
  tokens: Token[];
  onSwap: (params: SwapParams) => void;
}

const SwapForm: React.FC<SwapFormProps> = ({ tokens, onSwap }) => {
  const { toast } = useToast();
  const [fromToken, setFromToken] = useState<Token | null>(tokens[0] || null);
  const [toToken, setToToken] = useState<Token | null>(tokens[2] || null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5); // Default 0.5%
  const [priceImpact, setPriceImpact] = useState(0);
  const [isFromFocused, setIsFromFocused] = useState(true);
  
  // Update amounts when tokens or input amounts change
  useEffect(() => {
    if (!fromToken || !toToken) return;
    
    if (isFromFocused && fromAmount) {
      const { toAmount: calculated, priceImpact: impact } = calculateSwapEstimate(
        fromToken,
        toToken,
        fromAmount
      );
      setToAmount(calculated);
      setPriceImpact(impact);
    } else if (!isFromFocused && toAmount) {
      // Reverse calculation
      const { toAmount: calculated, priceImpact: impact } = calculateSwapEstimate(
        toToken,
        fromToken,
        toAmount
      );
      setFromAmount(calculated);
      setPriceImpact(impact);
    }
  }, [fromToken, toToken, fromAmount, toAmount, isFromFocused]);
  
  // Handle from amount change
  const handleFromAmountChange = (value: string) => {
    setIsFromFocused(true);
    setFromAmount(value);
  };
  
  // Handle to amount change
  const handleToAmountChange = (value: string) => {
    setIsFromFocused(false);
    setToAmount(value);
  };
  
  // Swap tokens
  const handleSwitchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };
  
  // Handle swap
  const handleSwap = () => {
    if (!fromToken || !toToken || !fromAmount || !toAmount) {
      toast({
        title: "Error",
        description: "Please select tokens and enter amounts",
        variant: "destructive",
      });
      return;
    }
    
    // Convert fromAmount to number and check if balance is sufficient
    const amountNum = parseFloat(fromAmount);
    const balanceNum = parseFloat(fromToken.balance || '0');
    
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    if (amountNum > balanceNum) {
      toast({
        title: "Error",
        description: `Insufficient ${fromToken.symbol} balance`,
        variant: "destructive",
      });
      return;
    }
    
    // Calculate minimum received based on slippage
    const minimumReceived = (parseFloat(toAmount) * (1 - slippage / 100)).toFixed(6);
    
    // Mock transaction fee
    const fee = (amountNum * 0.003).toFixed(6);
    
    const params: SwapParams = {
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      slippage,
      deadline: 20, // Default 20 minutes
      priceImpact,
      minimumReceived,
      fee,
    };
    
    onSwap(params);
  };
  
  return (
    <Card className="p-4 bg-dex-dark text-white border-gray-700">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Swap Tokens</h2>
        <button className="text-gray-400 hover:text-gray-300">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="1"/>
            <circle cx="19" cy="12" r="1"/>
            <circle cx="5" cy="12" r="1"/>
          </svg>
        </button>
      </div>
      
      {/* From token input */}
      <div className="p-3 bg-gray-800 rounded-lg mb-2">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-400">From</span>
          {fromToken && (
            <span className="text-sm text-gray-400">
              Balance: {parseFloat(fromToken.balance || '0').toFixed(4)}
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <Input 
            className="bg-transparent border-0 text-lg p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="0.0"
            value={fromAmount}
            onChange={(e) => handleFromAmountChange(e.target.value)}
            onFocus={() => setIsFromFocused(true)}
          />
          
          <TokenSelector 
            tokens={tokens}
            selectedToken={fromToken}
            onSelectToken={setFromToken}
            label="Select token to swap from"
          />
        </div>
      </div>
      
      {/* Switch button */}
      <div className="flex justify-center -my-2 relative z-10">
        <Button 
          variant="ghost" 
          size="icon"
          className="h-10 w-10 rounded-full bg-dex-dark border border-gray-700 text-white hover:bg-gray-700"
          onClick={handleSwitchTokens}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M17 10H3"/>
            <path d="m21 6-4 4 4 4"/>
            <path d="M7 14h14"/>
            <path d="m3 18 4-4-4-4"/>
          </svg>
        </Button>
      </div>
      
      {/* To token input */}
      <div className="p-3 bg-gray-800 rounded-lg mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-400">To</span>
          {toToken && (
            <span className="text-sm text-gray-400">
              Balance: {parseFloat(toToken.balance || '0').toFixed(4)}
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <Input 
            className="bg-transparent border-0 text-lg p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="0.0"
            value={toAmount}
            onChange={(e) => handleToAmountChange(e.target.value)}
            onFocus={() => setIsFromFocused(false)}
          />
          
          <TokenSelector 
            tokens={tokens}
            selectedToken={toToken}
            onSelectToken={setToToken}
            label="Select token to receive"
          />
        </div>
      </div>
      
      {/* Transaction details */}
      {fromToken && toToken && fromAmount && toAmount && (
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Rate</span>
            <span>
              1 {fromToken.symbol} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken.symbol}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Price Impact</span>
            <span className={priceImpact > 2 ? 'text-dex-warning' : 'text-dex-success'}>
              {priceImpact.toFixed(2)}%
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Slippage Tolerance</span>
            <span>{slippage}%</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Minimum Received</span>
            <span>
              {(parseFloat(toAmount) * (1 - slippage / 100)).toFixed(6)} {toToken.symbol}
            </span>
          </div>
        </div>
      )}
      
      {/* Swap button */}
      <Button 
        className="w-full bg-dex-primary hover:bg-dex-primary/90"
        onClick={handleSwap}
        disabled={!fromToken || !toToken || !fromAmount || !toAmount}
      >
        {!fromToken || !toToken 
          ? 'Select Tokens' 
          : !fromAmount || !toAmount 
            ? 'Enter Amount' 
            : parseFloat(fromAmount) > parseFloat(fromToken.balance || '0')
              ? `Insufficient ${fromToken.symbol} Balance`
              : 'Swap'
        }
      </Button>
    </Card>
  );
};

export default SwapForm;
