/**
 * Multi-Network Portfolio Page Component
 * 
 * Dedicated page for cross-chain bridge operations and multi-network portfolio management
 * extracted from WalletDashboardPage bridge tab (renamed from "Bridge")
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Phase 4.3 Cross-Chain Components
import CrossChainBridgePanel from '@/components/phase4/CrossChainBridgePanel';
import MultiNetworkPortfolio from '@/components/phase4/MultiNetworkPortfolio';

// Services
import { getRealTimeTokens } from '@/services/fallbackDataService';
import { phase4ConfigManager } from '@/services/phase4/phase4ConfigService';

interface MultiNetworkPortfolioPageProps {
  className?: string;
}

const MultiNetworkPortfolioPage: React.FC<MultiNetworkPortfolioPageProps> = React.memo(({ 
  className = '' 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [loading, setLoading] = useState(true);
  const [availableTokens, setAvailableTokens] = useState<any[]>([]);
  const [crossChainEnabled, setCrossChainEnabled] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('🔄 Loading Multi-Network Portfolio page data...');

      // Load Phase 4 configuration
      const phase4Config = await phase4ConfigManager.getPhase4Config();
      setCrossChainEnabled(phase4Config.crossChainBridge);

      // Load available tokens for bridge operations
      const tokens = await getRealTimeTokens();
      setAvailableTokens(tokens);

      console.log('✅ Multi-Network Portfolio page data loaded successfully');
    } catch (error) {
      console.error('Error loading Multi-Network Portfolio page data:', error);
      toast({
        title: "Error",
        description: "Failed to load multi-network portfolio data. Please try again.",
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

  // Handle bridge transaction completion
  const handleBridgeComplete = useCallback((transaction: any) => {
    console.log('Bridge transaction completed:', transaction);
    // Refresh dashboard data to show updated balances
    fetchDashboardData();

    toast({
      title: "Success",
      description: "Bridge transaction completed successfully",
      variant: "default",
    });
  }, [fetchDashboardData, toast]);

  if (loading) {
    return (
      <div className={`container mx-auto px-4 pt-6 pb-24 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-dex-secondary/20 rounded-lg w-64"></div>
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
        <h1 className="text-2xl font-bold text-white mb-2">Multi-Network Portfolio</h1>
        <p className="text-gray-400">
          Manage your assets across multiple blockchain networks and bridge tokens seamlessly
        </p>
      </div>

      <div className="space-y-6">
        {/* Multi-Network Portfolio Overview - Always show */}
        <MultiNetworkPortfolio
          userId={user?.id || 'current-user'}
          className="mb-6"
        />

        {/* Cross-Chain Bridge Panel - Always show */}
        <CrossChainBridgePanel
          tokens={availableTokens}
          onBridgeComplete={handleBridgeComplete}
        />
      </div>
    </div>
  );
});

MultiNetworkPortfolioPage.displayName = 'MultiNetworkPortfolioPage';

export default MultiNetworkPortfolioPage;
