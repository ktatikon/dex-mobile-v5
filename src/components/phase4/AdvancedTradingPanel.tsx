/**
 * PHASE 4: ADVANCED TRADING PANEL COMPONENT
 * 
 * Provides advanced trading interface including limit orders, stop-loss, take-profit,
 * and DCA automation with comprehensive error handling and fallback mechanisms.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Token } from '@/types';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Settings
} from 'lucide-react';

import { 
  safeAdvancedTradingService,
  AdvancedOrder,
  DCAStrategy,
  AdvancedOrderType,
  OrderStatus 
} from '@/services/phase4/advancedTradingService';
import { phase4ConfigManager } from '@/services/phase4/phase4ConfigService';

interface AdvancedTradingPanelProps {
  tokens: Token[];
  selectedFromToken?: Token;
  selectedToToken?: Token;
  onTokenSelect?: (fromToken: Token, toToken: Token) => void;
}

const AdvancedTradingPanel: React.FC<AdvancedTradingPanelProps> = ({
  tokens,
  selectedFromToken,
  selectedToToken,
  onTokenSelect
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State management
  const [fromToken, setFromToken] = useState<Token | null>(selectedFromToken || null);
  const [toToken, setToToken] = useState<Token | null>(selectedToToken || null);
  const [fromAmount, setFromAmount] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [expirationHours, setExpirationHours] = useState('24');
  
  // DCA specific state
  const [dcaTotalAmount, setDcaTotalAmount] = useState('');
  const [dcaIntervalHours, setDcaIntervalHours] = useState('24');
  const [dcaTotalIntervals, setDcaTotalIntervals] = useState('10');
  
  // UI state
  const [activeTab, setActiveTab] = useState('limit');
  const [isLoading, setIsLoading] = useState(false);
  const [userOrders, setUserOrders] = useState<AdvancedOrder[]>([]);
  const [userDCAStrategies, setUserDCAStrategies] = useState<DCAStrategy[]>([]);
  const [phase4Enabled, setPhase4Enabled] = useState(false);

  // Check Phase 4 availability
  useEffect(() => {
    const config = phase4ConfigManager.getConfig();
    setPhase4Enabled(config.enableAdvancedTrading);
    
    // Subscribe to config changes
    const unsubscribe = phase4ConfigManager.subscribe((newConfig) => {
      setPhase4Enabled(newConfig.enableAdvancedTrading);
    });

    return unsubscribe;
  }, []);

  // Load user orders and strategies
  useEffect(() => {
    if (user && phase4Enabled) {
      loadUserData();
    }
  }, [user, phase4Enabled]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // This would be implemented to load user's orders and strategies
      // For now, we'll use empty arrays as fallback
      setUserOrders([]);
      setUserDCAStrategies([]);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleCreateLimitOrder = async () => {
    if (!user || !fromToken || !toToken || !fromAmount || !targetPrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const order = await safeAdvancedTradingService.createLimitOrder({
        userId: user.id,
        fromToken,
        toToken,
        fromAmount,
        targetPrice: parseFloat(targetPrice),
        slippage: parseFloat(slippage),
        expirationHours: parseFloat(expirationHours)
      });

      if (order) {
        toast({
          title: "Success",
          description: `Limit order created successfully`,
          variant: "default",
        });
        
        // Reset form
        setFromAmount('');
        setTargetPrice('');
        
        // Reload user data
        await loadUserData();
      } else {
        throw new Error('Failed to create limit order');
      }

    } catch (error) {
      console.error('Error creating limit order:', error);
      toast({
        title: "Error",
        description: "Failed to create limit order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStopLoss = async () => {
    if (!user || !fromToken || !toToken || !fromAmount || !stopPrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const order = await safeAdvancedTradingService.createStopLossOrder({
        userId: user.id,
        fromToken,
        toToken,
        fromAmount,
        stopPrice: parseFloat(stopPrice),
        slippage: parseFloat(slippage)
      });

      if (order) {
        toast({
          title: "Success",
          description: `Stop-loss order created successfully`,
          variant: "default",
        });
        
        setFromAmount('');
        setStopPrice('');
        await loadUserData();
      } else {
        throw new Error('Failed to create stop-loss order');
      }

    } catch (error) {
      console.error('Error creating stop-loss order:', error);
      toast({
        title: "Error",
        description: "Failed to create stop-loss order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDCAStrategy = async () => {
    if (!user || !fromToken || !toToken || !dcaTotalAmount || !dcaIntervalHours || !dcaTotalIntervals) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const strategy = await safeAdvancedTradingService.createDCAStrategy({
        userId: user.id,
        fromToken,
        toToken,
        totalAmount: dcaTotalAmount,
        intervalHours: parseFloat(dcaIntervalHours),
        totalIntervals: parseInt(dcaTotalIntervals)
      });

      if (strategy) {
        toast({
          title: "Success",
          description: `DCA strategy created successfully`,
          variant: "default",
        });
        
        setDcaTotalAmount('');
        setDcaIntervalHours('24');
        setDcaTotalIntervals('10');
        await loadUserData();
      } else {
        throw new Error('Failed to create DCA strategy');
      }

    } catch (error) {
      console.error('Error creating DCA strategy:', error);
      toast({
        title: "Error",
        description: "Failed to create DCA strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.ACTIVE:
        return <Clock className="h-4 w-4 text-blue-500" />;
      case OrderStatus.FILLED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case OrderStatus.CANCELLED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case OrderStatus.EXPIRED:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOrderStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.ACTIVE:
        return 'bg-blue-500';
      case OrderStatus.FILLED:
        return 'bg-green-500';
      case OrderStatus.CANCELLED:
        return 'bg-red-500';
      case OrderStatus.EXPIRED:
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Phase 4 disabled fallback UI
  if (!phase4Enabled) {
    return (
      <Card className="bg-dex-dark/80 border-dex-primary/30">
        <CardHeader>
          <CardTitle className="text-dex-text-primary flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Trading
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-dex-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dex-text-primary mb-2">
              Advanced Trading Features
            </h3>
            <p className="text-dex-text-secondary mb-4">
              Advanced trading features including limit orders, stop-loss, and DCA automation are currently disabled.
            </p>
            <Badge variant="outline" className="text-dex-text-secondary">
              Phase 4 Features Coming Soon
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Advanced Trading Interface */}
      <Card className="bg-dex-dark/80 border-dex-primary/30">
        <CardHeader>
          <CardTitle className="text-dex-text-primary flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Advanced Trading
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="limit">Limit Orders</TabsTrigger>
              <TabsTrigger value="stop">Stop-Loss</TabsTrigger>
              <TabsTrigger value="dca">DCA Strategy</TabsTrigger>
            </TabsList>

            {/* Limit Orders Tab */}
            <TabsContent value="limit" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="limit-amount">Amount</Label>
                  <Input
                    id="limit-amount"
                    type="number"
                    placeholder="0.00"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="bg-dex-secondary border-dex-primary/30"
                  />
                </div>
                <div>
                  <Label htmlFor="target-price">Target Price</Label>
                  <Input
                    id="target-price"
                    type="number"
                    placeholder="0.00"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="bg-dex-secondary border-dex-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="slippage">Slippage (%)</Label>
                  <Select value={slippage} onValueChange={setSlippage}>
                    <SelectTrigger className="bg-dex-secondary border-dex-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.1">0.1%</SelectItem>
                      <SelectItem value="0.5">0.5%</SelectItem>
                      <SelectItem value="1.0">1.0%</SelectItem>
                      <SelectItem value="2.0">2.0%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expiration">Expiration (Hours)</Label>
                  <Select value={expirationHours} onValueChange={setExpirationHours}>
                    <SelectTrigger className="bg-dex-secondary border-dex-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Hour</SelectItem>
                      <SelectItem value="6">6 Hours</SelectItem>
                      <SelectItem value="24">24 Hours</SelectItem>
                      <SelectItem value="168">1 Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleCreateLimitOrder}
                disabled={isLoading || !fromToken || !toToken}
                className="w-full bg-dex-primary hover:bg-dex-primary/90"
              >
                {isLoading ? 'Creating...' : 'Create Limit Order'}
              </Button>
            </TabsContent>

            {/* Stop-Loss Tab */}
            <TabsContent value="stop" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stop-amount">Amount</Label>
                  <Input
                    id="stop-amount"
                    type="number"
                    placeholder="0.00"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="bg-dex-secondary border-dex-primary/30"
                  />
                </div>
                <div>
                  <Label htmlFor="stop-price">Stop Price</Label>
                  <Input
                    id="stop-price"
                    type="number"
                    placeholder="0.00"
                    value={stopPrice}
                    onChange={(e) => setStopPrice(e.target.value)}
                    className="bg-dex-secondary border-dex-primary/30"
                  />
                </div>
              </div>

              <div className="bg-dex-secondary/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-dex-primary" />
                  <span className="text-sm font-medium text-dex-text-primary">Risk Protection</span>
                </div>
                <p className="text-xs text-dex-text-secondary">
                  Stop-loss orders help protect your investment by automatically selling when the price drops below your specified level.
                </p>
              </div>

              <Button
                onClick={handleCreateStopLoss}
                disabled={isLoading || !fromToken || !toToken}
                className="w-full bg-dex-negative hover:bg-dex-negative/90"
              >
                {isLoading ? 'Creating...' : 'Create Stop-Loss Order'}
              </Button>
            </TabsContent>

            {/* DCA Strategy Tab */}
            <TabsContent value="dca" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dca-total">Total Amount</Label>
                  <Input
                    id="dca-total"
                    type="number"
                    placeholder="0.00"
                    value={dcaTotalAmount}
                    onChange={(e) => setDcaTotalAmount(e.target.value)}
                    className="bg-dex-secondary border-dex-primary/30"
                  />
                </div>
                <div>
                  <Label htmlFor="dca-intervals">Total Intervals</Label>
                  <Input
                    id="dca-intervals"
                    type="number"
                    placeholder="10"
                    value={dcaTotalIntervals}
                    onChange={(e) => setDcaTotalIntervals(e.target.value)}
                    className="bg-dex-secondary border-dex-primary/30"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dca-interval">Interval (Hours)</Label>
                <Select value={dcaIntervalHours} onValueChange={setDcaIntervalHours}>
                  <SelectTrigger className="bg-dex-secondary border-dex-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Every Hour</SelectItem>
                    <SelectItem value="6">Every 6 Hours</SelectItem>
                    <SelectItem value="24">Daily</SelectItem>
                    <SelectItem value="168">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dcaTotalAmount && dcaTotalIntervals && (
                <div className="bg-dex-secondary/50 p-4 rounded-lg">
                  <div className="text-sm text-dex-text-secondary">
                    <div>Amount per interval: {(parseFloat(dcaTotalAmount) / parseInt(dcaTotalIntervals)).toFixed(4)} {fromToken?.symbol}</div>
                    <div>Duration: {(parseInt(dcaTotalIntervals) * parseFloat(dcaIntervalHours) / 24).toFixed(1)} days</div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleCreateDCAStrategy}
                disabled={isLoading || !fromToken || !toToken}
                className="w-full bg-dex-positive hover:bg-dex-positive/90"
              >
                {isLoading ? 'Creating...' : 'Create DCA Strategy'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Active Orders Display */}
      {userOrders.length > 0 && (
        <Card className="bg-dex-dark/80 border-dex-primary/30">
          <CardHeader>
            <CardTitle className="text-dex-text-primary">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-dex-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getOrderStatusIcon(order.status)}
                    <div>
                      <div className="text-sm font-medium text-dex-text-primary">
                        {order.orderType.toUpperCase()} - {order.fromToken.symbol} → {order.toToken.symbol}
                      </div>
                      <div className="text-xs text-dex-text-secondary">
                        {order.fromAmount} {order.fromToken.symbol} @ ${order.targetPrice}
                      </div>
                    </div>
                  </div>
                  <Badge className={getOrderStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedTradingPanel;
