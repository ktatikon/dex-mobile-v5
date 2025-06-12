/**
 * Social Page Component
 * 
 * Dedicated page for social trading features, community interactions,
 * and trader following extracted from WalletDashboardPage social tab
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Phase 4.5 Social Trading Components
import SocialTradingPanel from '@/components/phase4/SocialTradingPanel';

// Services
import { phase4ConfigManager } from '@/services/phase4/phase4ConfigService';

interface SocialPageProps {
  className?: string;
}

const SocialPage: React.FC<SocialPageProps> = React.memo(({ 
  className = '' 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [loading, setLoading] = useState(true);
  const [socialTradingEnabled, setSocialTradingEnabled] = useState(false);

  // Load configuration and data
  const loadPageData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('🔄 Loading Social page data...');

      // Load Phase 4 configuration
      const phase4Config = await phase4ConfigManager.getPhase4Config();
      setSocialTradingEnabled(phase4Config.socialTrading);

      console.log('✅ Social page data loaded successfully');
    } catch (error) {
      console.error('Error loading Social page data:', error);
      toast({
        title: "Error",
        description: "Failed to load social trading data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Load data on component mount
  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  // Handle social trading errors
  const handleSocialError = useCallback((error: string) => {
    console.error('Social Trading Error:', error);
    toast({
      title: "Social Trading Error",
      description: error,
      variant: "destructive",
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
        <h1 className="text-2xl font-bold text-white mb-2">Social Trading</h1>
        <p className="text-gray-400">
          Connect with top traders, copy strategies, and share your trading insights with the community
        </p>
      </div>

      <div className="space-y-6">
        {/* Social Trading Panel - Always show */}
        <SocialTradingPanel
          userId={user?.id || 'current-user'}
          onError={handleSocialError}
        />
      </div>
    </div>
  );
});

SocialPage.displayName = 'SocialPage';

export default SocialPage;
