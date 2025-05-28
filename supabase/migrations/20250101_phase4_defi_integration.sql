-- Phase 4.2: Active DeFi Integration Database Schema
-- Created: January 1, 2025
-- Purpose: Support live staking, yield farming, and liquidity provision features

-- Create staking_positions table for live staking platform
CREATE TABLE IF NOT EXISTS public.staking_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol TEXT NOT NULL, -- 'ethereum_2_0', 'polygon', 'cardano', etc.
  validator_address TEXT,
  token_id TEXT NOT NULL,
  staked_amount DECIMAL(20, 8) NOT NULL,
  current_rewards DECIMAL(20, 8) NOT NULL DEFAULT 0,
  total_rewards_earned DECIMAL(20, 8) NOT NULL DEFAULT 0,
  apy DECIMAL(5, 2) NOT NULL,
  lock_period_days INTEGER DEFAULT 0,
  staking_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  unstaking_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unstaking', 'completed', 'slashed')),
  auto_compound BOOLEAN NOT NULL DEFAULT true,
  risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create yield_farming_positions table for automated yield farming
CREATE TABLE IF NOT EXISTS public.yield_farming_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol TEXT NOT NULL, -- 'uniswap_v3', 'compound', 'aave', 'curve', etc.
  pool_address TEXT NOT NULL,
  pool_name TEXT NOT NULL,
  token_a_id TEXT NOT NULL,
  token_b_id TEXT NOT NULL,
  token_a_amount DECIMAL(20, 8) NOT NULL,
  token_b_amount DECIMAL(20, 8) NOT NULL,
  lp_tokens DECIMAL(20, 8) NOT NULL,
  current_apy DECIMAL(5, 2) NOT NULL,
  rewards_earned DECIMAL(20, 8) NOT NULL DEFAULT 0,
  impermanent_loss DECIMAL(20, 8) NOT NULL DEFAULT 0,
  fees_collected DECIMAL(20, 8) NOT NULL DEFAULT 0,
  auto_reinvest BOOLEAN NOT NULL DEFAULT true,
  strategy_type TEXT NOT NULL DEFAULT 'balanced' CHECK (strategy_type IN ('conservative', 'balanced', 'aggressive')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'withdrawn', 'migrated')),
  entry_price_a DECIMAL(20, 8) NOT NULL,
  entry_price_b DECIMAL(20, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create liquidity_positions table for AMM liquidity provision
CREATE TABLE IF NOT EXISTS public.liquidity_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amm_protocol TEXT NOT NULL, -- 'uniswap_v2', 'uniswap_v3', 'sushiswap', 'pancakeswap', etc.
  pool_address TEXT NOT NULL,
  token_a_id TEXT NOT NULL,
  token_b_id TEXT NOT NULL,
  token_a_amount DECIMAL(20, 8) NOT NULL,
  token_b_amount DECIMAL(20, 8) NOT NULL,
  liquidity_tokens DECIMAL(20, 8) NOT NULL,
  fee_tier DECIMAL(5, 4) NOT NULL, -- 0.0030 for 0.3%, etc.
  price_range_min DECIMAL(20, 8), -- For concentrated liquidity (Uniswap V3)
  price_range_max DECIMAL(20, 8), -- For concentrated liquidity (Uniswap V3)
  fees_earned_a DECIMAL(20, 8) NOT NULL DEFAULT 0,
  fees_earned_b DECIMAL(20, 8) NOT NULL DEFAULT 0,
  impermanent_loss_usd DECIMAL(20, 8) NOT NULL DEFAULT 0,
  total_value_usd DECIMAL(20, 8) NOT NULL,
  auto_compound_fees BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed', 'migrated')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create defi_rewards table for tracking all DeFi rewards
CREATE TABLE IF NOT EXISTS public.defi_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_type TEXT NOT NULL CHECK (position_type IN ('staking', 'yield_farming', 'liquidity')),
  position_id UUID NOT NULL, -- References staking_positions, yield_farming_positions, or liquidity_positions
  reward_token_id TEXT NOT NULL,
  reward_amount DECIMAL(20, 8) NOT NULL,
  reward_value_usd DECIMAL(20, 8) NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('staking_reward', 'trading_fee', 'liquidity_mining', 'governance_token')),
  claimed_at TIMESTAMP WITH TIME ZONE,
  auto_compounded BOOLEAN NOT NULL DEFAULT false,
  transaction_hash TEXT,
  block_number BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create defi_strategies table for automated DeFi strategies
