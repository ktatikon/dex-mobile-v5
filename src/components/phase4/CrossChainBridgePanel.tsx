/**
 * PHASE 4.3: CROSS-CHAIN BRIDGE PANEL
 * 
 * Provides cross-chain bridge functionality with comprehensive error handling
 * and fallback mechanisms following established Phase 4 patterns.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ArrowRight, Clock, Shield, Zap, TrendingUp } from 'lucide-react';
import { Token } from '@/types';
import { 
  safeCrossChainService, 
  type SupportedNetwork, 
  type BridgeQuote,
  type CrossChainTransaction,
  CrossChainTransactionStatus 
} from '@/services/phase4/crossChainService';
import ErrorBoundary from '@/components/ErrorBoundary';

interface CrossChainBridgePanelProps {
  tokens: Token[];
  onBridgeComplete?: (transaction: CrossChainTransaction) => void;
  className?: string;
}

const CrossChainBridgePanel: React.FC<CrossChainBridgePanelProps> = ({
  tokens,
  onBridgeComplete,
  className = ''
}) => {
  // State management
  const [supportedNetworks, setSupportedNetworks] = useState<SupportedNetwork[]>([]);
  const [sourceNetwork, setSourceNetwork] = useState<string>('');
  const [destinationNetwork, setDestinationNetwork] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [bridgeQuotes, setBridgeQuotes] = useState<BridgeQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<BridgeQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingQuotes, setIsGettingQuotes] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentTransaction, setCurrentTransaction] = useState<CrossChainTransaction | null>(null);

  // Load supported networks on component mount
  useEffect(() => {
    loadSupportedNetworks();
  }, []);

  // Get bridge quotes when parameters change
  useEffect(() => {
    if (sourceNetwork && destinationNetwork && selectedToken && amount && parseFloat(amount) > 0) {
      getBridgeQuotes();
    } else {
      setBridgeQuotes([]);
      setSelectedQuote(null);
    }
  }, [sourceNetwork, destinationNetwork, selectedToken, amount]);

  /**
   * Load supported networks from the service
   */
  const loadSupportedNetworks = async () => {
    try {
      const networks = await safeCrossChainService.getSupportedNetworks();
      setSupportedNetworks(networks);
      
      // Set default networks if available
      if (networks.length >= 2) {
        setSourceNetwork(networks[0].networkId);
        setDestinationNetwork(networks[1].networkId);
      }
    } catch (error) {
      console.error('Error loading supported networks:', error);
      setError('Failed to load supported networks');
    }
  };

  /**
   * Get bridge quotes for the current parameters
   */
  const getBridgeQuotes = async () => {
    if (!sourceNetwork || !destinationNetwork || !selectedToken || !amount) return;

    setIsGettingQuotes(true);
    setError('');

    try {
      const quotes = await safeCrossChainService.getBridgeQuote({
        sourceNetwork,
        destinationNetwork,
        tokenId: selectedToken,
        amount: parseFloat(amount)
      });

      setBridgeQuotes(quotes);
      
      // Auto-select the best quote (lowest cost, highest security)
      if (quotes.length > 0) {
        const bestQuote = quotes.reduce((best, current) => {
          if (current.securityScore > best.securityScore) return current;
          if (current.securityScore === best.securityScore && current.totalCostUsd < best.totalCostUsd) return current;
          return best;
        });
        setSelectedQuote(bestQuote);
      }

    } catch (error) {
      console.error('Error getting bridge quotes:', error);
      setError('Failed to get bridge quotes');
    } finally {
      setIsGettingQuotes(false);
    }
  };

  /**
   * Execute the bridge transaction
   */
  const executeBridge = async () => {
    if (!selectedQuote || !sourceNetwork || !destinationNetwork || !selectedToken || !amount) {
      setError('Please select all required parameters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const transaction = await safeCrossChainService.executeBridgeTransaction({
        userId: 'current-user', // In real app, get from auth context
        sourceNetwork,
        destinationNetwork,
        tokenId: selectedToken,
        amount: parseFloat(amount),
        bridgeProtocolId: 'selected-protocol-id', // Would be from selectedQuote
        slippageTolerance: 0.5
      });

      if (transaction) {
        setCurrentTransaction(transaction);
        onBridgeComplete?.(transaction);
        
        // Reset form
        setAmount('');
        setBridgeQuotes([]);
        setSelectedQuote(null);
      } else {
        setError('Failed to execute bridge transaction');
      }

    } catch (error) {
      console.error('Error executing bridge:', error);
      setError('Failed to execute bridge transaction');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Swap source and destination networks
   */
  const swapNetworks = () => {
    const temp = sourceNetwork;
    setSourceNetwork(destinationNetwork);
    setDestinationNetwork(temp);
  };

  /**
   * Get network display name
   */
  const getNetworkName = (networkId: string): string => {
    const network = supportedNetworks.find(n => n.networkId === networkId);
    return network?.networkName || networkId;
  };

  /**
   * Format time estimate
   */
  const formatTimeEstimate = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  /**
   * Get security score color
   */
  const getSecurityScoreColor = (score: number): string => {
    if (score >= 8) return 'text-dex-positive';
    if (score >= 6) return 'text-yellow-400';
    return 'text-dex-negative';
  };

  return (
    <ErrorBoundary>
      <Card className={`bg-dex-dark/80 border-dex-primary/30 ${className}`}>
        <CardHeader>
          <CardTitle className="text-dex-text-primary flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-dex-primary" />
            Cross-Chain Bridge
            <Badge variant="outline" className="text-xs bg-dex-primary/20 text-dex-primary border-dex-primary/30">
              Phase 4.3
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Network Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* Source Network */}
              <div className="space-y-2">
                <label className="text-sm text-dex-text-secondary">From Network</label>
                <Select value={sourceNetwork} onValueChange={setSourceNetwork}>
                  <SelectTrigger className="bg-dex-dark border-dex-primary/30">
                    <SelectValue placeholder="Select source network" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedNetworks.map((network) => (
                      <SelectItem key={network.networkId} value={network.networkId}>
                        <div className="flex items-center gap-2">
                          {network.iconUrl && (
                            <img src={network.iconUrl} alt={network.networkName} className="w-4 h-4" />
                          )}
                          {network.networkName}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={swapNetworks}
                  className="border-dex-primary/30 hover:bg-dex-primary/20"
                  disabled={!sourceNetwork || !destinationNetwork}
                >
                  ⇄
                </Button>
              </div>

              {/* Destination Network */}
              <div className="space-y-2">
                <label className="text-sm text-dex-text-secondary">To Network</label>
                <Select value={destinationNetwork} onValueChange={setDestinationNetwork}>
                  <SelectTrigger className="bg-dex-dark border-dex-primary/30">
                    <SelectValue placeholder="Select destination network" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedNetworks
                      .filter(network => network.networkId !== sourceNetwork)
                      .map((network) => (
                        <SelectItem key={network.networkId} value={network.networkId}>
                          <div className="flex items-center gap-2">
                            {network.iconUrl && (
                              <img src={network.iconUrl} alt={network.networkName} className="w-4 h-4" />
                            )}
                            {network.networkName}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Token and Amount Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-dex-text-secondary">Token</label>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger className="bg-dex-dark border-dex-primary/30">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  {tokens.map((token) => (
                    <SelectItem key={token.id} value={token.id}>
                      <div className="flex items-center gap-2">
                        {token.logoURI && (
                          <img src={token.logoURI} alt={token.symbol} className="w-4 h-4" />
                        )}
                        {token.symbol}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-dex-text-secondary">Amount</label>
              <Input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-dex-dark border-dex-primary/30"
                min="0"
                step="0.000001"
              />
            </div>
          </div>

          {/* Bridge Quotes */}
          {isGettingQuotes && (
            <div className="flex items-center justify-center py-4">
              <div className="text-dex-text-secondary">Getting bridge quotes...</div>
            </div>
          )}

          {bridgeQuotes.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-dex-text-primary">Available Routes</h4>
              <div className="space-y-2">
                {bridgeQuotes.map((quote, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedQuote === quote
                        ? 'border-dex-primary bg-dex-primary/10'
                        : 'border-dex-primary/30 hover:border-dex-primary/50'
                    }`}
                    onClick={() => setSelectedQuote(quote)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-dex-text-primary">
                          {quote.protocolName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          <span className={`text-xs ${getSecurityScoreColor(quote.securityScore)}`}>
                            {quote.securityScore}/10
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-dex-text-primary">
                          ${quote.totalCostUsd.toFixed(4)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-dex-text-secondary">
                          <Clock className="w-3 h-3" />
                          {formatTimeEstimate(quote.estimatedTimeMinutes)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-dex-negative/20 border border-dex-negative/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-dex-negative" />
              <span className="text-sm text-dex-negative">{error}</span>
            </div>
          )}

          {/* Bridge Button */}
          <Button
            onClick={executeBridge}
            disabled={!selectedQuote || isLoading || !amount || parseFloat(amount) <= 0}
            className="w-full bg-dex-primary hover:bg-dex-primary/80 text-white"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Bridging...
              </div>
            ) : (
              `Bridge ${amount} ${selectedToken || 'tokens'}`
            )}
          </Button>

          {/* Transaction Status */}
          {currentTransaction && (
            <div className="p-4 bg-dex-primary/10 border border-dex-primary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-dex-text-primary">Bridge Transaction</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    currentTransaction.status === CrossChainTransactionStatus.COMPLETED 
                      ? 'text-dex-positive border-dex-positive' 
                      : 'text-yellow-400 border-yellow-400'
                  }`}
                >
                  {currentTransaction.status}
                </Badge>
              </div>
              <div className="text-xs text-dex-text-secondary">
                {getNetworkName(currentTransaction.sourceNetworkId)} → {getNetworkName(currentTransaction.destinationNetworkId)}
              </div>
              <div className="text-xs text-dex-text-secondary">
                Amount: {currentTransaction.amount} {currentTransaction.sourceTokenId}
              </div>
              {currentTransaction.estimatedCompletionTime && (
                <div className="text-xs text-dex-text-secondary">
                  ETA: {currentTransaction.estimatedCompletionTime.toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export default CrossChainBridgePanel;
