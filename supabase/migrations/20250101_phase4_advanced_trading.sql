-- Phase 4: Advanced Trading Database Schema
-- Created: January 1, 2025
-- Purpose: Support advanced trading features including limit orders, stop-loss, DCA automation

-- Create advanced_orders table for limit orders, stop-loss, take-profit
CREATE TABLE IF NOT EXISTS public.advanced_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_type TEXT NOT NULL CHECK (order_type IN ('limit', 'stop_loss', 'take_profit', 'dca', 'conditional')),
  from_token_id TEXT NOT NULL,
  to_token_id TEXT NOT NULL,
  from_amount DECIMAL(20, 8) NOT NULL,
  target_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8) NOT NULL,
  slippage DECIMAL(5, 2) NOT NULL DEFAULT 0.5,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'filled', 'cancelled', 'expired', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE,
  executed_price DECIMAL(20, 8),
  executed_amount DECIMAL(20, 8),
  conditions JSONB,
  metadata JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create DCA strategies table for dollar-cost averaging automation
CREATE TABLE IF NOT EXISTS public.dca_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_token_id TEXT NOT NULL,
  to_token_id TEXT NOT NULL,
  total_amount DECIMAL(20, 8) NOT NULL,
  interval_hours INTEGER NOT NULL,
  amount_per_interval DECIMAL(20, 8) NOT NULL,
  executed_intervals INTEGER NOT NULL DEFAULT 0,
  total_intervals INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  next_execution_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create DCA executions table to track individual DCA purchases
CREATE TABLE IF NOT EXISTS public.dca_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_id UUID NOT NULL REFERENCES public.dca_strategies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_token_id TEXT NOT NULL,
  to_token_id TEXT NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  transaction_hash TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'pending')),
  metadata JSONB
);

-- Create price alerts table for price monitoring
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_id TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('price_above', 'price_below', 'percentage_change')),
  target_value DECIMAL(20, 8) NOT NULL,
  current_value DECIMAL(20, 8),
  is_active BOOLEAN NOT NULL DEFAULT true,
  triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Create trading strategies table for advanced trading patterns
CREATE TABLE IF NOT EXISTS public.trading_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_name TEXT NOT NULL,
  strategy_type TEXT NOT NULL CHECK (strategy_type IN ('grid', 'momentum', 'mean_reversion', 'arbitrage', 'custom')),
  parameters JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  performance_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create risk_profiles table for user risk assessment
CREATE TABLE IF NOT EXISTS public.risk_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_tolerance TEXT NOT NULL CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive', 'very_aggressive')),
  max_position_size DECIMAL(20, 8),
  max_daily_loss DECIMAL(20, 8),
  preferred_assets JSONB,
  risk_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create order_history table for comprehensive order tracking
CREATE TABLE IF NOT EXISTS public.order_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID,
  order_type TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'modified', 'cancelled', 'filled', 'expired', 'failed')),
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS advanced_orders_user_id_idx ON public.advanced_orders(user_id);
CREATE INDEX IF NOT EXISTS advanced_orders_status_idx ON public.advanced_orders(status);
CREATE INDEX IF NOT EXISTS advanced_orders_expires_at_idx ON public.advanced_orders(expires_at);
CREATE INDEX IF NOT EXISTS advanced_orders_order_type_idx ON public.advanced_orders(order_type);

CREATE INDEX IF NOT EXISTS dca_strategies_user_id_idx ON public.dca_strategies(user_id);
CREATE INDEX IF NOT EXISTS dca_strategies_status_idx ON public.dca_strategies(status);
CREATE INDEX IF NOT EXISTS dca_strategies_next_execution_idx ON public.dca_strategies(next_execution_at);

CREATE INDEX IF NOT EXISTS dca_executions_strategy_id_idx ON public.dca_executions(strategy_id);
CREATE INDEX IF NOT EXISTS dca_executions_user_id_idx ON public.dca_executions(user_id);
CREATE INDEX IF NOT EXISTS dca_executions_executed_at_idx ON public.dca_executions(executed_at);

CREATE INDEX IF NOT EXISTS price_alerts_user_id_idx ON public.price_alerts(user_id);
CREATE INDEX IF NOT EXISTS price_alerts_token_id_idx ON public.price_alerts(token_id);
CREATE INDEX IF NOT EXISTS price_alerts_is_active_idx ON public.price_alerts(is_active);

CREATE INDEX IF NOT EXISTS trading_strategies_user_id_idx ON public.trading_strategies(user_id);
CREATE INDEX IF NOT EXISTS trading_strategies_is_active_idx ON public.trading_strategies(is_active);

