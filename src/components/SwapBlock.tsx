import React, { useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, Loader2, RefreshCw } from 'lucide-react';
import { Token } from '@/types';
import { formatCurrency } from '@/services/realTimeData';
import { useToast } from '@/hooks/use-toast';
import { mockTokens } from '@/services/fallbackDataService';
import TokenIcon from '@/components/TokenIcon';

interface SwapBlockProps {
  tokens: Token[];
  onSwap?: (params: SwapParams) => void;
}

interface SwapParams {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  slippage: number;
  priceImpact: number;
  minimumReceived: string;
  fee: string;
}

// Network configuration
const SUPPORTED_NETWORKS = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: '⟠' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC', icon: '⬟' },
  { id: 'bsc', name: 'BSC', symbol: 'BNB', icon: '🟡' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', icon: '🔵' },
  { id: 'optimism', name: 'Optimism', symbol: 'OP', icon: '🔴' },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', icon: '🔺' },
  { id: 'fantom', name: 'Fantom', symbol: 'FTM', icon: '👻' }
];

// Mock wallet address for display
const MOCK_WALLET_ADDRESS = "0x1234...5678";

const SwapBlock: React.FC<SwapBlockProps> = ({ tokens, onSwap }) => {
  const { toast } = useToast();

  // Use fallback tokens if no tokens provided or empty
  const effectiveTokens = tokens && tokens.length > 0 ? tokens : mockTokens;

  // Debug tokens prop
  console.log('🎯 SwapBlock received tokens:', {
    originalTokensLength: tokens?.length || 0,
    effectiveTokensLength: effectiveTokens?.length || 0,
    usingFallback: tokens?.length === 0,
    effectiveTokens: effectiveTokens?.map(t => ({
      symbol: t.symbol,
      balance: t.balance,
      price: t.price,
      hasBalance: !!t.balance && parseFloat(t.balance) > 0
    }))
  });

  // State management
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromNetwork, setFromNetwork] = useState(SUPPORTED_NETWORKS[0]);
  const [toNetwork, setToNetwork] = useState(SUPPORTED_NETWORKS[0]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [slippage] = useState(0.5); // Default 0.5%
  const [priceImpact, setPriceImpact] = useState(0);

  // Initialize default tokens
  useEffect(() => {
    if (effectiveTokens && effectiveTokens.length > 0) {
      setFromToken(effectiveTokens[0]);
      if (effectiveTokens.length > 1) {
        setToToken(effectiveTokens[1]);
      }
    }
  }, [effectiveTokens]);

  // Calculate exchange rate and output amount
  useEffect(() => {
    console.log('💰 Calculation Effect Triggered:', {
      fromToken: fromToken?.symbol,
      toToken: toToken?.symbol,
      fromAmount,
      fromAmountParsed: parseFloat(fromAmount || '0')
    });

    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      setIsCalculating(true);
      console.log('🔄 Starting calculation...');

      // Simulate API call delay
      const timer = setTimeout(() => {
        const fromPrice = fromToken.price || 0;
        const toPrice = toToken.price || 0;

        console.log('📊 Price Data:', { fromPrice, toPrice });

        if (fromPrice > 0 && toPrice > 0) {
          const rate = fromPrice / toPrice;
          const calculatedAmount = (parseFloat(fromAmount) * rate).toFixed(6);
          setToAmount(calculatedAmount);

          // Calculate price impact (mock calculation)
          const impact = Math.min(parseFloat(fromAmount) * 0.001, 5); // Max 5%
          setPriceImpact(impact);

          console.log('✅ Calculation Complete:', {
            rate,
            calculatedAmount,
            impact
          });
        } else {
          console.log('❌ Invalid prices, cannot calculate');
        }

        setIsCalculating(false);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      console.log('🚫 Clearing amounts - conditions not met');
      setToAmount('');
      setPriceImpact(0);
    }
  }, [fromToken, toToken, fromAmount]);

  // Available tokens for selection
  const availableTokens = useMemo(() => {
    const filtered = effectiveTokens.filter(token => token.balance && parseFloat(token.balance) > 0);
    console.log('🔍 Available tokens after filtering:', {
      originalCount: effectiveTokens.length,
      filteredCount: filtered.length,
      filtered: filtered.map(t => ({ symbol: t.symbol, balance: t.balance, price: t.price }))
    });
    return filtered;
  }, [effectiveTokens]);

  // Handle token swap (reverse from/to)
  const handleSwapTokens = () => {
    const tempToken = fromToken;
    const tempNetwork = fromNetwork;
    const tempAmount = fromAmount;

    setFromToken(toToken);
    setToToken(tempToken);
    setFromNetwork(toNetwork);
    setToNetwork(tempNetwork);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  // Handle max button click
  const handleMaxClick = () => {
    if (fromToken && fromToken.balance) {
      setFromAmount(fromToken.balance);
    }
  };

  // Handle swap execution
  const handleSwap = () => {
    if (!fromToken || !toToken || !fromAmount || !toAmount) {
      toast({
        title: "Error",
        description: "Please complete all fields before swapping",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(fromAmount);
    const balanceNum = parseFloat(fromToken.balance || '0');

    if (amountNum > balanceNum) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough ${fromToken.symbol}`,
        variant: "destructive",
      });
      return;
    }

    // Calculate minimum received and fee
    const minimumReceived = (parseFloat(toAmount) * (1 - slippage / 100)).toFixed(6);
    const fee = (amountNum * 0.003).toFixed(6); // 0.3% fee

    const swapParams: SwapParams = {
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      slippage,
      priceImpact,
      minimumReceived,
      fee,
    };

    if (onSwap) {
      onSwap(swapParams);
    } else {
      // Default swap handling
      toast({
        title: "Swap Initiated",
        description: `Swapping ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`,
      });
    }
  };

  // Calculate exchange rate display (for future use)
  // const exchangeRate = useMemo(() => {
  //   if (fromToken && toToken && fromToken.price && toToken.price) {
  //     const rate = fromToken.price / toToken.price;
  //     return `1 ${fromToken.symbol} = ${rate.toFixed(6)} ${toToken.symbol}`;
  //   }
  //   return '';
  // }, [fromToken, toToken]);

  return (
    <Card className="p-6 bg-gradient-to-br from-dex-dark to-black text-white border-none shadow-[0_4px_16px_rgba(0,0,0,0.3)] rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Swap</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-dex-secondary/10"
          >
            <RefreshCw size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-dex-secondary/10"
          >
            <ArrowUpDown size={16} />
          </Button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* From Panel */}
        <div className="bg-dex-tertiary p-6 rounded-xl border border-dex-secondary/30 space-y-6 min-h-[320px] flex flex-col">
          <div className="text-sm text-dex-text-secondary">
            From: {MOCK_WALLET_ADDRESS}
          </div>

          {/* Token Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Token</label>
            <Select
              value={fromToken?.symbol || ''}
              onValueChange={(value) => {
                const token = availableTokens.find(t => t.symbol === value);
                if (token) setFromToken(token);
              }}
            >
              <SelectTrigger className="bg-dex-secondary/20 border-dex-secondary/30 text-white h-12">
                <SelectValue placeholder="Select token">
                  {fromToken && (
                    <div className="flex items-center gap-3">
                      <TokenIcon token={fromToken} size="sm" />
                      <span className="font-medium">{fromToken.symbol}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-dex-dark border-dex-secondary/30 z-[100] shadow-xl">
                {availableTokens.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol} className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/30 focus:text-white">
                    <div className="flex items-center gap-3 w-full">
                      <TokenIcon token={token} size="sm" />
                      <div className="flex-1">
                        <span className="font-medium">{token.symbol}</span>
                        <span className="text-dex-text-secondary text-xs ml-2">
                          {formatCurrency(parseFloat(token.balance || '0'))}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Network Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Network</label>
            <Select
              value={fromNetwork.id}
              onValueChange={(value) => {
                const network = SUPPORTED_NETWORKS.find(n => n.id === value);
                if (network) setFromNetwork(network);
              }}
            >
              <SelectTrigger className="bg-dex-secondary/20 border-dex-secondary/30 text-white h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-dex-dark border-dex-secondary/30 z-[100] shadow-xl">
                {SUPPORTED_NETWORKS.map((network) => (
                  <SelectItem key={network.id} value={network.id} className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/30 focus:text-white">
                    <div className="flex items-center gap-2">
                      <span>{network.icon}</span>
                      <span>{network.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">You send:</label>
              {fromToken && (
                <span className="text-xs text-dex-text-secondary">
                  Available: {formatCurrency(parseFloat(fromToken.balance || '0'))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMaxClick}
                    className="ml-2 h-6 px-2 text-xs text-dex-primary hover:text-dex-primary/90"
                  >
                    MAX
                  </Button>
                </span>
              )}
            </div>
            <div className="bg-black border border-dex-secondary/30 rounded-lg p-4 min-h-[80px] flex flex-col justify-center">
              <Input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="bg-transparent border-none text-3xl font-bold text-white p-0 h-auto focus:ring-0 focus:outline-none"
              />
              {fromToken && fromAmount && (
                <div className="text-sm text-dex-text-secondary mt-2">
                  ≈${formatCurrency(parseFloat(fromAmount) * (fromToken.price || 0))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* To Panel */}
        <div className="bg-dex-tertiary p-6 rounded-xl border border-dex-secondary/30 space-y-6 min-h-[320px] flex flex-col">
          <div className="text-sm text-dex-text-secondary">
            To: {MOCK_WALLET_ADDRESS}
          </div>

          {/* Token Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Token</label>
            <Select
              value={toToken?.symbol || ''}
              onValueChange={(value) => {
                const token = effectiveTokens.find(t => t.symbol === value);
                if (token) setToToken(token);
              }}
            >
              <SelectTrigger className="bg-dex-secondary/20 border-dex-secondary/30 text-white h-12">
                <SelectValue placeholder="Select token">
                  {toToken && (
                    <div className="flex items-center gap-3">
                      <TokenIcon token={toToken} size="sm" />
                      <span className="font-medium">{toToken.symbol}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-dex-dark border-dex-secondary/30 z-[100] shadow-xl">
                {effectiveTokens.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol} className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/30 focus:text-white">
                    <div className="flex items-center gap-3 w-full">
                      <TokenIcon token={token} size="sm" />
                      <div className="flex-1">
                        <span className="font-medium">{token.symbol}</span>
                        <span className="text-dex-text-secondary text-xs ml-2">
                          Balance: {formatCurrency(parseFloat(token.balance || '0'))}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Network Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Network</label>
            <Select
              value={toNetwork.id}
              onValueChange={(value) => {
                const network = SUPPORTED_NETWORKS.find(n => n.id === value);
                if (network) setToNetwork(network);
              }}
            >
              <SelectTrigger className="bg-dex-secondary/20 border-dex-secondary/30 text-white h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-dex-dark border-dex-secondary/30 z-[100] shadow-xl">
                {SUPPORTED_NETWORKS.map((network) => (
                  <SelectItem key={network.id} value={network.id} className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/30 focus:text-white">
                    <div className="flex items-center gap-2">
                      <span>{network.icon}</span>
                      <span>{network.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Display */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">You receive:</label>
              {toToken && (
                <span className="text-xs text-dex-text-secondary">
                  Balance: {formatCurrency(parseFloat(toToken.balance || '0'))}
                </span>
              )}
            </div>
            <div className="bg-black border border-dex-secondary/30 rounded-lg p-4 min-h-[80px] flex flex-col justify-center relative">
              <Input
                type="text"
                placeholder="0.0"
                value={isCalculating ? '' : toAmount}
                readOnly
                className="bg-transparent border-none text-3xl font-bold text-white p-0 h-auto focus:ring-0 focus:outline-none"
              />
              {isCalculating && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <Loader2 size={20} className="animate-spin text-dex-primary" />
                </div>
              )}
              {toToken && toAmount && !isCalculating && (
                <div className="text-sm text-dex-text-secondary mt-2">
                  ≈${formatCurrency(parseFloat(toAmount) * (toToken.price || 0))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Swap Direction Button */}
      <div className="flex justify-center my-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSwapTokens}
          className="h-12 w-12 p-0 rounded-full bg-dex-primary hover:bg-dex-primary/90 border border-dex-secondary/30 shadow-lg"
        >
          <ArrowUpDown size={20} className="text-white" />
        </Button>
      </div>

      {/* Enhanced Transaction Details */}
      {(() => {
        const shouldShow = fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0 && toAmount && parseFloat(toAmount) > 0 && !isCalculating;
        console.log('🔍 Transaction Details Debug:', {
          fromToken: fromToken?.symbol,
          toToken: toToken?.symbol,
          fromAmount,
          fromAmountParsed: parseFloat(fromAmount || '0'),
          toAmount,
          toAmountParsed: parseFloat(toAmount || '0'),
          isCalculating,
          shouldShow
        });

        return shouldShow ? (
          <div className="bg-gray-800/20 rounded-xl p-4 space-y-3 text-sm border border-gray-700/30 mb-4">
            {/* TDS Fees */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400">TDS Fees:</span>
              <span className="text-white font-medium">
                {(parseFloat(fromAmount) * 0.01).toFixed(6)} {fromToken.symbol}
              </span>
            </div>

            {/* Estimated Rate */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Estimated Rate:</span>
              <span className="text-white font-medium">
                1 {fromToken.symbol} = {fromToken.price && toToken.price ?
                  (fromToken.price / toToken.price).toFixed(6) : '0'} {toToken.symbol}
              </span>
            </div>

            {/* Cashback */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Cashback!:</span>
              <span className="text-green-400 font-medium">
                {(parseFloat(fromAmount) * 0.001).toFixed(6)} {fromToken.symbol}
              </span>
            </div>

            {/* Price Impact */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-700/30">
              <span className="text-gray-400">Price Impact (24h):</span>
              <span className="text-green-400 font-medium">
                ≈ {priceImpact > 0 ? '+' : ''}{priceImpact.toFixed(2)}%
              </span>
            </div>

            <div className="text-xs text-gray-500 text-center pt-1">
              Rate is for reference only. Updated just now
            </div>
          </div>
        ) : null;
      })()}



      {/* Action Button */}
      <Button
        onClick={handleSwap}
        disabled={!fromToken || !toToken || !fromAmount || !toAmount || isCalculating}
        className={`w-full mt-6 text-black font-bold py-4 rounded-lg text-lg shadow-lg ${
          !fromToken || !toToken || !fromAmount || !toAmount || isCalculating ||
          parseFloat(fromAmount) > parseFloat(fromToken.balance || '0')
            ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600'
            : 'bg-[#F2C230] hover:bg-[#E6B82A]'
        }`}
      >
        {!fromToken || !toToken ? 'Select Tokens' :
         !fromAmount || !toAmount ? 'Enter Amount' :
         isCalculating ? 'Calculating...' :
         parseFloat(fromAmount) > parseFloat(fromToken.balance || '0') ?
         `Insufficient ${fromToken.symbol} Balance` : 'Swap Now'}
      </Button>
    </Card>
  );
};

export default SwapBlock;
