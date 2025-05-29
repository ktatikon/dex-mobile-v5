-- =====================================================
-- PHASE 4.5: SOCIAL TRADING & COMMUNITY FEATURES
-- =====================================================
-- Migration: 20250101_phase4_5_social_trading.sql
-- Description: Database schema for social trading, copy trading, signals, and community features
-- Version: 1.0.0
-- Date: January 1, 2025

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TRADER PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS trader_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    avatar TEXT,
    bio TEXT,
    total_followers INTEGER DEFAULT 0,
    total_copiers INTEGER DEFAULT 0,
    reputation INTEGER DEFAULT 100,
    verification_level VARCHAR(20) DEFAULT 'unverified' CHECK (verification_level IN ('unverified', 'basic', 'advanced', 'expert')),
    is_public BOOLEAN DEFAULT false,
    allow_copy_trading BOOLEAN DEFAULT false,
    copy_trading_fee DECIMAL(5,2) DEFAULT 0.00 CHECK (copy_trading_fee >= 0 AND copy_trading_fee <= 100),
    risk_level VARCHAR(10) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
    trading_style TEXT[] DEFAULT ARRAY['swing'],
    preferred_assets TEXT[] DEFAULT ARRAY['BTC', 'ETH'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for user_id
ALTER TABLE trader_profiles ADD CONSTRAINT trader_profiles_user_id_unique UNIQUE (user_id);

-- =====================================================
-- 2. TRADER PERFORMANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS trader_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trader_id UUID NOT NULL REFERENCES trader_profiles(id) ON DELETE CASCADE,
    period VARCHAR(10) NOT NULL CHECK (period IN ('24h', '7d', '30d', '90d', '1y', 'all')),
    total_return DECIMAL(10,4) DEFAULT 0.00,
    win_rate DECIMAL(5,4) DEFAULT 0.00 CHECK (win_rate >= 0 AND win_rate <= 1),
    total_trades INTEGER DEFAULT 0,
    profitable_trades INTEGER DEFAULT 0,
    average_return DECIMAL(10,4) DEFAULT 0.00,
    max_drawdown DECIMAL(10,4) DEFAULT 0.00,
    sharpe_ratio DECIMAL(8,4) DEFAULT 0.00,
    volatility DECIMAL(10,4) DEFAULT 0.00,
    risk_score DECIMAL(5,2) DEFAULT 0.00,
    consistency DECIMAL(5,4) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for trader_id and period
ALTER TABLE trader_performance ADD CONSTRAINT trader_performance_trader_period_unique UNIQUE (trader_id, period);

-- =====================================================
-- 3. COPY TRADING POSITIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS copy_trading_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    copier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trader_id UUID NOT NULL REFERENCES trader_profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    copy_percentage DECIMAL(5,2) DEFAULT 10.00 CHECK (copy_percentage > 0 AND copy_percentage <= 100),
    max_copy_amount DECIMAL(15,2) DEFAULT 1000.00,
    
    -- Risk limits
    max_loss_per_trade DECIMAL(15,2) DEFAULT 100.00,
    max_daily_loss DECIMAL(15,2) DEFAULT 500.00,
    stop_loss_percentage DECIMAL(5,2) DEFAULT 10.00,
    
    -- Filters
    min_trade_amount DECIMAL(15,2),
    max_trade_amount DECIMAL(15,2),
    allowed_assets TEXT[],
    excluded_assets TEXT[],
    
    -- Performance tracking
    total_copied DECIMAL(15,2) DEFAULT 0.00,
    total_profit DECIMAL(15,2) DEFAULT 0.00,
    total_loss DECIMAL(15,2) DEFAULT 0.00,
    copied_trades INTEGER DEFAULT 0,
    successful_trades INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for copier_id and trader_id
ALTER TABLE copy_trading_positions ADD CONSTRAINT copy_trading_positions_copier_trader_unique UNIQUE (copier_id, trader_id);

-- =====================================================
-- 4. SOCIAL SIGNALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS social_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trader_id UUID NOT NULL REFERENCES trader_profiles(id) ON DELETE CASCADE,
    signal_type VARCHAR(10) NOT NULL CHECK (signal_type IN ('buy', 'sell', 'hold', 'alert')),
    asset VARCHAR(20) NOT NULL,
    target_price DECIMAL(20,8),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    reasoning TEXT NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    risk_level VARCHAR(10) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Performance tracking
    actual_outcome VARCHAR(10) CHECK (actual_outcome IN ('success', 'failure', 'pending')),
    actual_return DECIMAL(10,4),
    time_to_target INTEGER, -- in minutes
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. COMMUNITY POSTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES trader_profiles(id) ON DELETE CASCADE,
    post_type VARCHAR(20) NOT NULL CHECK (post_type IN ('analysis', 'news', 'discussion', 'education', 'strategy')),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    assets TEXT[],
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. SOCIAL INTERACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS social_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('signal', 'post', 'comment')),
    target_id UUID NOT NULL,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('like', 'comment', 'share', 'follow', 'copy')),
    content TEXT, -- for comments
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate interactions
ALTER TABLE social_interactions ADD CONSTRAINT social_interactions_unique UNIQUE (user_id, target_type, target_id, interaction_type);

