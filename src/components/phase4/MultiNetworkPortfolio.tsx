/**
 * PHASE 4.3: MULTI-NETWORK PORTFOLIO COMPONENT
 * 
 * Displays unified portfolio view across all supported networks
 * with comprehensive error handling and fallback mechanisms.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Network, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  Shield,
  Clock
} from 'lucide-react';
import { 
  safeCrossChainService, 
  type MultiNetworkPortfolioSummary,
  type SupportedNetwork,
  type NetworkGasData
} from '@/services/phase4/crossChainService';
import ErrorBoundary from '@/components/ErrorBoundary';

interface MultiNetworkPortfolioProps {
  userId: string;
  className?: string;
}

const MultiNetworkPortfolio: React.FC<MultiNetworkPortfolioProps> = ({
  userId,
  className = ''
}) => {
  // State management
  const [portfolioSummary, setPortfolioSummary] = useState<MultiNetworkPortfolioSummary | null>(null);
  const [supportedNetworks, setSupportedNetworks] = useState<SupportedNetwork[]>([]);
  const [gasData, setGasData] = useState<Record<string, NetworkGasData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  // Load data on component mount
  useEffect(() => {
    loadPortfolioData();
  }, [userId]);

  /**
   * Load all portfolio data
   */
  const loadPortfolioData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Load portfolio summary
      const summary = await safeCrossChainService.getMultiNetworkPortfolio(userId);
      setPortfolioSummary(summary);

      // Load supported networks
      const networks = await safeCrossChainService.getSupportedNetworks();
      setSupportedNetworks(networks);

      // Load gas data for each network
      const gasDataPromises = networks.map(async (network) => {
        const gas = await safeCrossChainService.getNetworkGasRecommendations(network.networkId);
        return { networkId: network.networkId, gasData: gas };
      });

      const gasResults = await Promise.all(gasDataPromises);
      const gasMap: Record<string, NetworkGasData> = {};
      gasResults.forEach(({ networkId, gasData }) => {
        if (gasData) gasMap[networkId] = gasData;
      });
      setGasData(gasMap);

    } catch (error) {
      console.error('Error loading portfolio data:', error);
      setError('Failed to load portfolio data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Format currency value
   */
  const formatCurrency = (value: string | number): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  };

  /**
   * Get network icon
   */
  const getNetworkIcon = (networkId: string): string => {
    const network = supportedNetworks.find(n => n.networkId === networkId);
    return network?.iconUrl || '/icons/default-network.svg';
  };

  /**
   * Get network name
   */
  const getNetworkName = (networkId: string): string => {
    const network = supportedNetworks.find(n => n.networkId === networkId);
    return network?.networkName || networkId;
  };

  /**
   * Get congestion level color
   */
  const getCongestionColor = (level: string): string => {
    switch (level) {
      case 'low': return 'text-dex-positive';
      case 'normal': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'extreme': return 'text-dex-negative';
      default: return 'text-dex-text-secondary';
    }
  };

  /**
   * Get congestion level icon
   */
  const getCongestionIcon = (level: string) => {
    switch (level) {
      case 'low': return <TrendingDown className="w-3 h-3" />;
      case 'normal': return <Zap className="w-3 h-3" />;
      case 'high': return <TrendingUp className="w-3 h-3" />;
      case 'extreme': return <ArrowUpRight className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={`bg-dex-dark/80 border-dex-primary/30 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-dex-primary/30 border-t-dex-primary rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-dex-dark/80 border-dex-primary/30 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-dex-negative">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <Card className={`bg-dex-dark/80 border-dex-primary/30 ${className}`}>
        <CardHeader>
          <CardTitle className="text-dex-text-primary flex items-center gap-2">
            <Network className="w-5 h-5 text-dex-primary" />
            Multi-Network Portfolio
            <Badge variant="outline" className="text-xs bg-dex-primary/20 text-dex-primary border-dex-primary/30">
              Phase 4.3
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-dex-dark/50">
              <TabsTrigger value="overview" className="data-[state=active]:bg-dex-primary/20">
                Overview
              </TabsTrigger>
              <TabsTrigger value="networks" className="data-[state=active]:bg-dex-primary/20">
                Networks
              </TabsTrigger>
              <TabsTrigger value="gas" className="data-[state=active]:bg-dex-primary/20">
                Gas Tracker
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              {portfolioSummary && (
                <>
                  {/* Portfolio Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-dex-dark/50 border-dex-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-dex-primary" />
                          <span className="text-sm text-dex-text-secondary">Total Value</span>
                        </div>
                        <div className="text-xl font-bold text-dex-text-primary">
                          {formatCurrency(portfolioSummary.totalPortfolioValue)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-dex-dark/50 border-dex-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Network className="w-4 h-4 text-dex-primary" />
                          <span className="text-sm text-dex-text-secondary">Networks</span>
                        </div>
                        <div className="text-xl font-bold text-dex-text-primary">
                          {portfolioSummary.networkCount}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-dex-dark/50 border-dex-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowUpRight className="w-4 h-4 text-dex-primary" />
                          <span className="text-sm text-dex-text-secondary">Bridges</span>
                        </div>
                        <div className="text-xl font-bold text-dex-text-primary">
                          {portfolioSummary.crossChainTransactionsCount}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-dex-dark/50 border-dex-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown className="w-4 h-4 text-dex-negative" />
                          <span className="text-sm text-dex-text-secondary">Bridge Fees</span>
                        </div>
                        <div className="text-xl font-bold text-dex-text-primary">
                          {formatCurrency(portfolioSummary.totalBridgeFeesPaid)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Network Distribution */}
                  <Card className="bg-dex-dark/50 border-dex-primary/20">
                    <CardHeader>
                      <CardTitle className="text-sm text-dex-text-primary">Network Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(portfolioSummary.networkDistribution).map(([networkId, percentage]) => (
                        <div key={networkId} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img 
                                src={getNetworkIcon(networkId)} 
                                alt={networkId} 
                                className="w-4 h-4" 
                              />
                              <span className="text-sm text-dex-text-primary">
                                {getNetworkName(networkId)}
                              </span>
                            </div>
                            <span className="text-sm text-dex-text-secondary">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                          <Progress 
                            value={percentage} 
                            className="h-2 bg-dex-dark"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Networks Tab */}
            <TabsContent value="networks" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supportedNetworks.map((network) => (
                  <Card key={network.networkId} className="bg-dex-dark/50 border-dex-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {network.iconUrl && (
                          <img src={network.iconUrl} alt={network.networkName} className="w-6 h-6" />
                        )}
                        <div>
                          <div className="font-medium text-dex-text-primary">{network.networkName}</div>
                          <div className="text-xs text-dex-text-secondary">{network.networkType}</div>
                        </div>
                        <div className="ml-auto">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              network.bridgeEnabled 
                                ? 'text-dex-positive border-dex-positive' 
                                : 'text-dex-text-secondary border-dex-text-secondary'
                            }`}
                          >
                            {network.bridgeEnabled ? 'Bridge Ready' : 'No Bridge'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-dex-text-secondary">Chain ID:</span>
                          <div className="text-dex-text-primary">{network.chainId}</div>
                        </div>
                        <div>
                          <span className="text-dex-text-secondary">Block Time:</span>
                          <div className="text-dex-text-primary">{network.blockTimeSeconds}s</div>
                        </div>
                        <div>
                          <span className="text-dex-text-secondary">Native Token:</span>
                          <div className="text-dex-text-primary">{network.nativeTokenSymbol}</div>
                        </div>
                        <div>
                          <span className="text-dex-text-secondary">EIP-1559:</span>
                          <div className="text-dex-text-primary">
                            {network.supportsEip1559 ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Gas Tracker Tab */}
            <TabsContent value="gas" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(gasData).map(([networkId, gas]) => (
                  <Card key={networkId} className="bg-dex-dark/50 border-dex-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <img src={getNetworkIcon(networkId)} alt={networkId} className="w-5 h-5" />
                        <div className="font-medium text-dex-text-primary">
                          {getNetworkName(networkId)}
                        </div>
                        <div className="ml-auto flex items-center gap-1">
                          {getCongestionIcon(gas.networkCongestionLevel)}
                          <span className={`text-xs ${getCongestionColor(gas.networkCongestionLevel)}`}>
                            {gas.networkCongestionLevel}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-dex-text-secondary">Standard:</span>
                          <span className="text-dex-text-primary">{gas.gasPriceGwei} gwei</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-dex-text-secondary">Fast:</span>
                          <span className="text-dex-text-primary">{gas.gasPriceFastGwei} gwei</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-dex-text-secondary">Slow:</span>
                          <span className="text-dex-text-primary">{gas.gasPriceSlowGwei} gwei</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export default MultiNetworkPortfolio;
