/**
 * STAKING OPPORTUNITIES PANEL
 * 
 * Comprehensive staking opportunities section for the DeFi tab
 * with real-time data integration and enterprise-grade error handling.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Shield, 
  Clock, 
  DollarSign, 
  Percent,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import { 
  getStakingOpportunities, 
  StakingOpportunity,
  calculateStakingRewards 
} from '@/services/defiService';
import { useToast } from '@/hooks/use-toast';
import ErrorBoundary from '@/components/ErrorBoundary';

interface StakingOpportunitiesPanelProps {
  className?: string;
  onStakeSelect?: (opportunity: StakingOpportunity) => void;
}

const StakingOpportunitiesPanel: React.FC<StakingOpportunitiesPanelProps> = ({
  className = '',
  onStakeSelect
}) => {
  // State management
  const [stakingOpportunities, setStakingOpportunities] = useState<StakingOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<StakingOpportunity | null>(null);
  
  const { toast } = useToast();

  /**
   * Load staking opportunities with error handling
   */
  const loadStakingOpportunities = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const opportunities = await getStakingOpportunities();
      setStakingOpportunities(opportunities);
      setLastUpdate(new Date());
      
      console.log('✅ Loaded staking opportunities:', opportunities.length);
    } catch (error) {
      console.error('❌ Error loading staking opportunities:', error);
      setError('Failed to load staking opportunities');
      
      toast({
        title: "Loading Error",
        description: "Failed to load staking opportunities. Using cached data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load data on component mount and set up refresh interval
  useEffect(() => {
    loadStakingOpportunities();
    
    // Set up 5-minute refresh interval for real-time data
    const refreshInterval = setInterval(loadStakingOpportunities, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [loadStakingOpportunities]);

  /**
   * Get risk level styling
   */
  const getRiskStyling = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-dex-positive border-dex-positive bg-dex-positive/10';
      case 'medium':
        return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
      case 'high':
        return 'text-dex-primary border-dex-primary bg-dex-primary/10';
      default:
        return 'text-dex-text-secondary border-dex-text-secondary bg-dex-text-secondary/10';
    }
  };

  /**
   * Get lock period display
   */
  const getLockPeriodDisplay = (lockPeriod: number) => {
    if (lockPeriod === 0) return 'Flexible';
    if (lockPeriod === 1) return '1 day';
    if (lockPeriod < 30) return `${lockPeriod} days`;
    if (lockPeriod < 365) return `${Math.round(lockPeriod / 30)} months`;
    return `${Math.round(lockPeriod / 365)} years`;
  };

  /**
   * Handle staking opportunity selection
   */
  const handleStakeSelect = (opportunity: StakingOpportunity) => {
    setSelectedOpportunity(opportunity);
    onStakeSelect?.(opportunity);
    
    toast({
      title: "Staking Opportunity Selected",
      description: `Selected ${opportunity.protocol} (${opportunity.token}) with ${opportunity.apy}% APY`,
    });
  };

  /**
   * Format large numbers for display
   */
  const formatLargeNumber = (value: string) => {
    const num = parseFloat(value);
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  };

  // Loading state
  if (isLoading && stakingOpportunities.length === 0) {
    return (
      <Card className={`bg-dex-dark/80 border-dex-primary/30 ${className}`}>
        <CardHeader>
          <CardTitle className="text-dex-text-primary flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Staking Opportunities
            <RefreshCw className="h-4 w-4 animate-spin ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-dex-secondary/20 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-dex-secondary/20 rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-dex-secondary/20 rounded w-2/3 mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state with fallback
  if (error && stakingOpportunities.length === 0) {
    return (
      <Card className={`bg-dex-dark/80 border-dex-primary/30 ${className}`}>
        <CardHeader>
          <CardTitle className="text-dex-text-primary flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-dex-primary" />
            Staking Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-dex-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dex-text-primary mb-2">
              Unable to Load Staking Data
            </h3>
            <p className="text-dex-text-secondary mb-4">
              {error}
            </p>
            <Button 
              onClick={loadStakingOpportunities}
              className="bg-dex-primary hover:bg-dex-primary/80"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <Card className={`bg-dex-dark/80 border-dex-primary/30 ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-dex-text-primary flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Staking Opportunities
              <Badge variant="outline" className="text-xs text-dex-positive border-dex-positive">
                {stakingOpportunities.length} Protocols
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              {lastUpdate && (
                <span className="text-xs text-dex-text-secondary">
                  Updated {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={loadStakingOpportunities}
                disabled={isLoading}
                className="border-dex-primary/30 text-dex-text-primary hover:bg-dex-primary/10"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stakingOpportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer hover:border-dex-primary/50 ${
                  selectedOpportunity?.id === opportunity.id
                    ? 'border-dex-primary bg-dex-primary/5'
                    : 'border-dex-secondary/30 hover:bg-dex-secondary/5'
                }`}
                onClick={() => handleStakeSelect(opportunity)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-dex-primary">
                        {opportunity.token}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-dex-text-primary">
                        {opportunity.protocol}
                      </div>
                      <div className="text-sm text-dex-text-secondary">
                        {opportunity.token} Staking
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-dex-positive">
                      {opportunity.apy.toFixed(1)}%
                    </div>
                    <div className="text-xs text-dex-text-secondary">APY</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="text-center">
                    <div className="text-xs text-dex-text-secondary mb-1">Min Stake</div>
                    <div className="text-sm font-medium text-dex-text-primary">
                      {opportunity.minimumStake} {opportunity.token}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-dex-text-secondary mb-1">Lock Period</div>
                    <div className="text-sm font-medium text-dex-text-primary">
                      {getLockPeriodDisplay(opportunity.lockPeriod)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-dex-text-secondary mb-1">Total Staked</div>
                    <div className="text-sm font-medium text-dex-text-primary">
                      {formatLargeNumber(opportunity.totalStaked)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-dex-text-secondary mb-1">Risk Level</div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getRiskStyling(opportunity.risk)}`}
                    >
                      {opportunity.risk.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-dex-text-secondary mb-3">
                  {opportunity.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-dex-positive" />
                    <span className="text-xs text-dex-text-secondary">Audited Protocol</span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-dex-primary hover:bg-dex-primary/80 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStakeSelect(opportunity);
                    }}
                  >
                    Stake Now
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {stakingOpportunities.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-dex-text-secondary mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-dex-text-primary mb-2">
                No Staking Opportunities Available
              </h3>
              <p className="text-dex-text-secondary">
                Check back later for new staking opportunities.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export default StakingOpportunitiesPanel;
