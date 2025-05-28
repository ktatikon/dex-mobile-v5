/**
 * PHASE 4.2: DEFI INTEGRATION PANEL COMPONENT
 * 
 * Provides DeFi integration interface including live staking, yield farming,
 * and liquidity provision with comprehensive error handling and fallback mechanisms.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Token } from '@/types';
import { 
  Coins, 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3,
  Droplets,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Percent,
  Activity,
  Settings
} from 'lucide-react';

import { 
  safeDeFiIntegrationService,
  StakingPosition,
  YieldFarmingPosition,
  LiquidityPosition,
  DeFiPortfolioSummary,
  DeFiPositionStatus
} from '@/services/phase4/defiIntegrationService';
import { phase4ConfigManager } from '@/services/phase4/phase4ConfigService';

interface DeFiIntegrationPanelProps {
  tokens: Token[];
  onPositionCreate?: (position: any) => void;
}

const DeFiIntegrationPanel: React.FC<DeFiIntegrationPanelProps> = ({
  tokens,
  onPositionCreate
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State management
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [stakingAmount, setStakingAmount] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState('');
  const [autoCompound, setAutoCompound] = useState(true);
  
  // Yield farming state
  const [tokenA, setTokenA] = useState<Token | null>(null);
  const [tokenB, setTokenB] = useState<Token | null>(null);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [farmingProtocol, setFarmingProtocol] = useState('');
  const [strategyType, setStrategyType] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  
  // Liquidity provision state
  const [liquidityTokenA, setLiquidityTokenA] = useState<Token | null>(null);
  const [liquidityTokenB, setLiquidityTokenB] = useState<Token | null>(null);
  const [liquidityAmountA, setLiquidityAmountA] = useState('');
  const [liquidityAmountB, setLiquidityAmountB] = useState('');
  const [feeTier, setFeeTier] = useState('0.3');
  const [ammProtocol, setAmmProtocol] = useState('');
  
  // UI state
  const [activeTab, setActiveTab] = useState('staking');
  const [isLoading, setIsLoading] = useState(false);
  const [portfolioSummary, setPortfolioSummary] = useState<DeFiPortfolioSummary | null>(null);
  const [userPositions, setUserPositions] = useState<{
    staking: StakingPosition[];
    yieldFarming: YieldFarmingPosition[];
    liquidity: LiquidityPosition[];
  }>({ staking: [], yieldFarming: [], liquidity: [] });
  const [defiEnabled, setDefiEnabled] = useState(false);

  // Check DeFi availability
  useEffect(() => {
    const config = phase4ConfigManager.getConfig();
    setDefiEnabled(
      config.enableLiveStaking || 
      config.enableYieldFarming || 
      config.enableLiquidityProvision
    );
    
    // Subscribe to config changes
    const unsubscribe = phase4ConfigManager.subscribe((newConfig) => {
      setDefiEnabled(
        newConfig.enableLiveStaking || 
        newConfig.enableYieldFarming || 
        newConfig.enableLiquidityProvision
      );
    });

    return unsubscribe;
  }, []);

  // Load user data
  useEffect(() => {
    if (user && defiEnabled) {
      loadUserDeFiData();
    }
  }, [user, defiEnabled]);

  const loadUserDeFiData = async () => {
    if (!user) return;

    try {
      const [summary, positions] = await Promise.all([
        safeDeFiIntegrationService.getDeFiPortfolioSummary(user.id),
        safeDeFiIntegrationService.getUserDeFiPositions(user.id)
      ]);

      setPortfolioSummary(summary);
      setUserPositions(positions || { staking: [], yieldFarming: [], liquidity: [] });
    } catch (error) {
      console.error('Error loading DeFi data:', error);
    }
  };

  const handleCreateStakingPosition = async () => {
    if (!user || !selectedToken || !stakingAmount || !selectedProtocol) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const position = await safeDeFiIntegrationService.createStakingPosition({
        userId: user.id,
        protocol: selectedProtocol,
        tokenId: selectedToken.id,
        amount: stakingAmount,
        autoCompound
      });

      if (position) {
        toast({
          title: "Success",
          description: `Staking position created successfully`,
          variant: "default",
        });
        
        // Reset form
        setStakingAmount('');
        setSelectedProtocol('');
        
        // Reload data
        await loadUserDeFiData();
        
        // Notify parent
        onPositionCreate?.(position);
      } else {
        throw new Error('Failed to create staking position');
      }

    } catch (error) {
      console.error('Error creating staking position:', error);
      toast({
        title: "Error",
        description: "Failed to create staking position. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateYieldFarmingPosition = async () => {
    if (!user || !tokenA || !tokenB || !amountA || !amountB || !farmingProtocol) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const position = await safeDeFiIntegrationService.createYieldFarmingPosition({
        userId: user.id,
        protocol: farmingProtocol,
        poolName: `${tokenA.symbol}-${tokenB.symbol}`,
        tokenAId: tokenA.id,
        tokenBId: tokenB.id,
        tokenAAmount: amountA,
        tokenBAmount: amountB,
        strategyType,
        autoReinvest: true
      });

      if (position) {
        toast({
          title: "Success",
          description: `Yield farming position created successfully`,
          variant: "default",
        });
        
        setAmountA('');
        setAmountB('');
        setFarmingProtocol('');
        await loadUserDeFiData();
        onPositionCreate?.(position);
      } else {
        throw new Error('Failed to create yield farming position');
      }

    } catch (error) {
      console.error('Error creating yield farming position:', error);
      toast({
        title: "Error",
        description: "Failed to create yield farming position. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLiquidityPosition = async () => {
    if (!user || !liquidityTokenA || !liquidityTokenB || !liquidityAmountA || !liquidityAmountB || !ammProtocol) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const position = await safeDeFiIntegrationService.createLiquidityPosition({
        userId: user.id,
        ammProtocol,
        tokenAId: liquidityTokenA.id,
        tokenBId: liquidityTokenB.id,
        tokenAAmount: liquidityAmountA,
        tokenBAmount: liquidityAmountB,
        feeTier: parseFloat(feeTier),
        autoCompoundFees: true
      });

      if (position) {
        toast({
          title: "Success",
          description: `Liquidity position created successfully`,
          variant: "default",
        });
        
        setLiquidityAmountA('');
        setLiquidityAmountB('');
        setAmmProtocol('');
        await loadUserDeFiData();
        onPositionCreate?.(position);
      } else {
        throw new Error('Failed to create liquidity position');
      }

    } catch (error) {
      console.error('Error creating liquidity position:', error);
      toast({
        title: "Error",
        description: "Failed to create liquidity position. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionStatusIcon = (status: DeFiPositionStatus) => {
    switch (status) {
      case DeFiPositionStatus.ACTIVE:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case DeFiPositionStatus.PAUSED:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case DeFiPositionStatus.UNSTAKING:
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPositionStatusColor = (status: DeFiPositionStatus) => {
    switch (status) {
      case DeFiPositionStatus.ACTIVE:
        return 'bg-green-500';
      case DeFiPositionStatus.PAUSED:
        return 'bg-yellow-500';
      case DeFiPositionStatus.UNSTAKING:
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  // DeFi disabled fallback UI
  if (!defiEnabled) {
    return (
      <Card className="bg-dex-dark/80 border-dex-primary/30">
        <CardHeader>
          <CardTitle className="text-dex-text-primary flex items-center gap-2">
            <Coins className="h-5 w-5" />
            DeFi Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Zap className="h-12 w-12 text-dex-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dex-text-primary mb-2">
              DeFi Integration Features
            </h3>
            <p className="text-dex-text-secondary mb-4">
              Live staking, yield farming, and liquidity provision features are currently disabled.
            </p>
            <Badge variant="outline" className="text-dex-text-secondary">
              Phase 4.2 Features Coming Soon
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      {portfolioSummary && (
        <Card className="bg-dex-dark/80 border-dex-primary/30">
          <CardHeader>
            <CardTitle className="text-dex-text-primary flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              DeFi Portfolio Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-dex-text-primary">
                  ${parseFloat(portfolioSummary.totalStakedValue).toFixed(2)}
                </div>
                <div className="text-sm text-dex-text-secondary">Total Staked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-dex-text-primary">
                  ${parseFloat(portfolioSummary.totalFarmingValue).toFixed(2)}
                </div>
                <div className="text-sm text-dex-text-secondary">Yield Farming</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-dex-text-primary">
                  ${parseFloat(portfolioSummary.totalLiquidityValue).toFixed(2)}
                </div>
                <div className="text-sm text-dex-text-secondary">Liquidity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-dex-positive">
                  {portfolioSummary.averageApy.toFixed(2)}%
                </div>
                <div className="text-sm text-dex-text-secondary">Avg APY</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DeFi Integration Interface */}
      <Card className="bg-dex-dark/80 border-dex-primary/30">
        <CardHeader>
          <CardTitle className="text-dex-text-primary flex items-center gap-2">
            <Coins className="h-5 w-5" />
            DeFi Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="staking">Live Staking</TabsTrigger>
              <TabsTrigger value="farming">Yield Farming</TabsTrigger>
              <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
            </TabsList>

            {/* Live Staking Tab */}
            <TabsContent value="staking" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="staking-amount">Amount to Stake</Label>
                  <Input
                    id="staking-amount"
                    type="number"
                    placeholder="0.00"
                    value={stakingAmount}
                    onChange={(e) => setStakingAmount(e.target.value)}
                    className="bg-dex-secondary border-dex-primary/30"
                  />
                </div>
                <div>
                  <Label htmlFor="staking-protocol">Protocol</Label>
                  <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
                    <SelectTrigger className="bg-dex-secondary border-dex-primary/30">
                      <SelectValue placeholder="Select protocol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ethereum_2_0">Ethereum 2.0 (4.5% APY)</SelectItem>
                      <SelectItem value="polygon_staking">Polygon (8.2% APY)</SelectItem>
                      <SelectItem value="cardano_staking">Cardano (5.1% APY)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-dex-secondary/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-dex-primary" />
                  <span className="text-sm font-medium text-dex-text-primary">Staking Benefits</span>
                </div>
                <ul className="text-xs text-dex-text-secondary space-y-1">
                  <li>• Earn rewards while securing the network</li>
                  <li>• Automatic compound interest when enabled</li>
                  <li>• Multi-validator distribution for risk management</li>
                  <li>• Real-time reward tracking and analytics</li>
                </ul>
              </div>

              <Button
                onClick={handleCreateStakingPosition}
                disabled={isLoading || !selectedToken || !stakingAmount || !selectedProtocol}
                className="w-full bg-dex-primary hover:bg-dex-primary/90"
              >
                {isLoading ? 'Creating...' : 'Start Staking'}
              </Button>
            </TabsContent>

            {/* Yield Farming Tab */}
            <TabsContent value="farming" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="farming-amount-a">Token A Amount</Label>
                  <Input
                    id="farming-amount-a"
                    type="number"
                    placeholder="0.00"
                    value={amountA}
                    onChange={(e) => setAmountA(e.target.value)}
                    className="bg-dex-secondary border-dex-primary/30"
                  />
                </div>
                <div>
                  <Label htmlFor="farming-amount-b">Token B Amount</Label>
                  <Input
                    id="farming-amount-b"
                    type="number"
                    placeholder="0.00"
                    value={amountB}
                    onChange={(e) => setAmountB(e.target.value)}
                    className="bg-dex-secondary border-dex-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="farming-protocol">Protocol</Label>
                  <Select value={farmingProtocol} onValueChange={setFarmingProtocol}>
                    <SelectTrigger className="bg-dex-secondary border-dex-primary/30">
                      <SelectValue placeholder="Select protocol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compound_v3">Compound V3 (12.5% APY)</SelectItem>
                      <SelectItem value="aave_v3">Aave V3 (10.8% APY)</SelectItem>
                      <SelectItem value="curve_finance">Curve Finance (15.2% APY)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="strategy-type">Strategy</Label>
                  <Select value={strategyType} onValueChange={(value: any) => setStrategyType(value)}>
                    <SelectTrigger className="bg-dex-secondary border-dex-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-dex-secondary/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-dex-positive" />
                  <span className="text-sm font-medium text-dex-text-primary">Yield Optimization</span>
                </div>
                <ul className="text-xs text-dex-text-secondary space-y-1">
                  <li>• Automated yield farming strategies</li>
                  <li>• Impermanent loss protection mechanisms</li>
                  <li>• Cross-protocol yield comparison</li>
                  <li>• Automatic reward reinvestment</li>
                </ul>
              </div>

              <Button
                onClick={handleCreateYieldFarmingPosition}
                disabled={isLoading || !tokenA || !tokenB || !amountA || !amountB}
                className="w-full bg-dex-positive hover:bg-dex-positive/90"
              >
                {isLoading ? 'Creating...' : 'Start Yield Farming'}
              </Button>
            </TabsContent>

            {/* Liquidity Provision Tab */}
            <TabsContent value="liquidity" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="liquidity-amount-a">Token A Amount</Label>
                  <Input
                    id="liquidity-amount-a"
                    type="number"
                    placeholder="0.00"
                    value={liquidityAmountA}
                    onChange={(e) => setLiquidityAmountA(e.target.value)}
                    className="bg-dex-secondary border-dex-primary/30"
                  />
                </div>
                <div>
                  <Label htmlFor="liquidity-amount-b">Token B Amount</Label>
                  <Input
                    id="liquidity-amount-b"
                    type="number"
                    placeholder="0.00"
                    value={liquidityAmountB}
                    onChange={(e) => setLiquidityAmountB(e.target.value)}
                    className="bg-dex-secondary border-dex-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amm-protocol">AMM Protocol</Label>
                  <Select value={ammProtocol} onValueChange={setAmmProtocol}>
                    <SelectTrigger className="bg-dex-secondary border-dex-primary/30">
                      <SelectValue placeholder="Select AMM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uniswap_v3">Uniswap V3</SelectItem>
                      <SelectItem value="sushiswap">SushiSwap</SelectItem>
                      <SelectItem value="pancakeswap">PancakeSwap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fee-tier">Fee Tier</Label>
                  <Select value={feeTier} onValueChange={setFeeTier}>
                    <SelectTrigger className="bg-dex-secondary border-dex-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.05">0.05%</SelectItem>
                      <SelectItem value="0.3">0.3%</SelectItem>
                      <SelectItem value="1.0">1.0%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-dex-secondary/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="h-4 w-4 text-dex-primary" />
                  <span className="text-sm font-medium text-dex-text-primary">Liquidity Benefits</span>
                </div>
                <ul className="text-xs text-dex-text-secondary space-y-1">
                  <li>• Earn trading fees from all swaps</li>
                  <li>• Automated fee collection and reinvestment</li>
                  <li>• Pool performance analytics and monitoring</li>
                  <li>• Concentrated liquidity for higher efficiency</li>
                </ul>
              </div>

              <Button
                onClick={handleCreateLiquidityPosition}
                disabled={isLoading || !liquidityTokenA || !liquidityTokenB}
                className="w-full bg-dex-primary hover:bg-dex-primary/90"
              >
                {isLoading ? 'Creating...' : 'Provide Liquidity'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Active Positions Display */}
      {(userPositions.staking.length > 0 || userPositions.yieldFarming.length > 0 || userPositions.liquidity.length > 0) && (
        <Card className="bg-dex-dark/80 border-dex-primary/30">
          <CardHeader>
            <CardTitle className="text-dex-text-primary">Active DeFi Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Staking Positions */}
              {userPositions.staking.map((position) => (
                <div key={position.id} className="flex items-center justify-between p-3 bg-dex-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPositionStatusIcon(position.status)}
                    <div>
                      <div className="text-sm font-medium text-dex-text-primary">
                        STAKING - {position.protocol.toUpperCase()}
                      </div>
                      <div className="text-xs text-dex-text-secondary">
                        {position.stakedAmount} {position.tokenId} • {position.apy}% APY
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-dex-positive">
                      +{position.currentRewards} rewards
                    </div>
                    <Badge className={getPositionStatusColor(position.status)}>
                      {position.status}
                    </Badge>
                  </div>
                </div>
              ))}

              {/* Yield Farming Positions */}
              {userPositions.yieldFarming.map((position) => (
                <div key={position.id} className="flex items-center justify-between p-3 bg-dex-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPositionStatusIcon(position.status)}
                    <div>
                      <div className="text-sm font-medium text-dex-text-primary">
                        FARMING - {position.poolName}
                      </div>
                      <div className="text-xs text-dex-text-secondary">
                        {position.tokenAAmount} {position.tokenAId} + {position.tokenBAmount} {position.tokenBId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-dex-positive">
                      {position.currentApy}% APY
                    </div>
                    <Badge className={getPositionStatusColor(position.status)}>
                      {position.status}
                    </Badge>
                  </div>
                </div>
              ))}

              {/* Liquidity Positions */}
              {userPositions.liquidity.map((position) => (
                <div key={position.id} className="flex items-center justify-between p-3 bg-dex-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPositionStatusIcon(position.status)}
                    <div>
                      <div className="text-sm font-medium text-dex-text-primary">
                        LIQUIDITY - {position.tokenAId}/{position.tokenBId}
                      </div>
                      <div className="text-xs text-dex-text-secondary">
                        {position.feeTier}% fee tier • ${position.totalValueUsd} TVL
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-dex-positive">
                      +${(parseFloat(position.feesEarnedA) + parseFloat(position.feesEarnedB)).toFixed(2)} fees
                    </div>
                    <Badge className={getPositionStatusColor(position.status)}>
                      {position.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DeFiIntegrationPanel;