CREATE INDEX IF NOT EXISTS order_history_user_id_idx ON public.order_history(user_id);
CREATE INDEX IF NOT EXISTS order_history_order_id_idx ON public.order_history(order_id);
CREATE INDEX IF NOT EXISTS order_history_timestamp_idx ON public.order_history(timestamp);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.advanced_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dca_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dca_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for advanced_orders
CREATE POLICY "Users can view their own advanced orders"
  ON public.advanced_orders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own advanced orders"
  ON public.advanced_orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own advanced orders"
  ON public.advanced_orders
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own advanced orders"
  ON public.advanced_orders
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for dca_strategies
CREATE POLICY "Users can view their own DCA strategies"
  ON public.dca_strategies
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own DCA strategies"
  ON public.dca_strategies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own DCA strategies"
  ON public.dca_strategies
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own DCA strategies"
  ON public.dca_strategies
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for dca_executions
CREATE POLICY "Users can view their own DCA executions"
  ON public.dca_executions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own DCA executions"
  ON public.dca_executions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for price_alerts
CREATE POLICY "Users can manage their own price alerts"
  ON public.price_alerts
  FOR ALL
  USING (auth.uid() = user_id);

-- Create RLS policies for trading_strategies
CREATE POLICY "Users can manage their own trading strategies"
  ON public.trading_strategies
  FOR ALL
  USING (auth.uid() = user_id);

-- Create RLS policies for risk_profiles
CREATE POLICY "Users can manage their own risk profile"
  ON public.risk_profiles
  FOR ALL
  USING (auth.uid() = user_id);

-- Create RLS policies for order_history
CREATE POLICY "Users can view their own order history"
  ON public.order_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create order history entries"
  ON public.order_history
  FOR INSERT
  WITH CHECK (true); -- Allow system to create entries

-- Create functions for automated order processing
CREATE OR REPLACE FUNCTION public.process_expired_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update expired orders
  UPDATE public.advanced_orders
  SET status = 'expired',
      updated_at = NOW()
  WHERE status IN ('pending', 'active')
    AND expires_at < NOW();
    
  -- Log the expiration
  INSERT INTO public.order_history (user_id, order_id, order_type, action, details)
  SELECT user_id, id, order_type, 'expired', 
         jsonb_build_object('expired_at', NOW(), 'reason', 'automatic_expiration')
  FROM public.advanced_orders
  WHERE status = 'expired'
    AND updated_at > NOW() - INTERVAL '1 minute';
END;
$$;

-- Create function for DCA execution scheduling
CREATE OR REPLACE FUNCTION public.get_pending_dca_executions()
RETURNS TABLE (
  strategy_id UUID,
  user_id UUID,
  from_token_id TEXT,
  to_token_id TEXT,
  amount_per_interval DECIMAL(20, 8)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ds.id,
    ds.user_id,
    ds.from_token_id,
    ds.to_token_id,
    ds.amount_per_interval
  FROM public.dca_strategies ds
  WHERE ds.status = 'active'
    AND ds.next_execution_at <= NOW()
    AND ds.executed_intervals < ds.total_intervals;
END;
$$;

-- Create function to update DCA strategy after execution
CREATE OR REPLACE FUNCTION public.update_dca_strategy_after_execution(
  p_strategy_id UUID,
  p_interval_hours INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.dca_strategies
  SET executed_intervals = executed_intervals + 1,
      next_execution_at = NOW() + (p_interval_hours || ' hours')::INTERVAL,
      updated_at = NOW(),
      status = CASE 
        WHEN executed_intervals + 1 >= total_intervals THEN 'completed'
        ELSE status
      END
  WHERE id = p_strategy_id;
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
CREATE TRIGGER update_advanced_orders_updated_at
  BEFORE UPDATE ON public.advanced_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dca_strategies_updated_at
  BEFORE UPDATE ON public.dca_strategies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trading_strategies_updated_at
  BEFORE UPDATE ON public.trading_strategies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_profiles_updated_at
  BEFORE UPDATE ON public.risk_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default risk profile for existing users (optional)
-- This can be run separately if needed
/*
INSERT INTO public.risk_profiles (user_id, risk_tolerance, max_position_size, max_daily_loss)
SELECT 
  id,
  'moderate',
  1000.00,
  100.00
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.risk_profiles);
*/

-- Create view for order analytics
CREATE OR REPLACE VIEW public.order_analytics AS
SELECT 
  user_id,
  order_type,
  status,
  COUNT(*) as order_count,
  AVG(CASE WHEN executed_price IS NOT NULL THEN executed_price ELSE target_price END) as avg_price,
  SUM(CASE WHEN status = 'filled' THEN from_amount ELSE 0 END) as total_filled_amount,
  MIN(created_at) as first_order_date,
  MAX(created_at) as last_order_date
FROM public.advanced_orders
GROUP BY user_id, order_type, status;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
