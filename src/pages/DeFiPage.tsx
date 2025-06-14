/**
 * DeFi Page Component
 * 
 * Dedicated page for DeFi operations including staking, yield farming,
 * and liquidity provision extracted from WalletDashboardPage tabs
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

// Phase 4.2 DeFi Integration Components
import DeFiIntegrationPanel from '@/components/phase4/DeFiIntegrationPanel';
import StakingOpportunitiesPanel from '@/components/phase4/StakingOpportunitiesPanel';

// Services
import { getDeFiPortfolioSummary } from '@/services/defiService';
import { getRealTimeTokens } from '@/services/fallbackDataService';
import { phase4ConfigManager } from '@/services/phase4/phase4ConfigService';

interface DeFiPageProps {
  className?: string;
}

interface DeFiSummary {
  totalStaked: string;
  totalRewards: string;
  activePositions: number;
  averageApy: number;
}

const DeFiPage: React.FC<DeFiPageProps> = React.memo(({ className = '' }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [loading, setLoading] = useState(true);
  const [defiSummary, setDefiSummary] = useState<DeFiSummary | null>(null);
  const [availableTokens, setAvailableTokens] = useState<any[]>([]);
  const [defiEnabled, setDefiEnabled] = useState(false);
  const [showBalances, setShowBalances] = useState(true);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('🔄 Loading DeFi page data...');

      // Load Phase 4 configuration
      const phase4Config = await phase4ConfigManager.getPhase4Config();
      setDefiEnabled(phase4Config.defiIntegration);

      // Load available tokens for DeFi operations
      const tokens = await getRealTimeTokens();
      setAvailableTokens(tokens);

      // Load DeFi portfolio summary
      try {
        const defiData = await getDeFiPortfolioSummary(user.id);
        setDefiSummary(defiData);
      } catch (error) {
        console.warn('DeFi summary not available:', error);
        setDefiSummary(null);
      }

      console.log('✅ DeFi page data loaded successfully');
    } catch (error) {
      console.error('Error loading DeFi page data:', error);
      toast({
        title: "Error",
        description: "Failed to load DeFi data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Load data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle DeFi position creation
  const handlePositionCreate = useCallback((position: any) => {
    console.log('DeFi position created:', position);
    // Refresh dashboard data
    fetchDashboardData();
    
    toast({
      title: "Success",
      description: "DeFi position created successfully",
      variant: "default",
    });
  }, [fetchDashboardData, toast]);

  // Handle staking opportunity selection
  const handleStakeSelect = useCallback((opportunity: any) => {
    console.log('Staking opportunity selected:', opportunity);
    toast({
      title: "Staking Opportunity Selected",
      description: `Selected ${opportunity.protocol} (${opportunity.token}) with ${opportunity.apy}% APY`,
    });
  }, [toast]);

  if (loading) {
    return (
      <div className={`container mx-auto px-4 pt-6 pb-24 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-dex-secondary/20 rounded-lg w-48"></div>
          <div className="h-64 bg-dex-secondary/20 rounded-lg"></div>
          <div className="h-64 bg-dex-secondary/20 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 pt-6 pb-24 ${className}`}>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-medium text-white mb-2 font-poppins">DeFi Operations</h1>
        <p className="text-dex-text-secondary font-poppins">
          Manage your decentralized finance positions, staking, and yield farming
        </p>
      </div>

      <div className="space-y-6">
        {/* Phase 4.2 DeFi Integration Panel - Always show */}
        <DeFiIntegrationPanel
          tokens={availableTokens}
          onPositionCreate={handlePositionCreate}
        />

        {/* Enhanced Staking Opportunities Panel - Always show */}
        <StakingOpportunitiesPanel
          className="mb-6"
          onStakeSelect={handleStakeSelect}
        />

        {/* DeFi Portfolio Summary */}
        {defiSummary && (
          <Card className="p-6 bg-dex-dark border-dex-secondary/30 shadow-[0_4px_12px_rgba(0,0,0,0.2),0_1px_3px_rgba(177,66,10,0.1)]">
            <h3 className="text-xl font-medium text-white mb-4 font-poppins">DeFi Portfolio Summary</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-dex-secondary/10 rounded-lg border border-dex-secondary/20">
                <p className="text-sm text-dex-text-secondary font-poppins">Total Staked</p>
                <p className="text-2xl font-medium text-white font-poppins">
                  {showBalances ? `$${parseFloat(defiSummary.totalStaked).toFixed(2)}` : '••••••'}
                </p>
              </div>
              <div className="p-4 bg-dex-secondary/10 rounded-lg border border-dex-secondary/20">
                <p className="text-sm text-dex-text-secondary font-poppins">Total Rewards</p>
                <p className="text-2xl font-medium text-dex-positive font-poppins">
                  {showBalances ? `$${parseFloat(defiSummary.totalRewards).toFixed(2)}` : '••••••'}
                </p>
              </div>
              <div className="p-4 bg-dex-secondary/10 rounded-lg border border-dex-secondary/20">
                <p className="text-sm text-dex-text-secondary font-poppins">Active Positions</p>
                <p className="text-2xl font-medium text-white font-poppins">{defiSummary.activePositions}</p>
              </div>
              <div className="p-4 bg-dex-secondary/10 rounded-lg border border-dex-secondary/20">
                <p className="text-sm text-dex-text-secondary font-poppins">Average APY</p>
                <p className="text-2xl font-medium text-white font-poppins">{defiSummary.averageApy.toFixed(1)}%</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
});

DeFiPage.displayName = 'DeFiPage';

export default DeFiPage;
