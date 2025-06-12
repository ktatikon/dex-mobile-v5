/**
 * AI Analytics Page Component
 * 
 * Dedicated page for AI-powered portfolio optimization, risk assessment,
 * and predictive analytics extracted from WalletDashboardPage ai-analytics tab
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Phase 4.4 AI Analytics Components
import { AIAnalyticsPanel } from '@/components/phase4/AIAnalyticsPanel';

// Services
import { phase4ConfigManager } from '@/services/phase4/phase4ConfigService';

interface AIAnalyticsPageProps {
  className?: string;
}

const AIAnalyticsPage: React.FC<AIAnalyticsPageProps> = React.memo(({ 
  className = '' 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [loading, setLoading] = useState(true);
  const [aiAnalyticsEnabled, setAiAnalyticsEnabled] = useState(false);

  // Load configuration and data
  const loadPageData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('🔄 Loading AI Analytics page data...');

      // Load Phase 4 configuration
      const phase4Config = await phase4ConfigManager.getPhase4Config();
      setAiAnalyticsEnabled(phase4Config.aiAnalytics);

      console.log('✅ AI Analytics page data loaded successfully');
    } catch (error) {
      console.error('Error loading AI Analytics page data:', error);
      toast({
        title: "Error",
        description: "Failed to load AI analytics data. Please try again.",
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

  if (loading) {
    return (
      <div className={`container mx-auto px-4 pt-6 pb-24 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-dex-secondary/20 rounded-lg w-56"></div>
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
        <h1 className="text-2xl font-bold text-white mb-2">AI Analytics</h1>
        <p className="text-gray-400">
          AI-powered portfolio optimization, risk assessment, and predictive market insights
        </p>
      </div>

      <div className="space-y-6">
        {/* AI Analytics Panel - Always show */}
        <AIAnalyticsPanel
          userId={user?.id || 'current-user'}
          className="w-full"
        />
      </div>
    </div>
  );
});

AIAnalyticsPage.displayName = 'AIAnalyticsPage';

export default AIAnalyticsPage;