CREATE TABLE IF NOT EXISTS public.defi_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_name TEXT NOT NULL,
  strategy_type TEXT NOT NULL CHECK (strategy_type IN ('yield_optimization', 'risk_management', 'arbitrage', 'rebalancing')),
  target_protocols TEXT[] NOT NULL, -- Array of protocols to use
  allocation_percentages JSONB NOT NULL, -- {"ethereum_2_0": 40, "compound": 30, "uniswap_v3": 30}
  risk_tolerance TEXT NOT NULL CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  min_apy_threshold DECIMAL(5, 2) NOT NULL DEFAULT 5.0,
  max_gas_price_gwei INTEGER NOT NULL DEFAULT 50,
  auto_rebalance BOOLEAN NOT NULL DEFAULT true,
  rebalance_threshold DECIMAL(5, 2) NOT NULL DEFAULT 5.0, -- Rebalance when allocation drifts by this %
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_value_managed DECIMAL(20, 8) NOT NULL DEFAULT 0,
  performance_fee_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create defi_analytics table for performance tracking
CREATE TABLE IF NOT EXISTS public.defi_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_staked_value DECIMAL(20, 8) NOT NULL DEFAULT 0,
  total_farming_value DECIMAL(20, 8) NOT NULL DEFAULT 0,
  total_liquidity_value DECIMAL(20, 8) NOT NULL DEFAULT 0,
  daily_rewards_earned DECIMAL(20, 8) NOT NULL DEFAULT 0,
  daily_fees_earned DECIMAL(20, 8) NOT NULL DEFAULT 0,
  total_impermanent_loss DECIMAL(20, 8) NOT NULL DEFAULT 0,
  portfolio_apy DECIMAL(5, 2) NOT NULL DEFAULT 0,
  gas_fees_paid DECIMAL(20, 8) NOT NULL DEFAULT 0,
  net_profit_loss DECIMAL(20, 8) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create protocol_configs table for DeFi protocol configurations
CREATE TABLE IF NOT EXISTS public.protocol_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_name TEXT NOT NULL UNIQUE,
  protocol_type TEXT NOT NULL CHECK (protocol_type IN ('staking', 'lending', 'dex', 'yield_farming')),
  network TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  min_stake_amount DECIMAL(20, 8) NOT NULL DEFAULT 0,
  max_stake_amount DECIMAL(20, 8),
  current_apy DECIMAL(5, 2) NOT NULL DEFAULT 0,
  risk_score INTEGER NOT NULL DEFAULT 5 CHECK (risk_score >= 1 AND risk_score <= 10),
  lock_period_days INTEGER DEFAULT 0,
  supports_auto_compound BOOLEAN NOT NULL DEFAULT false,
  gas_estimate_gwei INTEGER NOT NULL DEFAULT 30,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS staking_positions_user_id_idx ON public.staking_positions(user_id);
CREATE INDEX IF NOT EXISTS staking_positions_protocol_idx ON public.staking_positions(protocol);
CREATE INDEX IF NOT EXISTS staking_positions_status_idx ON public.staking_positions(status);
CREATE INDEX IF NOT EXISTS staking_positions_created_at_idx ON public.staking_positions(created_at);

CREATE INDEX IF NOT EXISTS yield_farming_positions_user_id_idx ON public.yield_farming_positions(user_id);
CREATE INDEX IF NOT EXISTS yield_farming_positions_protocol_idx ON public.yield_farming_positions(protocol);
CREATE INDEX IF NOT EXISTS yield_farming_positions_status_idx ON public.yield_farming_positions(status);

