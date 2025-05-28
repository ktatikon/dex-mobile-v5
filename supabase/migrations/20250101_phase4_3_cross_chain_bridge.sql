-- Phase 4.3: Cross-Chain Bridge & Multi-Network Portfolio Database Schema
-- Created: January 1, 2025
-- Purpose: Support cross-chain bridges, multi-network portfolios, and Layer 2 integration

-- Create supported_networks table for network configuration
CREATE TABLE IF NOT EXISTS public.supported_networks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  network_id TEXT NOT NULL UNIQUE,
  network_name TEXT NOT NULL,
  network_type TEXT NOT NULL CHECK (network_type IN ('mainnet', 'layer2', 'sidechain', 'testnet')),
  chain_id INTEGER NOT NULL UNIQUE,
  rpc_url TEXT NOT NULL,
  explorer_url TEXT NOT NULL,
  native_token_symbol TEXT NOT NULL,
  native_token_decimals INTEGER NOT NULL DEFAULT 18,
  gas_price_gwei DECIMAL(10, 2) NOT NULL DEFAULT 20.0,
  block_time_seconds INTEGER NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  supports_eip1559 BOOLEAN NOT NULL DEFAULT false,
  bridge_enabled BOOLEAN NOT NULL DEFAULT false,
  defi_enabled BOOLEAN NOT NULL DEFAULT false,
  icon_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bridge_protocols table for supported bridge configurations
CREATE TABLE IF NOT EXISTS public.bridge_protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_name TEXT NOT NULL UNIQUE,
  protocol_type TEXT NOT NULL CHECK (protocol_type IN ('native', 'lock_mint', 'liquidity_pool', 'atomic_swap')),
  source_network_id TEXT NOT NULL REFERENCES public.supported_networks(network_id),
  destination_network_id TEXT NOT NULL REFERENCES public.supported_networks(network_id),
  contract_address_source TEXT NOT NULL,
  contract_address_destination TEXT NOT NULL,
  supported_tokens TEXT[] NOT NULL,
  min_transfer_amount DECIMAL(20, 8) NOT NULL DEFAULT 0.001,
  max_transfer_amount DECIMAL(20, 8),
  bridge_fee_percentage DECIMAL(5, 4) NOT NULL DEFAULT 0.0030, -- 0.3%
  estimated_time_minutes INTEGER NOT NULL DEFAULT 15,
  security_score INTEGER NOT NULL DEFAULT 5 CHECK (security_score >= 1 AND security_score <= 10),
  is_active BOOLEAN NOT NULL DEFAULT true,
  daily_volume_limit DECIMAL(20, 8),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cross_chain_transactions table for bridge transaction tracking
CREATE TABLE IF NOT EXISTS public.cross_chain_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bridge_protocol_id UUID NOT NULL REFERENCES public.bridge_protocols(id),
  source_network_id TEXT NOT NULL REFERENCES public.supported_networks(network_id),
  destination_network_id TEXT NOT NULL REFERENCES public.supported_networks(network_id),
  source_token_id TEXT NOT NULL,
  destination_token_id TEXT NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  bridge_fee DECIMAL(20, 8) NOT NULL DEFAULT 0,
  gas_fee_source DECIMAL(20, 8) NOT NULL DEFAULT 0,
  gas_fee_destination DECIMAL(20, 8) NOT NULL DEFAULT 0,
  exchange_rate DECIMAL(20, 8) NOT NULL DEFAULT 1.0,
  slippage_tolerance DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
  source_tx_hash TEXT,
  destination_tx_hash TEXT,
  source_block_number BIGINT,
  destination_block_number BIGINT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed_source', 'bridging', 'confirmed_destination', 'completed', 'failed', 'refunded')),
  failure_reason TEXT,
  estimated_completion_time TIMESTAMP WITH TIME ZONE,
  actual_completion_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create multi_network_balances table for cross-network balance tracking
CREATE TABLE IF NOT EXISTS public.multi_network_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  network_id TEXT NOT NULL REFERENCES public.supported_networks(network_id),
  token_id TEXT NOT NULL,
  token_address TEXT,
  balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
  balance_usd DECIMAL(20, 8) NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_native_token BOOLEAN NOT NULL DEFAULT false,
  token_decimals INTEGER NOT NULL DEFAULT 18,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, network_id, token_id)
);

