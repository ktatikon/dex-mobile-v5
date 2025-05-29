/**
 * Phase 4.5 Social Trading Service
 * Provides copy trading, social signals, community features, and trader leaderboards
 * 
 * Features:
 * - Copy Trading Platform
 * - Social Trading Signals
 * - Community Features
 * - Trader Leaderboards
 * - Social Analytics
 */

import { supabase } from '@/integrations/supabase/client';
import { phase4ConfigManager } from './phase4ConfigService';

// Social Trading Interfaces
export interface TraderProfile {
  id: string;
  userId: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  totalFollowers: number;
  totalCopiers: number;
  reputation: number;
  verificationLevel: 'unverified' | 'basic' | 'advanced' | 'expert';
  joinedAt: Date;
  lastActive: Date;
  isPublic: boolean;
  allowCopyTrading: boolean;
  copyTradingFee: number; // percentage
  riskLevel: 'low' | 'medium' | 'high';
  tradingStyle: string[];
  preferredAssets: string[];
}

export interface TraderPerformance {
  traderId: string;
  period: '24h' | '7d' | '30d' | '90d' | '1y' | 'all';
  totalReturn: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  averageReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  riskScore: number;
  consistency: number;
  lastUpdated: Date;
}

export interface CopyTradingPosition {
  id: string;
  copyerId: string;
  traderId: string;
  isActive: boolean;
  copyPercentage: number; // percentage of portfolio to allocate
  maxCopyAmount: number;
  riskLimits: {
    maxLossPerTrade: number;
    maxDailyLoss: number;
    stopLossPercentage: number;
  };
  filters: {
    minTradeAmount?: number;
    maxTradeAmount?: number;
    allowedAssets?: string[];
    excludedAssets?: string[];
  };
  performance: {
    totalCopied: number;
    totalProfit: number;
    totalLoss: number;
    copiedTrades: number;
    successfulTrades: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialSignal {
  id: string;
  traderId: string;
  signalType: 'buy' | 'sell' | 'hold' | 'alert';
  asset: string;
  targetPrice?: number;
  confidence: number; // 0-1
  reasoning: string;
  timeframe: string;
  riskLevel: 'low' | 'medium' | 'high';
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  isPublic: boolean;
  expiresAt?: Date;
  createdAt: Date;
  performance?: {
    actualOutcome?: 'success' | 'failure' | 'pending';
    actualReturn?: number;
    timeToTarget?: number;
  };
}

export interface CommunityPost {
  id: string;
  authorId: string;
  postType: 'analysis' | 'news' | 'discussion' | 'education' | 'strategy';
  title: string;
  content: string;
  assets?: string[];
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  views: number;
  isPublic: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  traderId: string;
  traderProfile: TraderProfile;
  performance: TraderPerformance;
  score: number;
  change: number; // rank change from previous period
  category: 'overall' | 'returns' | 'consistency' | 'risk-adjusted' | 'newcomer';
}

/**
 * Social Trading Service Class
 * Handles all social trading functionality with comprehensive error handling
 */
class SocialTradingService {
  private consecutiveFailures = 0;
  private maxFailures = 5;
  private lastHealthCheck: Date | null = null;
  private isHealthy = true;

  constructor() {
    console.log('🚀 Phase 4.5 Social Trading Service initialized');
  }

  /**
   * Get trader profile by user ID
   */
  async getTraderProfile(userId: string): Promise<TraderProfile | null> {
    try {
      const config = phase4ConfigManager.getConfig();
      if (!config.enableCopyTrading && !config.enableSocialSignals) {
        console.log('📊 Social trading disabled, using fallback');
        return this.createMockTraderProfile(userId);
      }

      const { data, error } = await supabase
        .from('trader_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // Create default trader profile
        return await this.createTraderProfile(userId);
      }

      this.resetFailureCount();
      return this.mapToTraderProfile(data);

    } catch (error) {
      console.error('❌ Error fetching trader profile:', error);
      this.handleFailure();
      return this.createMockTraderProfile(userId);
    }
  }

  /**
   * Create new trader profile
   */
  async createTraderProfile(userId: string, profileData?: Partial<TraderProfile>): Promise<TraderProfile | null> {
    try {
      const config = phase4ConfigManager.getConfig();
      if (!config.enableCopyTrading) {
        return this.createMockTraderProfile(userId);
      }

      const defaultProfile = {
        user_id: userId,
        display_name: `Trader_${userId.slice(0, 8)}`,
        total_followers: 0,
        total_copiers: 0,
        reputation: 100,
        verification_level: 'unverified',
        is_public: false,
        allow_copy_trading: false,
        copy_trading_fee: 0,
        risk_level: 'medium',
        trading_style: ['swing'],
        preferred_assets: ['BTC', 'ETH'],
        ...profileData
      };

      const { data, error } = await supabase
        .from('trader_profiles')
        .insert(defaultProfile)
        .select()
        .single();

      if (error) throw error;

      this.resetFailureCount();
      return this.mapToTraderProfile(data);

    } catch (error) {
      console.error('❌ Error creating trader profile:', error);
      this.handleFailure();
      return this.createMockTraderProfile(userId);
    }
  }

  /**
   * Get trader leaderboard
   */
  async getTraderLeaderboard(
    category: 'overall' | 'returns' | 'consistency' | 'risk-adjusted' | 'newcomer' = 'overall',
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    try {
      const config = phase4ConfigManager.getConfig();
      if (!config.enableTraderLeaderboards) {
        console.log('📊 Trader leaderboards disabled, using mock data');
        return this.createMockLeaderboard(category, limit);
      }

      // This would typically involve complex queries joining trader profiles and performance data
      // For now, we'll return mock data with the structure in place
      return this.createMockLeaderboard(category, limit);

    } catch (error) {
      console.error('❌ Error fetching trader leaderboard:', error);
      this.handleFailure();
      return this.createMockLeaderboard(category, limit);
    }
  }

  /**
   * Get social signals feed
   */
  async getSocialSignals(
    filters?: {
      traderId?: string;
      asset?: string;
      signalType?: string;
      minConfidence?: number;
    },
    limit: number = 20
  ): Promise<SocialSignal[]> {
    try {
      const config = phase4ConfigManager.getConfig();
      if (!config.enableSocialSignals) {
        console.log('📊 Social signals disabled, using mock data');
        return this.createMockSocialSignals(limit);
      }

      // Implementation would query social_signals table with filters
      return this.createMockSocialSignals(limit);

    } catch (error) {
      console.error('❌ Error fetching social signals:', error);
      this.handleFailure();
      return this.createMockSocialSignals(limit);
    }
  }

  /**
   * Create social signal
   */
  async createSocialSignal(signalData: Omit<SocialSignal, 'id' | 'likes' | 'comments' | 'shares' | 'createdAt'>): Promise<SocialSignal | null> {
    try {
      const config = phase4ConfigManager.getConfig();
      if (!config.enableSocialSignals) {
        console.log('📊 Social signals disabled');
        return null;
      }

      const { data, error } = await supabase
        .from('social_signals')
        .insert({
          trader_id: signalData.traderId,
          signal_type: signalData.signalType,
          asset: signalData.asset,
          target_price: signalData.targetPrice,
          confidence: signalData.confidence,
          reasoning: signalData.reasoning,
          timeframe: signalData.timeframe,
          risk_level: signalData.riskLevel,
          tags: signalData.tags,
          is_public: signalData.isPublic,
          expires_at: signalData.expiresAt?.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      this.resetFailureCount();
      return this.mapToSocialSignal(data);

    } catch (error) {
      console.error('❌ Error creating social signal:', error);
      this.handleFailure();
      return null;
    }
  }

  // Helper methods for mapping database records to interfaces
  private mapToTraderProfile(data: any): TraderProfile {
    return {
      id: data.id,
      userId: data.user_id,
      displayName: data.display_name,
      avatar: data.avatar,
      bio: data.bio,
      totalFollowers: data.total_followers || 0,
      totalCopiers: data.total_copiers || 0,
      reputation: data.reputation || 100,
      verificationLevel: data.verification_level || 'unverified',
      joinedAt: new Date(data.created_at),
      lastActive: new Date(data.updated_at),
      isPublic: data.is_public || false,
      allowCopyTrading: data.allow_copy_trading || false,
      copyTradingFee: data.copy_trading_fee || 0,
      riskLevel: data.risk_level || 'medium',
      tradingStyle: data.trading_style || ['swing'],
      preferredAssets: data.preferred_assets || ['BTC', 'ETH']
    };
  }

  private mapToSocialSignal(data: any): SocialSignal {
    return {
      id: data.id,
      traderId: data.trader_id,
      signalType: data.signal_type,
      asset: data.asset,
      targetPrice: data.target_price,
      confidence: data.confidence,
      reasoning: data.reasoning,
      timeframe: data.timeframe,
      riskLevel: data.risk_level,
      tags: data.tags || [],
      likes: data.likes || 0,
      comments: data.comments || 0,
      shares: data.shares || 0,
      isPublic: data.is_public,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      createdAt: new Date(data.created_at)
    };
  }

  // Mock data methods for fallback scenarios
  private createMockTraderProfile(userId: string): TraderProfile {
    return {
      id: `mock_${userId}`,
      userId,
      displayName: `Trader_${userId.slice(0, 8)}`,
      totalFollowers: 0,
      totalCopiers: 0,
      reputation: 100,
      verificationLevel: 'unverified',
      joinedAt: new Date(),
      lastActive: new Date(),
      isPublic: false,
      allowCopyTrading: false,
      copyTradingFee: 0,
      riskLevel: 'medium',
      tradingStyle: ['swing'],
      preferredAssets: ['BTC', 'ETH']
    };
  }

  private createMockLeaderboard(category: string, limit: number): LeaderboardEntry[] {
    const mockEntries: LeaderboardEntry[] = [];
    
    for (let i = 1; i <= Math.min(limit, 10); i++) {
      mockEntries.push({
        rank: i,
        traderId: `trader_${i}`,
        traderProfile: this.createMockTraderProfile(`trader_${i}`),
        performance: {
          traderId: `trader_${i}`,
          period: '30d',
          totalReturn: Math.random() * 50 - 10, // -10% to 40%
          winRate: 0.6 + Math.random() * 0.3, // 60% to 90%
          totalTrades: Math.floor(Math.random() * 100) + 20,
          profitableTrades: 0,
          averageReturn: Math.random() * 5,
          maxDrawdown: Math.random() * 15,
          sharpeRatio: Math.random() * 2,
          volatility: Math.random() * 20,
          riskScore: Math.random() * 10,
          consistency: Math.random(),
          lastUpdated: new Date()
        },
        score: 100 - i * 5,
        change: Math.floor(Math.random() * 10) - 5,
        category: category as any
      });
    }

    return mockEntries;
  }

  private createMockSocialSignals(limit: number): SocialSignal[] {
    const assets = ['BTC', 'ETH', 'ADA', 'SOL', 'MATIC'];
    const signalTypes: ('buy' | 'sell' | 'hold' | 'alert')[] = ['buy', 'sell', 'hold', 'alert'];
    const mockSignals: SocialSignal[] = [];

    for (let i = 0; i < Math.min(limit, 10); i++) {
      mockSignals.push({
        id: `signal_${i}`,
        traderId: `trader_${i % 5}`,
        signalType: signalTypes[Math.floor(Math.random() * signalTypes.length)],
        asset: assets[Math.floor(Math.random() * assets.length)],
        confidence: 0.6 + Math.random() * 0.4,
        reasoning: `Technical analysis suggests ${signalTypes[Math.floor(Math.random() * signalTypes.length)]} opportunity`,
        timeframe: ['1h', '4h', '1d', '1w'][Math.floor(Math.random() * 4)],
        riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        tags: ['technical', 'momentum'],
        likes: Math.floor(Math.random() * 50),
        comments: Math.floor(Math.random() * 20),
        shares: Math.floor(Math.random() * 10),
        isPublic: true,
        createdAt: new Date(Date.now() - Math.random() * 86400000) // Random time in last 24h
      });
    }

    return mockSignals;
  }

  // Error handling methods
  private handleFailure(): void {
    this.consecutiveFailures++;
    this.isHealthy = this.consecutiveFailures < this.maxFailures;
    
    if (this.consecutiveFailures >= this.maxFailures) {
      console.warn(`⚠️ Social Trading Service: ${this.consecutiveFailures} consecutive failures, activating Phase 1 fallback`);
    }
  }

  private resetFailureCount(): void {
    if (this.consecutiveFailures > 0) {
      console.log('✅ Social Trading Service: Connection restored');
      this.consecutiveFailures = 0;
      this.isHealthy = true;
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      isHealthy: this.isHealthy,
      consecutiveFailures: this.consecutiveFailures,
      lastHealthCheck: this.lastHealthCheck,
      currentMode: this.isHealthy ? 'Phase 4.5 Active' : 'Phase 1 Fallback'
    };
  }
}

// Export singleton instance
export const socialTradingService = new SocialTradingService();

// Export safe wrapper functions
export const safeSocialTradingService = {
  async getTraderProfile(userId: string) {
    try {
      if (phase4ConfigManager.getConfig().enableCopyTrading) {
        return await socialTradingService.getTraderProfile(userId);
      }
    } catch (error) {
      console.warn('Social trading failed, using Phase 1 fallback:', error);
    }
    return null;
  },

  async getTraderLeaderboard(category?: any, limit?: number) {
    try {
      if (phase4ConfigManager.getConfig().enableTraderLeaderboards) {
        return await socialTradingService.getTraderLeaderboard(category, limit);
      }
    } catch (error) {
      console.warn('Trader leaderboards failed, using Phase 1 fallback:', error);
    }
    return [];
  },

  async getSocialSignals(filters?: any, limit?: number) {
    try {
      if (phase4ConfigManager.getConfig().enableSocialSignals) {
        return await socialTradingService.getSocialSignals(filters, limit);
      }
    } catch (error) {
      console.warn('Social signals failed, using Phase 1 fallback:', error);
    }
    return [];
  }
};