CREATE INDEX IF NOT EXISTS liquidity_positions_user_id_idx ON public.liquidity_positions(user_id);
CREATE INDEX IF NOT EXISTS liquidity_positions_amm_protocol_idx ON public.liquidity_positions(amm_protocol);
CREATE INDEX IF NOT EXISTS liquidity_positions_status_idx ON public.liquidity_positions(status);

CREATE INDEX IF NOT EXISTS defi_rewards_user_id_idx ON public.defi_rewards(user_id);
CREATE INDEX IF NOT EXISTS defi_rewards_position_type_idx ON public.defi_rewards(position_type);
CREATE INDEX IF NOT EXISTS defi_rewards_created_at_idx ON public.defi_rewards(created_at);

CREATE INDEX IF NOT EXISTS defi_strategies_user_id_idx ON public.defi_strategies(user_id);
CREATE INDEX IF NOT EXISTS defi_strategies_is_active_idx ON public.defi_strategies(is_active);

CREATE INDEX IF NOT EXISTS defi_analytics_user_id_date_idx ON public.defi_analytics(user_id, date);
CREATE INDEX IF NOT EXISTS protocol_configs_protocol_name_idx ON public.protocol_configs(protocol_name);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.staking_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yield_farming_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidity_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defi_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defi_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defi_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for staking_positions
CREATE POLICY "Users can manage their own staking positions"
  ON public.staking_positions
  FOR ALL
  USING (auth.uid() = user_id);

-- Create RLS policies for yield_farming_positions
CREATE POLICY "Users can manage their own yield farming positions"
  ON public.yield_farming_positions
  FOR ALL
  USING (auth.uid() = user_id);

-- Create RLS policies for liquidity_positions
CREATE POLICY "Users can manage their own liquidity positions"
  ON public.liquidity_positions
  FOR ALL
  USING (auth.uid() = user_id);

-- Create RLS policies for defi_rewards
CREATE POLICY "Users can view their own DeFi rewards"
  ON public.defi_rewards
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create DeFi reward entries"
  ON public.defi_rewards
  FOR INSERT
  WITH CHECK (true);

-- Create RLS policies for defi_strategies
CREATE POLICY "Users can manage their own DeFi strategies"
  ON public.defi_strategies
  FOR ALL
  USING (auth.uid() = user_id);

-- Create RLS policies for defi_analytics
CREATE POLICY "Users can view their own DeFi analytics"
  ON public.defi_analytics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create DeFi analytics entries"
  ON public.defi_analytics
  FOR INSERT
  WITH CHECK (true);

-- Create RLS policies for protocol_configs (read-only for users)
CREATE POLICY "Users can view protocol configurations"
  ON public.protocol_configs
  FOR SELECT
  USING (true);