-- Create network_gas_tracker table for gas price monitoring
CREATE TABLE IF NOT EXISTS public.network_gas_tracker (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  network_id TEXT NOT NULL REFERENCES public.supported_networks(network_id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  gas_price_gwei DECIMAL(10, 2) NOT NULL,
  gas_price_fast_gwei DECIMAL(10, 2) NOT NULL,
  gas_price_slow_gwei DECIMAL(10, 2) NOT NULL,
  base_fee_gwei DECIMAL(10, 2), -- For EIP-1559 networks
  priority_fee_gwei DECIMAL(10, 2), -- For EIP-1559 networks
  network_congestion_level TEXT NOT NULL DEFAULT 'normal' CHECK (network_congestion_level IN ('low', 'normal', 'high', 'extreme')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create cross_chain_strategies table for automated cross-chain strategies
CREATE TABLE IF NOT EXISTS public.cross_chain_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_name TEXT NOT NULL,
  strategy_type TEXT NOT NULL CHECK (strategy_type IN ('yield_arbitrage', 'gas_optimization', 'liquidity_farming', 'auto_bridge')),
  source_networks TEXT[] NOT NULL,
  target_networks TEXT[] NOT NULL,
  target_tokens TEXT[] NOT NULL,
  min_profit_threshold DECIMAL(5, 2) NOT NULL DEFAULT 2.0, -- Minimum 2% profit
  max_gas_price_gwei INTEGER NOT NULL DEFAULT 100,
  auto_execute BOOLEAN NOT NULL DEFAULT false,
  risk_tolerance TEXT NOT NULL CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_value_managed DECIMAL(20, 8) NOT NULL DEFAULT 0,
  total_profit_earned DECIMAL(20, 8) NOT NULL DEFAULT 0,
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_execution TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create network_defi_opportunities table for cross-network DeFi discovery
CREATE TABLE IF NOT EXISTS public.network_defi_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  network_id TEXT NOT NULL REFERENCES public.supported_networks(network_id),
  protocol_name TEXT NOT NULL,
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('staking', 'lending', 'yield_farming', 'liquidity_mining')),
  token_pair TEXT NOT NULL,
  apy DECIMAL(5, 2) NOT NULL,
  tvl_usd DECIMAL(20, 8) NOT NULL DEFAULT 0,
  risk_score INTEGER NOT NULL DEFAULT 5 CHECK (risk_score >= 1 AND risk_score <= 10),
  min_deposit DECIMAL(20, 8) NOT NULL DEFAULT 0,
  lock_period_days INTEGER DEFAULT 0,
  protocol_address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create multi_network_analytics table for portfolio analytics across networks
CREATE TABLE IF NOT EXISTS public.multi_network_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_portfolio_value_usd DECIMAL(20, 8) NOT NULL DEFAULT 0,
  network_distribution JSONB NOT NULL, -- {"ethereum": 45.5, "polygon": 30.2, "bsc": 24.3}
  cross_chain_transactions_count INTEGER NOT NULL DEFAULT 0,
  bridge_fees_paid DECIMAL(20, 8) NOT NULL DEFAULT 0,
  gas_fees_paid_total DECIMAL(20, 8) NOT NULL DEFAULT 0,
  yield_earned_cross_chain DECIMAL(20, 8) NOT NULL DEFAULT 0,
  arbitrage_profit DECIMAL(20, 8) NOT NULL DEFAULT 0,
  most_active_network TEXT,
  highest_yield_network TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS supported_networks_network_id_idx ON public.supported_networks(network_id);
CREATE INDEX IF NOT EXISTS supported_networks_is_active_idx ON public.supported_networks(is_active);
CREATE INDEX IF NOT EXISTS supported_networks_network_type_idx ON public.supported_networks(network_type);

CREATE INDEX IF NOT EXISTS bridge_protocols_source_network_idx ON public.bridge_protocols(source_network_id);
CREATE INDEX IF NOT EXISTS bridge_protocols_destination_network_idx ON public.bridge_protocols(destination_network_id);
CREATE INDEX IF NOT EXISTS bridge_protocols_is_active_idx ON public.bridge_protocols(is_active);

CREATE INDEX IF NOT EXISTS cross_chain_transactions_user_id_idx ON public.cross_chain_transactions(user_id);
CREATE INDEX IF NOT EXISTS cross_chain_transactions_status_idx ON public.cross_chain_transactions(status);
CREATE INDEX IF NOT EXISTS cross_chain_transactions_source_network_idx ON public.cross_chain_transactions(source_network_id);
CREATE INDEX IF NOT EXISTS cross_chain_transactions_destination_network_idx ON public.cross_chain_transactions(destination_network_id);
CREATE INDEX IF NOT EXISTS cross_chain_transactions_created_at_idx ON public.cross_chain_transactions(created_at);

CREATE INDEX IF NOT EXISTS multi_network_balances_user_id_idx ON public.multi_network_balances(user_id);
CREATE INDEX IF NOT EXISTS multi_network_balances_network_id_idx ON public.multi_network_balances(network_id);
CREATE INDEX IF NOT EXISTS multi_network_balances_user_network_idx ON public.multi_network_balances(user_id, network_id);

CREATE INDEX IF NOT EXISTS network_gas_tracker_network_id_idx ON public.network_gas_tracker(network_id);
CREATE INDEX IF NOT EXISTS network_gas_tracker_timestamp_idx ON public.network_gas_tracker(timestamp);

CREATE INDEX IF NOT EXISTS cross_chain_strategies_user_id_idx ON public.cross_chain_strategies(user_id);
CREATE INDEX IF NOT EXISTS cross_chain_strategies_is_active_idx ON public.cross_chain_strategies(is_active);

CREATE INDEX IF NOT EXISTS network_defi_opportunities_network_id_idx ON public.network_defi_opportunities(network_id);
CREATE INDEX IF NOT EXISTS network_defi_opportunities_apy_idx ON public.network_defi_opportunities(apy);
CREATE INDEX IF NOT EXISTS network_defi_opportunities_is_active_idx ON public.network_defi_opportunities(is_active);

CREATE INDEX IF NOT EXISTS multi_network_analytics_user_id_date_idx ON public.multi_network_analytics(user_id, date);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.supported_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bridge_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_chain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_network_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_gas_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_chain_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_defi_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_network_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for supported_networks (read-only for users)
CREATE POLICY "Users can view supported networks"
  ON public.supported_networks
  FOR SELECT
  USING (true);

-- Create RLS policies for bridge_protocols (read-only for users)
CREATE POLICY "Users can view bridge protocols"
  ON public.bridge_protocols
  FOR SELECT
  USING (true);

-- Create RLS policies for cross_chain_transactions
CREATE POLICY "Users can manage their own cross-chain transactions"
  ON public.cross_chain_transactions
  FOR ALL
  USING (auth.uid() = user_id);

-- Create RLS policies for multi_network_balances
CREATE POLICY "Users can manage their own multi-network balances"
  ON public.multi_network_balances
  FOR ALL
  USING (auth.uid() = user_id);

-- Create RLS policies for network_gas_tracker (read-only for users)
CREATE POLICY "Users can view network gas data"
  ON public.network_gas_tracker
  FOR SELECT
  USING (true);

-- Create RLS policies for cross_chain_strategies
CREATE POLICY "Users can manage their own cross-chain strategies"
  ON public.cross_chain_strategies
  FOR ALL
  USING (auth.uid() = user_id);

-- Create RLS policies for network_defi_opportunities (read-only for users)
CREATE POLICY "Users can view network DeFi opportunities"
  ON public.network_defi_opportunities
  FOR SELECT
  USING (true);

-- Create RLS policies for multi_network_analytics
CREATE POLICY "Users can view their own multi-network analytics"
  ON public.multi_network_analytics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create multi-network analytics entries"
  ON public.multi_network_analytics
  FOR INSERT
  WITH CHECK (true);

-- Create functions for cross-chain operations
CREATE OR REPLACE FUNCTION public.estimate_bridge_fee(
  p_bridge_protocol_id UUID,
  p_amount DECIMAL(20, 8)
)
RETURNS DECIMAL(20, 8)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_protocol RECORD;
  v_bridge_fee DECIMAL(20, 8);
BEGIN
  -- Get bridge protocol details
  SELECT * INTO v_protocol
  FROM public.bridge_protocols
  WHERE id = p_bridge_protocol_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Calculate bridge fee
  v_bridge_fee := p_amount * (v_protocol.bridge_fee_percentage / 100.0);

  RETURN v_bridge_fee;
END;
$$;

-- Create function to get user's multi-network portfolio summary
CREATE OR REPLACE FUNCTION public.get_user_multi_network_summary(p_user_id UUID)
RETURNS TABLE (
  total_portfolio_value DECIMAL(20, 8),
  network_count INTEGER,
  active_networks TEXT[],
  largest_network_allocation TEXT,
  cross_chain_transactions_count INTEGER,
  total_bridge_fees_paid DECIMAL(20, 8)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(mnb.balance_usd), 0) as total_portfolio_value,
    COUNT(DISTINCT mnb.network_id)::INTEGER as network_count,
    ARRAY_AGG(DISTINCT mnb.network_id) as active_networks,
    (
      SELECT mnb2.network_id
      FROM public.multi_network_balances mnb2
      WHERE mnb2.user_id = p_user_id
      GROUP BY mnb2.network_id
      ORDER BY SUM(mnb2.balance_usd) DESC
      LIMIT 1
    ) as largest_network_allocation,
    (
      SELECT COUNT(*)::INTEGER
      FROM public.cross_chain_transactions cct
      WHERE cct.user_id = p_user_id
    ) as cross_chain_transactions_count,
    (
      SELECT COALESCE(SUM(cct2.bridge_fee), 0)
      FROM public.cross_chain_transactions cct2
      WHERE cct2.user_id = p_user_id AND cct2.status = 'completed'
    ) as total_bridge_fees_paid
  FROM public.multi_network_balances mnb
  WHERE mnb.user_id = p_user_id;
END;
$$;

-- Create function to update cross-chain transaction status
CREATE OR REPLACE FUNCTION public.update_cross_chain_transaction_status(
  p_transaction_id UUID,
  p_new_status TEXT,
  p_tx_hash TEXT DEFAULT NULL,
  p_block_number BIGINT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction RECORD;
BEGIN
  -- Get transaction details
  SELECT * INTO v_transaction
  FROM public.cross_chain_transactions
  WHERE id = p_transaction_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Update transaction based on status
  IF p_new_status = 'confirmed_source' THEN
    UPDATE public.cross_chain_transactions
    SET status = p_new_status,
        source_tx_hash = COALESCE(p_tx_hash, source_tx_hash),
        source_block_number = COALESCE(p_block_number, source_block_number),
        updated_at = NOW()
    WHERE id = p_transaction_id;

  ELSIF p_new_status = 'confirmed_destination' OR p_new_status = 'completed' THEN
    UPDATE public.cross_chain_transactions
    SET status = p_new_status,
        destination_tx_hash = COALESCE(p_tx_hash, destination_tx_hash),
        destination_block_number = COALESCE(p_block_number, destination_block_number),
        actual_completion_time = CASE WHEN p_new_status = 'completed' THEN NOW() ELSE actual_completion_time END,
        updated_at = NOW()
    WHERE id = p_transaction_id;

  ELSIF p_new_status = 'failed' THEN
    UPDATE public.cross_chain_transactions
    SET status = p_new_status,
        failure_reason = p_failure_reason,
        updated_at = NOW()
    WHERE id = p_transaction_id;

  ELSE
    UPDATE public.cross_chain_transactions
    SET status = p_new_status,
        updated_at = NOW()
    WHERE id = p_transaction_id;
  END IF;

  RETURN true;
END;
$$;

-- Create trigger to automatically update updated_at timestamps
CREATE TRIGGER update_supported_networks_updated_at
  BEFORE UPDATE ON public.supported_networks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bridge_protocols_updated_at
  BEFORE UPDATE ON public.bridge_protocols
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cross_chain_transactions_updated_at
  BEFORE UPDATE ON public.cross_chain_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cross_chain_strategies_updated_at
  BEFORE UPDATE ON public.cross_chain_strategies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default supported networks with comprehensive configurations
INSERT INTO public.supported_networks (
  network_id, network_name, network_type, chain_id, rpc_url, explorer_url,
  native_token_symbol, native_token_decimals, gas_price_gwei, block_time_seconds,
  is_active, supports_eip1559, bridge_enabled, defi_enabled, icon_url, metadata
) VALUES
  ('ethereum', 'Ethereum Mainnet', 'mainnet', 1, 'https://mainnet.infura.io/v3/', 'https://etherscan.io', 'ETH', 18, 30.0, 15, true, true, true, true, '/icons/ethereum.svg', '{"description": "Ethereum mainnet with full DeFi ecosystem", "color": "#627EEA"}'),
  ('polygon', 'Polygon', 'sidechain', 137, 'https://polygon-rpc.com', 'https://polygonscan.com', 'MATIC', 18, 30.0, 2, true, true, true, true, '/icons/polygon.svg', '{"description": "Polygon sidechain with low fees", "color": "#8247E5"}'),
  ('bsc', 'Binance Smart Chain', 'sidechain', 56, 'https://bsc-dataseed.binance.org', 'https://bscscan.com', 'BNB', 18, 5.0, 3, true, false, true, true, '/icons/bsc.svg', '{"description": "Binance Smart Chain with high throughput", "color": "#F3BA2F"}'),
  ('arbitrum', 'Arbitrum One', 'layer2', 42161, 'https://arb1.arbitrum.io/rpc', 'https://arbiscan.io', 'ETH', 18, 0.1, 1, true, true, true, true, '/icons/arbitrum.svg', '{"description": "Arbitrum Layer 2 with low fees", "color": "#28A0F0"}'),
  ('optimism', 'Optimism', 'layer2', 10, 'https://mainnet.optimism.io', 'https://optimistic.etherscan.io', 'ETH', 18, 0.001, 2, true, true, true, true, '/icons/optimism.svg', '{"description": "Optimism Layer 2 scaling solution", "color": "#FF0420"}'),
  ('avalanche', 'Avalanche C-Chain', 'mainnet', 43114, 'https://api.avax.network/ext/bc/C/rpc', 'https://snowtrace.io', 'AVAX', 18, 25.0, 2, true, true, true, true, '/icons/avalanche.svg', '{"description": "Avalanche high-performance blockchain", "color": "#E84142"}'),
  ('fantom', 'Fantom Opera', 'mainnet', 250, 'https://rpc.ftm.tools', 'https://ftmscan.com', 'FTM', 18, 20.0, 1, true, false, true, true, '/icons/fantom.svg', '{"description": "Fantom fast and secure blockchain", "color": "#1969FF"}')
ON CONFLICT (network_id) DO NOTHING;

-- Insert default bridge protocols with comprehensive configurations
INSERT INTO public.bridge_protocols (
  protocol_name, protocol_type, source_network_id, destination_network_id,
  contract_address_source, contract_address_destination, supported_tokens,
  min_transfer_amount, max_transfer_amount, bridge_fee_percentage, estimated_time_minutes,
  security_score, is_active, daily_volume_limit, metadata
) VALUES
  -- Ethereum to Layer 2 bridges
  ('Polygon Bridge', 'lock_mint', 'ethereum', 'polygon', '0xA0c68C638235ee32657e8f720a23ceC1bFc77C77', '0x8484Ef722627bf18ca5Ae6BcF031c23E6e922B30', ARRAY['ETH', 'USDC', 'USDT', 'DAI', 'WBTC'], 0.01, 1000.0, 0.0000, 45, 9, true, 10000.0, '{"type": "official", "audit_status": "audited", "tvl_usd": 2500000000}'),
  ('Arbitrum Bridge', 'native', 'ethereum', 'arbitrum', '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a', '0x0000000000000000000000000000000000000001', ARRAY['ETH', 'USDC', 'USDT', 'DAI', 'WBTC'], 0.01, 1000.0, 0.0000, 15, 9, true, 10000.0, '{"type": "official", "audit_status": "audited", "tvl_usd": 3200000000}'),
  ('Optimism Bridge', 'native', 'ethereum', 'optimism', '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1', '0x4200000000000000000000000000000000000010', ARRAY['ETH', 'USDC', 'USDT', 'DAI', 'WBTC'], 0.01, 1000.0, 0.0000, 20, 9, true, 10000.0, '{"type": "official", "audit_status": "audited", "tvl_usd": 1800000000}'),

  -- Cross-chain bridges between different networks
  ('Multichain Bridge ETH-BSC', 'liquidity_pool', 'ethereum', 'bsc', '0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE', '0xd1C5966f9F5Ee6881Ff6b261BBeDa45972B1B5f3', ARRAY['ETH', 'USDC', 'USDT'], 0.1, 500.0, 0.0010, 30, 7, true, 5000.0, '{"type": "third_party", "audit_status": "audited", "tvl_usd": 800000000}'),
  ('Avalanche Bridge', 'lock_mint', 'ethereum', 'avalanche', '0x8EB8a3b98659Cce290402893d0123abb75E3ab28', '0x50Ff3B278fCC70ec7A9465063d68029AB460eA04', ARRAY['ETH', 'USDC', 'USDT', 'DAI'], 0.01, 1000.0, 0.0005, 25, 8, true, 8000.0, '{"type": "official", "audit_status": "audited", "tvl_usd": 1200000000}'),
  ('Fantom Multichain', 'liquidity_pool', 'ethereum', 'fantom', '0xC564EE9f21Ed8A2d8E7e76c085740d5e4c5FaFbE', '0x1B6382DBDEa11d97f24495C9A90b7c88469134a4', ARRAY['ETH', 'USDC', 'USDT'], 0.1, 500.0, 0.0015, 35, 6, true, 3000.0, '{"type": "third_party", "audit_status": "audited", "tvl_usd": 400000000}'),

  -- Layer 2 to Layer 2 bridges
  ('Hop Protocol ARB-OP', 'liquidity_pool', 'arbitrum', 'optimism', '0xb8901acB165ed027E32754E0FFe830802919727f', '0x83f6244Bd87662118d96D9a6D44f09dffF14b30E', ARRAY['ETH', 'USDC'], 0.01, 100.0, 0.0025, 10, 7, true, 2000.0, '{"type": "third_party", "audit_status": "audited", "tvl_usd": 150000000}'),
  ('Polygon-BSC Bridge', 'liquidity_pool', 'polygon', 'bsc', '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', ARRAY['USDC', 'USDT'], 0.1, 1000.0, 0.0015, 20, 6, true, 3000.0, '{"type": "third_party", "audit_status": "audited", "tvl_usd": 200000000}'),
  ('Synapse Bridge AVAX-FTM', 'liquidity_pool', 'avalanche', 'fantom', '0x2D5e230F9471438573EC67A2C4b938C5C8c75Ac1', '0xAf41a65F786339e7911F4acDAD6BD49426F2Dc6b', ARRAY['USDC', 'USDT'], 0.1, 500.0, 0.0020, 25, 6, true, 1500.0, '{"type": "third_party", "audit_status": "audited", "tvl_usd": 100000000}')
ON CONFLICT (protocol_name) DO NOTHING;

-- Insert sample DeFi opportunities across networks
INSERT INTO public.network_defi_opportunities (
  network_id, protocol_name, opportunity_type, token_pair, apy, tvl_usd, risk_score,
  min_deposit, lock_period_days, protocol_address, is_active
) VALUES
  -- Ethereum DeFi opportunities
  ('ethereum', 'Compound V3', 'lending', 'USDC', 4.2, 1500000000, 2, 1.0, 0, '0xc3d688B66703497DAA19211EEdff47f25384cdc3', true),
  ('ethereum', 'Aave V3', 'lending', 'ETH', 3.8, 2200000000, 2, 0.01, 0, '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', true),
  ('ethereum', 'Uniswap V3', 'liquidity_mining', 'ETH-USDC', 12.5, 800000000, 6, 0.1, 0, '0xE592427A0AEce92De3Edee1F18E0157C05861564', true),
  ('ethereum', 'Curve Finance', 'yield_farming', 'stETH-ETH', 5.8, 650000000, 3, 0.1, 0, '0xDC24316b9AE028F1497c275EB9192a3Ea0f67022', true),
  ('ethereum', 'Lido', 'staking', 'ETH', 4.5, 18000000000, 2, 0.01, 0, '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', true),

  -- Polygon DeFi opportunities
  ('polygon', 'Aave V3', 'lending', 'MATIC', 8.7, 450000000, 3, 10.0, 0, '0x794a61358D6845594F94dc1DB02A252b5b4814aD', true),
  ('polygon', 'QuickSwap', 'yield_farming', 'MATIC-USDC', 15.3, 120000000, 5, 1.0, 0, '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', true),
  ('polygon', 'Balancer', 'liquidity_mining', 'WMATIC-USDC-DAI', 11.2, 85000000, 4, 1.0, 0, '0xBA12222222228d8Ba445958a75a0704d566BF2C8', true),
  ('polygon', 'Curve Finance', 'yield_farming', 'USDC-USDT-DAI', 7.5, 95000000, 3, 10.0, 0, '0x445FE580eF8d70FF569aB36e80c647af338db351', true),

  -- BSC DeFi opportunities
  ('bsc', 'PancakeSwap', 'yield_farming', 'BNB-BUSD', 18.2, 300000000, 4, 0.1, 0, '0x10ED43C718714eb63d5aA57B78B54704E256024E', true),
  ('bsc', 'Venus Protocol', 'lending', 'BNB', 12.5, 180000000, 5, 0.1, 0, '0xfD36E2c2a6789Db23113685031d7F16329158384', true),
  ('bsc', 'Alpaca Finance', 'yield_farming', 'BNB-ALPACA', 25.8, 45000000, 7, 0.1, 0, '0xA625AB01B08ce023B2a342Dbb12a16f2C8489A8F', true),

  -- Arbitrum DeFi opportunities
  ('arbitrum', 'GMX', 'staking', 'GMX', 22.1, 180000000, 7, 1.0, 0, '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a', true),
  ('arbitrum', 'Camelot', 'liquidity_mining', 'ARB-ETH', 19.5, 65000000, 6, 0.1, 0, '0xc873fEcbd354f5A56E00E710B90EF4201db2448d', true),
  ('arbitrum', 'Radiant Capital', 'lending', 'ETH', 8.2, 120000000, 4, 0.01, 0, '0x2032b9A8e9F7e76768CA9271003d3e43E1616B1F', true),

  -- Optimism DeFi opportunities
  ('optimism', 'Velodrome', 'liquidity_mining', 'OP-USDC', 14.8, 95000000, 5, 1.0, 0, '0x9c12939390052919aF3155f41Bf4160Fd3666A6f', true),
  ('optimism', 'Beethoven X', 'liquidity_mining', 'OP-ETH-USDC', 16.2, 42000000, 6, 0.1, 0, '0xBA12222222228d8Ba445958a75a0704d566BF2C8', true),
  ('optimism', 'Aave V3', 'lending', 'ETH', 4.1, 85000000, 2, 0.01, 0, '0x794a61358D6845594F94dc1DB02A252b5b4814aD', true),

  -- Avalanche DeFi opportunities
  ('avalanche', 'Trader Joe', 'yield_farming', 'AVAX-USDC', 16.5, 75000000, 6, 0.5, 0, '0x60aE616a2155Ee3d9A68541Ba4544862310933d4', true),
  ('avalanche', 'Benqi', 'lending', 'AVAX', 9.8, 125000000, 4, 1.0, 0, '0x5C0401e81Bc07Ca70fAD469b451682c0d747Ef1c', true),
  ('avalanche', 'Platypus Finance', 'yield_farming', 'USDC-USDT', 12.3, 38000000, 5, 10.0, 0, '0x66357dCaCe80431aee0A7507e2E361B7e2402370', true),

  -- Fantom DeFi opportunities
  ('fantom', 'SpookySwap', 'yield_farming', 'FTM-USDC', 21.5, 35000000, 6, 1.0, 0, '0xF491e7B69E4244ad4002BC14e878a34207E38c29', true),
  ('fantom', 'Geist Finance', 'lending', 'FTM', 15.2, 28000000, 5, 1.0, 0, '0x9FAD24f572045c7869117160A571B2e50b10d068', true),
  ('fantom', 'Beethoven X', 'liquidity_mining', 'FTM-USDC-DAI', 18.7, 22000000, 6, 1.0, 0, '0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce', true)
ON CONFLICT DO NOTHING;

-- Insert initial gas tracker data for all networks
INSERT INTO public.network_gas_tracker (
  network_id, gas_price_gwei, gas_price_fast_gwei, gas_price_slow_gwei,
  base_fee_gwei, priority_fee_gwei, network_congestion_level
) VALUES
  ('ethereum', 25.0, 35.0, 15.0, 20.0, 5.0, 'normal'),
  ('polygon', 30.0, 50.0, 20.0, NULL, NULL, 'normal'),
  ('bsc', 5.0, 8.0, 3.0, NULL, NULL, 'low'),
  ('arbitrum', 0.1, 0.2, 0.05, 0.08, 0.02, 'low'),
  ('optimism', 0.001, 0.002, 0.0005, 0.0008, 0.0002, 'low'),
  ('avalanche', 25.0, 40.0, 15.0, NULL, NULL, 'normal'),
  ('fantom', 20.0, 35.0, 10.0, NULL, NULL, 'normal')
ON CONFLICT DO NOTHING;

-- Create additional functions for cross-chain analytics
CREATE OR REPLACE FUNCTION public.get_optimal_bridge_route(
  p_source_network TEXT,
  p_destination_network TEXT,
  p_token_id TEXT,
  p_amount DECIMAL(20, 8)
)
RETURNS TABLE (
  protocol_name TEXT,
  estimated_fee DECIMAL(20, 8),
  estimated_time_minutes INTEGER,
  security_score INTEGER,
  total_cost_usd DECIMAL(20, 8)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bp.protocol_name,
    public.estimate_bridge_fee(bp.id, p_amount) as estimated_fee,
    bp.estimated_time_minutes,
    bp.security_score,
    (public.estimate_bridge_fee(bp.id, p_amount) * 1.0) as total_cost_usd -- Simplified USD conversion
  FROM public.bridge_protocols bp
  WHERE bp.source_network_id = p_source_network
    AND bp.destination_network_id = p_destination_network
    AND p_token_id = ANY(bp.supported_tokens)
    AND bp.is_active = true
    AND p_amount >= bp.min_transfer_amount
    AND (bp.max_transfer_amount IS NULL OR p_amount <= bp.max_transfer_amount)
  ORDER BY total_cost_usd ASC, bp.security_score DESC, bp.estimated_time_minutes ASC;
END;
$$;

-- Create function to get network gas recommendations
CREATE OR REPLACE FUNCTION public.get_network_gas_recommendations(p_network_id TEXT)
RETURNS TABLE (
  current_gas_price DECIMAL(10, 2),
  recommended_gas_price DECIMAL(10, 2),
  congestion_level TEXT,
  estimated_wait_time_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gas_data RECORD;
BEGIN
  -- Get latest gas data for the network
  SELECT * INTO v_gas_data
  FROM public.network_gas_tracker
  WHERE network_id = p_network_id
  ORDER BY timestamp DESC
  LIMIT 1;

  IF NOT FOUND THEN
    -- Return default values if no data found
    RETURN QUERY
    SELECT
      20.0::DECIMAL(10, 2) as current_gas_price,
      25.0::DECIMAL(10, 2) as recommended_gas_price,
      'normal'::TEXT as congestion_level,
      15::INTEGER as estimated_wait_time_minutes;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    v_gas_data.gas_price_gwei as current_gas_price,
    CASE
      WHEN v_gas_data.network_congestion_level = 'low' THEN v_gas_data.gas_price_slow_gwei
      WHEN v_gas_data.network_congestion_level = 'normal' THEN v_gas_data.gas_price_gwei
      WHEN v_gas_data.network_congestion_level = 'high' THEN v_gas_data.gas_price_fast_gwei
      ELSE v_gas_data.gas_price_fast_gwei * 1.2
    END as recommended_gas_price,
    v_gas_data.network_congestion_level,
    CASE
      WHEN v_gas_data.network_congestion_level = 'low' THEN 5
      WHEN v_gas_data.network_congestion_level = 'normal' THEN 15
      WHEN v_gas_data.network_congestion_level = 'high' THEN 30
      ELSE 60
    END as estimated_wait_time_minutes;
END;
$$;

-- Create function to calculate cross-chain arbitrage opportunities
CREATE OR REPLACE FUNCTION public.find_arbitrage_opportunities(
  p_user_id UUID,
  p_min_profit_percentage DECIMAL(5, 2) DEFAULT 2.0
)
RETURNS TABLE (
  source_network TEXT,
  destination_network TEXT,
  token_id TEXT,
  source_price DECIMAL(20, 8),
  destination_price DECIMAL(20, 8),
  profit_percentage DECIMAL(5, 2),
  estimated_profit_usd DECIMAL(20, 8),
  bridge_protocol TEXT,
  total_fees DECIMAL(20, 8)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This is a simplified arbitrage finder
  -- In production, this would integrate with real-time price feeds
  RETURN QUERY
  SELECT
    'ethereum'::TEXT as source_network,
    'polygon'::TEXT as destination_network,
    'USDC'::TEXT as token_id,
    1.000::DECIMAL(20, 8) as source_price,
    1.002::DECIMAL(20, 8) as destination_price,
    0.20::DECIMAL(5, 2) as profit_percentage,
    20.0::DECIMAL(20, 8) as estimated_profit_usd,
    'Polygon Bridge'::TEXT as bridge_protocol,
    5.0::DECIMAL(20, 8) as total_fees
  WHERE 0.20 >= p_min_profit_percentage; -- Example condition
END;
$$;

-- Create function to update network gas prices (for automated updates)
CREATE OR REPLACE FUNCTION public.update_network_gas_prices(
  p_network_id TEXT,
  p_gas_price_gwei DECIMAL(10, 2),
  p_gas_price_fast_gwei DECIMAL(10, 2),
  p_gas_price_slow_gwei DECIMAL(10, 2),
  p_base_fee_gwei DECIMAL(10, 2) DEFAULT NULL,
  p_priority_fee_gwei DECIMAL(10, 2) DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_congestion_level TEXT;
BEGIN
  -- Determine congestion level based on gas prices
  IF p_gas_price_gwei < 10 THEN
    v_congestion_level := 'low';
  ELSIF p_gas_price_gwei < 30 THEN
    v_congestion_level := 'normal';
  ELSIF p_gas_price_gwei < 100 THEN
    v_congestion_level := 'high';
  ELSE
    v_congestion_level := 'extreme';
  END IF;

  -- Insert new gas price record
  INSERT INTO public.network_gas_tracker (
    network_id, gas_price_gwei, gas_price_fast_gwei, gas_price_slow_gwei,
    base_fee_gwei, priority_fee_gwei, network_congestion_level
  ) VALUES (
    p_network_id, p_gas_price_gwei, p_gas_price_fast_gwei, p_gas_price_slow_gwei,
    p_base_fee_gwei, p_priority_fee_gwei, v_congestion_level
  );

  -- Update the supported_networks table with latest gas price
  UPDATE public.supported_networks
  SET gas_price_gwei = p_gas_price_gwei,
      updated_at = NOW()
  WHERE network_id = p_network_id;

  RETURN true;
END;
$$;

-- Create function to get user's multi-network portfolio summary
CREATE OR REPLACE FUNCTION public.get_user_multi_network_summary(p_user_id UUID)
RETURNS TABLE (
  total_portfolio_value DECIMAL(20, 8),
  network_count INTEGER,
  active_networks TEXT[],
  largest_network_allocation TEXT,
  cross_chain_transactions_count INTEGER,
  total_bridge_fees_paid DECIMAL(20, 8)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_value DECIMAL(20, 8) := 0;
  v_network_count INTEGER := 0;
  v_active_networks TEXT[] := ARRAY[]::TEXT[];
  v_largest_network TEXT := '';
  v_bridge_count INTEGER := 0;
  v_total_fees DECIMAL(20, 8) := 0;
BEGIN
  -- Get total portfolio value across all networks (simplified calculation)
  SELECT COALESCE(SUM(balance_usd), 0) INTO v_total_value
  FROM public.multi_network_balances
  WHERE user_id = p_user_id;

  -- Get count of active networks
  SELECT COUNT(DISTINCT network_id) INTO v_network_count
  FROM public.multi_network_balances
  WHERE user_id = p_user_id AND balance > 0;

  -- Get list of active networks
  SELECT ARRAY_AGG(DISTINCT network_id) INTO v_active_networks
  FROM public.multi_network_balances
  WHERE user_id = p_user_id AND balance > 0;

  -- Get largest network allocation
  SELECT network_id INTO v_largest_network
  FROM public.multi_network_balances
  WHERE user_id = p_user_id
  GROUP BY network_id
  ORDER BY SUM(balance_usd) DESC
  LIMIT 1;

  -- Get cross-chain transaction count
  SELECT COUNT(*) INTO v_bridge_count
  FROM public.cross_chain_transactions
  WHERE user_id = p_user_id;

  -- Get total bridge fees paid
  SELECT COALESCE(SUM(bridge_fee + gas_fee_source + gas_fee_destination), 0) INTO v_total_fees
  FROM public.cross_chain_transactions
  WHERE user_id = p_user_id AND status = 'completed';

  RETURN QUERY
  SELECT
    v_total_value as total_portfolio_value,
    v_network_count as network_count,
    COALESCE(v_active_networks, ARRAY[]::TEXT[]) as active_networks,
    COALESCE(v_largest_network, '') as largest_network_allocation,
    v_bridge_count as cross_chain_transactions_count,
    v_total_fees as total_bridge_fees_paid;
END;
$$;

-- Create function to update multi-network balances
CREATE OR REPLACE FUNCTION public.update_multi_network_balance(
  p_user_id UUID,
  p_network_id TEXT,
  p_token_id TEXT,
  p_token_address TEXT,
  p_balance DECIMAL(20, 8),
  p_balance_usd DECIMAL(20, 8),
  p_is_native_token BOOLEAN DEFAULT false,
  p_token_decimals INTEGER DEFAULT 18
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.multi_network_balances (
    user_id, network_id, token_id, token_address, balance, balance_usd,
    is_native_token, token_decimals, last_updated
  ) VALUES (
    p_user_id, p_network_id, p_token_id, p_token_address, p_balance, p_balance_usd,
    p_is_native_token, p_token_decimals, NOW()
  )
  ON CONFLICT (user_id, network_id, token_id)
  DO UPDATE SET
    balance = EXCLUDED.balance,
    balance_usd = EXCLUDED.balance_usd,
    token_address = EXCLUDED.token_address,
    is_native_token = EXCLUDED.is_native_token,
    token_decimals = EXCLUDED.token_decimals,
    last_updated = NOW();

  RETURN true;
END;
$$;

-- Create function to get bridge transaction history for a user
CREATE OR REPLACE FUNCTION public.get_user_bridge_transactions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  bridge_protocol_name TEXT,
  source_network_name TEXT,
  destination_network_name TEXT,
  source_token_id TEXT,
  destination_token_id TEXT,
  amount DECIMAL(20, 8),
  bridge_fee DECIMAL(20, 8),
  total_fees DECIMAL(20, 8),
  status TEXT,
  source_tx_hash TEXT,
  destination_tx_hash TEXT,
  estimated_completion_time TIMESTAMPTZ,
  actual_completion_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cct.id,
    bp.protocol_name as bridge_protocol_name,
    sn.network_name as source_network_name,
    dn.network_name as destination_network_name,
    cct.source_token_id,
    cct.destination_token_id,
    cct.amount,
    cct.bridge_fee,
    (cct.bridge_fee + cct.gas_fee_source + cct.gas_fee_destination) as total_fees,
    cct.status::TEXT,
    cct.source_tx_hash,
    cct.destination_tx_hash,
    cct.estimated_completion_time,
    cct.actual_completion_time,
    cct.created_at
  FROM public.cross_chain_transactions cct
  LEFT JOIN public.bridge_protocols bp ON cct.bridge_protocol_id = bp.id
  LEFT JOIN public.supported_networks sn ON cct.source_network_id = sn.network_id
  LEFT JOIN public.supported_networks dn ON cct.destination_network_id = dn.network_id
  WHERE cct.user_id = p_user_id
  ORDER BY cct.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