-- =====================================================
-- 7. FOLLOWER RELATIONSHIPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS trader_followers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trader_id UUID NOT NULL REFERENCES trader_profiles(id) ON DELETE CASCADE,
    notification_settings JSONB DEFAULT '{"signals": true, "posts": true, "trades": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for follower_id and trader_id
ALTER TABLE trader_followers ADD CONSTRAINT trader_followers_unique UNIQUE (follower_id, trader_id);

-- =====================================================
-- 8. INDEXES FOR PERFORMANCE
-- =====================================================

-- Trader profiles indexes
CREATE INDEX IF NOT EXISTS idx_trader_profiles_user_id ON trader_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_trader_profiles_reputation ON trader_profiles(reputation DESC);
CREATE INDEX IF NOT EXISTS idx_trader_profiles_public ON trader_profiles(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_trader_profiles_copy_trading ON trader_profiles(allow_copy_trading) WHERE allow_copy_trading = true;

-- Trader performance indexes
CREATE INDEX IF NOT EXISTS idx_trader_performance_trader_id ON trader_performance(trader_id);
CREATE INDEX IF NOT EXISTS idx_trader_performance_period ON trader_performance(period);
CREATE INDEX IF NOT EXISTS idx_trader_performance_return ON trader_performance(total_return DESC);

-- Copy trading positions indexes
CREATE INDEX IF NOT EXISTS idx_copy_trading_copier_id ON copy_trading_positions(copier_id);
CREATE INDEX IF NOT EXISTS idx_copy_trading_trader_id ON copy_trading_positions(trader_id);
CREATE INDEX IF NOT EXISTS idx_copy_trading_active ON copy_trading_positions(is_active) WHERE is_active = true;

-- Social signals indexes
CREATE INDEX IF NOT EXISTS idx_social_signals_trader_id ON social_signals(trader_id);
CREATE INDEX IF NOT EXISTS idx_social_signals_asset ON social_signals(asset);
CREATE INDEX IF NOT EXISTS idx_social_signals_type ON social_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_social_signals_public ON social_signals(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_social_signals_created_at ON social_signals(created_at DESC);

-- Community posts indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_public ON community_posts(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);

-- Social interactions indexes
CREATE INDEX IF NOT EXISTS idx_social_interactions_user_id ON social_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_social_interactions_target ON social_interactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_social_interactions_type ON social_interactions(interaction_type);

-- Follower relationships indexes
CREATE INDEX IF NOT EXISTS idx_trader_followers_follower_id ON trader_followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_trader_followers_trader_id ON trader_followers(trader_id);

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE trader_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trader_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_trading_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trader_followers ENABLE ROW LEVEL SECURITY;

-- Trader profiles policies
CREATE POLICY "Users can view public trader profiles" ON trader_profiles
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own trader profile" ON trader_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Trader performance policies
CREATE POLICY "Users can view trader performance" ON trader_performance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trader_profiles tp 
            WHERE tp.id = trader_performance.trader_id 
            AND (tp.is_public = true OR tp.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage their own performance data" ON trader_performance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trader_profiles tp 
            WHERE tp.id = trader_performance.trader_id 
            AND tp.user_id = auth.uid()
        )
    );

-- Copy trading positions policies
CREATE POLICY "Users can view their own copy trading positions" ON copy_trading_positions
    FOR SELECT USING (auth.uid() = copier_id);

CREATE POLICY "Users can manage their own copy trading positions" ON copy_trading_positions
    FOR ALL USING (auth.uid() = copier_id);

-- Social signals policies
CREATE POLICY "Users can view public social signals" ON social_signals
    FOR SELECT USING (is_public = true OR 
        EXISTS (
            SELECT 1 FROM trader_profiles tp 
            WHERE tp.id = social_signals.trader_id 
            AND tp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own social signals" ON social_signals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trader_profiles tp 
            WHERE tp.id = social_signals.trader_id 
            AND tp.user_id = auth.uid()
        )
    );

-- Community posts policies
CREATE POLICY "Users can view public community posts" ON community_posts
    FOR SELECT USING (is_public = true OR 
        EXISTS (
            SELECT 1 FROM trader_profiles tp 
            WHERE tp.id = community_posts.author_id 
            AND tp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own community posts" ON community_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trader_profiles tp 
            WHERE tp.id = community_posts.author_id 
            AND tp.user_id = auth.uid()
        )
    );

-- Social interactions policies
CREATE POLICY "Users can view their own social interactions" ON social_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own social interactions" ON social_interactions
    FOR ALL USING (auth.uid() = user_id);

-- Follower relationships policies
CREATE POLICY "Users can view their follower relationships" ON trader_followers
    FOR SELECT USING (auth.uid() = follower_id OR 
        EXISTS (
            SELECT 1 FROM trader_profiles tp 
            WHERE tp.id = trader_followers.trader_id 
            AND tp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own follower relationships" ON trader_followers
    FOR ALL USING (auth.uid() = follower_id);

-- =====================================================
-- 10. AUTOMATED FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update trader follower count
CREATE OR REPLACE FUNCTION update_trader_follower_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE trader_profiles 
        SET total_followers = total_followers + 1,
            updated_at = NOW()
        WHERE id = NEW.trader_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE trader_profiles 
        SET total_followers = GREATEST(total_followers - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.trader_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for follower count updates
CREATE TRIGGER trigger_update_trader_follower_count
    AFTER INSERT OR DELETE ON trader_followers
    FOR EACH ROW EXECUTE FUNCTION update_trader_follower_count();

-- Function to update trader copier count
CREATE OR REPLACE FUNCTION update_trader_copier_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE trader_profiles 
        SET total_copiers = total_copiers + 1,
            updated_at = NOW()
        WHERE id = NEW.trader_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE trader_profiles 
        SET total_copiers = GREATEST(total_copiers - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.trader_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle activation/deactivation
        IF OLD.is_active = true AND NEW.is_active = false THEN
            UPDATE trader_profiles 
            SET total_copiers = GREATEST(total_copiers - 1, 0),
                updated_at = NOW()
            WHERE id = NEW.trader_id;
        ELSIF OLD.is_active = false AND NEW.is_active = true THEN
            UPDATE trader_profiles 
            SET total_copiers = total_copiers + 1,
                updated_at = NOW()
            WHERE id = NEW.trader_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for copier count updates
CREATE TRIGGER trigger_update_trader_copier_count
    AFTER INSERT OR UPDATE OR DELETE ON copy_trading_positions
    FOR EACH ROW EXECUTE FUNCTION update_trader_copier_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER trigger_trader_profiles_updated_at
    BEFORE UPDATE ON trader_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_trader_performance_updated_at
    BEFORE UPDATE ON trader_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_copy_trading_positions_updated_at
    BEFORE UPDATE ON copy_trading_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_social_signals_updated_at
    BEFORE UPDATE ON social_signals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_community_posts_updated_at
    BEFORE UPDATE ON community_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 11. DEFAULT DATA INSERTION
-- =====================================================

-- Insert default trader profiles for demo purposes (optional)
-- This would typically be done through the application, not in migration

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Phase 4.5 Social Trading migration completed successfully';
    RAISE NOTICE 'Tables created: trader_profiles, trader_performance, copy_trading_positions, social_signals, community_posts, social_interactions, trader_followers';
    RAISE NOTICE 'RLS policies enabled for all tables';
    RAISE NOTICE 'Automated functions and triggers created';
END $$;
