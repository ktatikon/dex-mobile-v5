import React, { useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, Loader2 } from 'lucide-react';
import { Token } from '@/types';
import { formatCurrency } from '@/services/realTimeData';
import { useToast } from '@/hooks/use-toast';
import { useRealTimeTokens } from '@/hooks/useRealTimeTokens';
import { useWalletData } from '@/hooks/useWalletData';
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

// Network Icon Components
const NetworkIcon = ({ network, size = 20 }: { network: string; size?: number }) => {
  const iconProps = {
    width: size,
    height: size,
    className: "text-dex-primary"
  };

  switch (network) {
    case 'ethereum':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1.5L5.25 12.75L12 16.5L18.75 12.75L12 1.5ZM12 18L5.25 14.25L12 22.5L18.75 14.25L12 18Z"/>
        </svg>
      );
    case 'polygon':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7L12 12L22 7L12 2ZM2 17L12 22L22 17L12 12L2 17Z"/>
        </svg>
      );
    case 'bsc':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 12L12 8L16 12L12 16L8 12Z" fill="black"/>
        </svg>
      );
    case 'arbitrum':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L22 12L12 22L2 12L12 2ZM12 6L6 12L12 18L18 12L12 6Z"/>
        </svg>
      );
    case 'optimism':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="9" cy="9" r="2" fill="white"/>
          <circle cx="15" cy="9" r="2" fill="white"/>
          <path d="M8 15Q12 19 16 15" stroke="white" strokeWidth="2" fill="none"/>
        </svg>
      );
    case 'avalanche':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L22 20H2L12 2ZM12 8L6 18H18L12 8Z"/>
        </svg>
      );
    case 'fantom':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20Z"/>
          <path d="M12 6L8 10H16L12 6ZM8 14L12 18L16 14H8Z"/>
        </svg>
      );
    default:
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      );
  }
};

// Network configuration
const SUPPORTED_NETWORKS = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
  { id: 'bsc', name: 'BSC', symbol: 'BNB' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB' },
  { id: 'optimism', name: 'Optimism', symbol: 'OP' },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX' },
  { id: 'fantom', name: 'Fantom', symbol: 'FTM' }
];