-- Create functions for automated DeFi operations
CREATE OR REPLACE FUNCTION public.calculate_staking_rewards(
  p_position_id UUID,
  p_current_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS DECIMAL(20, 8)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_position RECORD;
  v_time_diff_hours DECIMAL;
  v_hourly_rate DECIMAL;
  v_new_rewards DECIMAL;
BEGIN
  -- Get staking position details
  SELECT * INTO v_position
  FROM public.staking_positions
  WHERE id = p_position_id AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate time difference in hours since last update
  v_time_diff_hours := EXTRACT(EPOCH FROM (p_current_timestamp - v_position.updated_at)) / 3600.0;
  
  -- Calculate hourly reward rate (APY / 365 / 24)
  v_hourly_rate := (v_position.apy / 100.0) / 365.0 / 24.0;
  
  -- Calculate new rewards
  v_new_rewards := v_position.staked_amount * v_hourly_rate * v_time_diff_hours;
  
  -- Update the position with new rewards
  UPDATE public.staking_positions
  SET current_rewards = current_rewards + v_new_rewards,
      total_rewards_earned = total_rewards_earned + v_new_rewards,
      updated_at = p_current_timestamp
  WHERE id = p_position_id;
  
  -- Insert reward record
  INSERT INTO public.defi_rewards (
    user_id, position_type, position_id, reward_token_id,
    reward_amount, reward_value_usd, reward_type
  ) VALUES (
    v_position.user_id, 'staking', p_position_id, v_position.token_id,
    v_new_rewards, v_new_rewards * 1.0, 'staking_reward' -- Simplified USD conversion
  );
  
  RETURN v_new_rewards;
END;
$$;

-- Create function to get user's DeFi portfolio summary
CREATE OR REPLACE FUNCTION public.get_user_defi_summary(p_user_id UUID)
RETURNS TABLE (
  total_staked_value DECIMAL(20, 8),
  total_farming_value DECIMAL(20, 8),
  total_liquidity_value DECIMAL(20, 8),
  total_rewards_earned DECIMAL(20, 8),
  average_apy DECIMAL(5, 2),
  active_positions INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(sp.staked_amount), 0) as total_staked_value,
    COALESCE(SUM(yf.token_a_amount + yf.token_b_amount), 0) as total_farming_value,
    COALESCE(SUM(lp.total_value_usd), 0) as total_liquidity_value,
    COALESCE(SUM(sp.total_rewards_earned) + SUM(yf.rewards_earned) + SUM(lp.fees_earned_a + lp.fees_earned_b), 0) as total_rewards_earned,
    COALESCE(AVG(sp.apy), 0) as average_apy,
    (
      (SELECT COUNT(*) FROM public.staking_positions WHERE user_id = p_user_id AND status = 'active') +
      (SELECT COUNT(*) FROM public.yield_farming_positions WHERE user_id = p_user_id AND status = 'active') +
      (SELECT COUNT(*) FROM public.liquidity_positions WHERE user_id = p_user_id AND status = 'active')
    )::INTEGER as active_positions
  FROM public.staking_positions sp
  FULL OUTER JOIN public.yield_farming_positions yf ON sp.user_id = yf.user_id
  FULL OUTER JOIN public.liquidity_positions lp ON sp.user_id = lp.user_id
  WHERE sp.user_id = p_user_id OR yf.user_id = p_user_id OR lp.user_id = p_user_id;
END;
$$;

-- Create trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply the trigger to relevant tables
CREATE TRIGGER update_staking_positions_updated_at
  BEFORE UPDATE ON public.staking_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_yield_farming_positions_updated_at
  BEFORE UPDATE ON public.yield_farming_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_liquidity_positions_updated_at
  BEFORE UPDATE ON public.liquidity_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_defi_strategies_updated_at
  BEFORE UPDATE ON public.defi_strategies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_protocol_configs_updated_at
  BEFORE UPDATE ON public.protocol_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default protocol configurations
INSERT INTO public.protocol_configs (
  protocol_name, protocol_type, network, contract_address, current_apy, risk_score, lock_period_days, supports_auto_compound
) VALUES 
  ('ethereum_2_0', 'staking', 'ethereum', '0x00000000219ab540356cBB839Cbe05303d7705Fa', 4.5, 3, 0, true),
  ('polygon_staking', 'staking', 'polygon', '0x5e3Ef299fDDf15eAa0432E6e66473ace8c13D908', 8.2, 4, 0, true),
  ('compound_v3', 'lending', 'ethereum', '0xc3d688B66703497DAA19211EEdff47f25384cdc3', 3.8, 2, 0, true),
  ('aave_v3', 'lending', 'ethereum', '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', 4.2, 2, 0, true),
  ('uniswap_v3', 'dex', 'ethereum', '0xE592427A0AEce92De3Edee1F18E0157C05861564', 12.5, 6, 0, false),
  ('curve_finance', 'yield_farming', 'ethereum', '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7', 7.8, 4, 0, true)
ON CONFLICT (protocol_name) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