const SwapBlock: React.FC<SwapBlockProps> = ({ tokens, onSwap }) => {
  const { toast } = useToast();

  // Get real wallet address and data
  const { address: walletAddress, wallets } = useWalletData();

  // Get real-time tokens as fallback when no user tokens are provided
  const { tokens: realTimeTokens } = useRealTimeTokens({
    autoRefresh: true,
    refreshOnMount: true
  });

  // Use provided tokens or real-time tokens with zero balances (no mock data)
  const effectiveTokens = tokens && tokens.length > 0 ? tokens : realTimeTokens.map(token => ({
    ...token,
    balance: '0' // Real-time tokens start with zero balance
  }));

  // Update addresses when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      setFromAddress(walletAddress);
      setToAddress(walletAddress);
    }
  }, [walletAddress]);

  // Available wallet addresses for selection
  const availableAddresses = useMemo(() => {
    const addresses = [];

    // Add current wallet address
    if (walletAddress) {
      addresses.push({
        address: walletAddress,
        label: 'Current Wallet',
        type: 'current'
      });
    }

    // Add other wallet addresses from user's wallets
    wallets.forEach((wallet, index) => {
      if (wallet.wallet_address && wallet.wallet_address !== walletAddress) {
        addresses.push({
          address: wallet.wallet_address,
          label: wallet.wallet_name || `Wallet ${index + 1}`,
          type: wallet.wallet_type || 'unknown'
        });
      }

      // Add addresses from generated wallets
      if (wallet.addresses) {
        Object.entries(wallet.addresses).forEach(([currency, address]) => {
          if (address && address !== walletAddress) {
            addresses.push({
              address: address as string,
              label: `${wallet.wallet_name || 'Generated'} (${currency})`,
              type: 'generated'
            });
          }
        });
      }
    });

    return addresses;
  }, [walletAddress, wallets]);

  // Format address for display
  const formatAddress = (address: string) => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'No Address';
  };

  // State management
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromNetwork, setFromNetwork] = useState(SUPPORTED_NETWORKS[0]);
  const [toNetwork, setToNetwork] = useState(SUPPORTED_NETWORKS[0]);
  const [fromAddress, setFromAddress] = useState(walletAddress);
  const [toAddress, setToAddress] = useState(walletAddress);
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
    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      setIsCalculating(true);

      // Simulate API call delay
      const timer = setTimeout(() => {
        const fromPrice = fromToken.price || 0;
        const toPrice = toToken.price || 0;

        if (fromPrice > 0 && toPrice > 0) {
          const rate = fromPrice / toPrice;
          const calculatedAmount = (parseFloat(fromAmount) * rate).toFixed(6);
          setToAmount(calculatedAmount);

          // Calculate price impact (mock calculation)
          const impact = Math.min(parseFloat(fromAmount) * 0.001, 5); // Max 5%
          setPriceImpact(impact);
        }

        setIsCalculating(false);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setToAmount('');
      setPriceImpact(0);
    }
  }, [fromToken, toToken, fromAmount]);

  // Available tokens for selection - show all tokens for both From and To
  const availableTokens = useMemo(() => {
    return effectiveTokens; // Show all tokens, not just those with balance > 0
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
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* From Panel */}
        <div className="bg-dex-tertiary p-6 rounded-xl border border-dex-secondary/30 space-y-6 min-h-[320px] flex flex-col">
          {/* From Address Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">From Address</label>
            <Select
              value={fromAddress}
              onValueChange={setFromAddress}
            >
              <SelectTrigger className="bg-dex-secondary/20 border-dex-secondary/30 text-white h-12">
                <SelectValue>
                  <span className="font-mono text-sm">{formatAddress(fromAddress)}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-dex-dark border-dex-secondary/30 z-[100] shadow-xl">
                {availableAddresses.map((addr) => (
                  <SelectItem key={addr.address} value={addr.address} className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/30 focus:text-white">
                    <div className="flex flex-col gap-1 w-full">
                      <span className="font-medium">{addr.label}</span>
                      <span className="font-mono text-xs text-dex-text-secondary">{formatAddress(addr.address)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                          Available: {formatCurrency(parseFloat(token.balance || '0'))}
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
                      <NetworkIcon network={network.id} size={16} />
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
          {/* To Address Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">To Address</label>
            <Select
              value={toAddress}
              onValueChange={setToAddress}
            >
              <SelectTrigger className="bg-dex-secondary/20 border-dex-secondary/30 text-white h-12">
                <SelectValue>
                  <span className="font-mono text-sm">{formatAddress(toAddress)}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-dex-dark border-dex-secondary/30 z-[100] shadow-xl">
                {availableAddresses.map((addr) => (
                  <SelectItem key={addr.address} value={addr.address} className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/30 focus:text-white">
                    <div className="flex flex-col gap-1 w-full">
                      <span className="font-medium">{addr.label}</span>
                      <span className="font-mono text-xs text-dex-text-secondary">{formatAddress(addr.address)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Token Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Token</label>
            <Select
              value={toToken?.symbol || ''}
              onValueChange={(value) => {
                const token = availableTokens.find(t => t.symbol === value);
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
                {availableTokens.map((token) => (
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
                      <NetworkIcon network={network.id} size={16} />
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
      {fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0 && !isCalculating && (
        <div className="bg-dex-secondary/10 rounded-xl p-4 space-y-3 text-sm border border-dex-secondary/30 mb-4">
          {/* TDS Fees */}
          <div className="flex justify-between items-center">
            <span className="text-dex-text-secondary">TDS Fees:</span>
            <span className="text-white font-medium">
              {(parseFloat(fromAmount) * 0.01).toFixed(6)} {fromToken.symbol}
            </span>
          </div>

          {/* Estimated Rate */}
          <div className="flex justify-between items-center">
            <span className="text-dex-text-secondary">Estimated Rate:</span>
            <span className="text-white font-medium">
              1 {fromToken.symbol} = {fromToken.price && toToken.price ?
                (fromToken.price / toToken.price).toFixed(6) : '0'} {toToken.symbol}
            </span>
          </div>

          {/* Cashback */}
          <div className="flex justify-between items-center">
            <span className="text-dex-text-secondary">Cashback!:</span>
            <span className="text-dex-positive font-medium">
              {(parseFloat(fromAmount) * 0.001).toFixed(6)} {fromToken.symbol}
            </span>
          </div>

          {/* Price Impact */}
          <div className="flex justify-between items-center pt-2 border-t border-dex-secondary/20">
            <span className="text-dex-text-secondary">Price Impact (24h):</span>
            <span className="text-dex-positive font-medium">
              ≈ {priceImpact > 0 ? '+' : ''}{priceImpact.toFixed(2)}%
            </span>
          </div>

          <div className="text-xs text-dex-text-secondary text-center pt-1">
            Rate is for reference only
          </div>
        </div>
      )}

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
