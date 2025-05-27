-- Enhanced Wallet Schema Migration
-- This migration enhances the existing wallet tables and creates a unified wallets table

-- 1. ENHANCE generated_wallets TABLE
-- Add new columns to existing generated_wallets table
ALTER TABLE generated_wallets 
ADD COLUMN IF NOT EXISTS private_keys JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS public_keys JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS wallet_address TEXT,
ADD COLUMN IF NOT EXISTS network TEXT DEFAULT 'ethereum',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing generated_wallets to populate wallet_address from addresses
UPDATE generated_wallets 
SET wallet_address = COALESCE(
  addresses->>'ETH',
  addresses->>'BTC', 
  (SELECT value FROM jsonb_each_text(addresses) LIMIT 1)
)
WHERE wallet_address IS NULL AND addresses IS NOT NULL;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_generated_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generated_wallets_updated_at_trigger ON generated_wallets;
CREATE TRIGGER generated_wallets_updated_at_trigger
  BEFORE UPDATE ON generated_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_generated_wallets_updated_at();

-- 2. ENHANCE wallet_connections TABLE
-- Add new columns to existing wallet_connections table
ALTER TABLE wallet_connections
ADD COLUMN IF NOT EXISTS addresses JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS encrypted_seed_phrase TEXT,
ADD COLUMN IF NOT EXISTS private_keys JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS public_keys JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS connection_method TEXT DEFAULT 'browser_extension',
ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing wallet_connections to populate addresses from address
UPDATE wallet_connections 
SET addresses = jsonb_build_object('ETH', address)
WHERE addresses = '{}' AND address IS NOT NULL;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_wallet_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wallet_connections_updated_at_trigger ON wallet_connections;
CREATE TRIGGER wallet_connections_updated_at_trigger
  BEFORE UPDATE ON wallet_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_connections_updated_at();

-- 3. CREATE UNIFIED wallets TABLE
-- Drop existing wallets table if it exists (it has wrong schema)
DROP TABLE IF EXISTS wallets CASCADE;

-- Create new unified wallets table
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_name TEXT NOT NULL,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('generated', 'hot', 'hardware')),
  wallet_address TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'ethereum',
  provider TEXT NOT NULL,
  source_table TEXT NOT NULL CHECK (source_table IN ('generated_wallets', 'wallet_connections')),
  source_id UUID NOT NULL,
  addresses JSONB NOT NULL DEFAULT '{}',
  encrypted_seed_phrase TEXT,
  private_keys JSONB DEFAULT '{}',
  public_keys JSONB DEFAULT '{}',
  connection_method TEXT,
  device_info JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS wallets_user_id_idx ON wallets(user_id);
CREATE INDEX IF NOT EXISTS wallets_wallet_type_idx ON wallets(wallet_type);
CREATE INDEX IF NOT EXISTS wallets_is_active_idx ON wallets(is_active);
CREATE INDEX IF NOT EXISTS wallets_source_table_idx ON wallets(source_table);
CREATE INDEX IF NOT EXISTS wallets_source_id_idx ON wallets(source_id);
CREATE INDEX IF NOT EXISTS wallets_wallet_address_idx ON wallets(wallet_address);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallets_updated_at_trigger
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_wallets_updated_at();

-- 4. POPULATE UNIFIED wallets TABLE
-- Insert from generated_wallets
INSERT INTO wallets (
  user_id, wallet_name, wallet_type, wallet_address, network, provider,
  source_table, source_id, addresses, encrypted_seed_phrase, private_keys,
  public_keys, connection_method, device_info, is_active, created_at, updated_at
)
SELECT 
  user_id,
  name as wallet_name,
  'generated' as wallet_type,
  COALESCE(wallet_address, addresses->>'ETH', addresses->>'BTC', 
    (SELECT value FROM jsonb_each_text(addresses) LIMIT 1)) as wallet_address,
  COALESCE(network, 'ethereum') as network,
  'custom_ai' as provider,
  'generated_wallets' as source_table,
  id as source_id,
  addresses,
  encrypted_seed_phrase,
  COALESCE(private_keys, '{}') as private_keys,
  COALESCE(public_keys, '{}') as public_keys,
  'seed_phrase' as connection_method,
  '{}' as device_info,
  COALESCE(is_active, true) as is_active,
  created_at,
  COALESCE(updated_at, created_at) as updated_at
FROM generated_wallets
WHERE COALESCE(wallet_address, addresses->>'ETH', addresses->>'BTC', 
  (SELECT value FROM jsonb_each_text(addresses) LIMIT 1)) IS NOT NULL;

-- Insert from wallet_connections
INSERT INTO wallets (
  user_id, wallet_name, wallet_type, wallet_address, network, provider,
  source_table, source_id, addresses, encrypted_seed_phrase, private_keys,
  public_keys, connection_method, device_info, is_active, created_at, updated_at
)
SELECT 
  user_id,
  wallet_name,
  wallet_type,
  COALESCE(address, addresses->>'ETH', addresses->>'BTC',
    (SELECT value FROM jsonb_each_text(addresses) LIMIT 1)) as wallet_address,
  CASE 
    WHEN chain_id = '1' THEN 'ethereum'
    WHEN chain_id = '56' THEN 'binance'
    WHEN chain_id = '137' THEN 'polygon'
    ELSE 'ethereum'
  END as network,
  CASE 
    WHEN wallet_type = 'hot' THEN 'external_hot'
    WHEN wallet_type = 'hardware' THEN 'external_hardware'
    ELSE 'external'
  END as provider,
  'wallet_connections' as source_table,
  id as source_id,
  COALESCE(addresses, jsonb_build_object('ETH', address)) as addresses,
  encrypted_seed_phrase,
  COALESCE(private_keys, '{}') as private_keys,
  COALESCE(public_keys, '{}') as public_keys,
  COALESCE(connection_method, 'browser_extension') as connection_method,
  COALESCE(device_info, '{}') as device_info,
  is_active,
  created_at,
  COALESCE(updated_at, created_at) as updated_at
FROM wallet_connections
WHERE COALESCE(address, addresses->>'ETH', addresses->>'BTC',
  (SELECT value FROM jsonb_each_text(addresses) LIMIT 1)) IS NOT NULL;

-- 5. CREATE SYNC FUNCTIONS
-- Function to sync generated_wallets to unified wallets table
CREATE OR REPLACE FUNCTION sync_generated_wallet_to_unified()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO wallets (
      user_id, wallet_name, wallet_type, wallet_address, network, provider,
      source_table, source_id, addresses, encrypted_seed_phrase, private_keys,
      public_keys, connection_method, device_info, is_active, created_at, updated_at
    ) VALUES (
      NEW.user_id,
      NEW.name,
      'generated',
      COALESCE(NEW.wallet_address, NEW.addresses->>'ETH', NEW.addresses->>'BTC',
        (SELECT value FROM jsonb_each_text(NEW.addresses) LIMIT 1)),
      COALESCE(NEW.network, 'ethereum'),
      'custom_ai',
      'generated_wallets',
      NEW.id,
      NEW.addresses,
      NEW.encrypted_seed_phrase,
      COALESCE(NEW.private_keys, '{}'),
      COALESCE(NEW.public_keys, '{}'),
      'seed_phrase',
      '{}',
      COALESCE(NEW.is_active, true),
      NEW.created_at,
      COALESCE(NEW.updated_at, NEW.created_at)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE wallets SET
      wallet_name = NEW.name,
      wallet_address = COALESCE(NEW.wallet_address, NEW.addresses->>'ETH', NEW.addresses->>'BTC',
        (SELECT value FROM jsonb_each_text(NEW.addresses) LIMIT 1)),
      network = COALESCE(NEW.network, 'ethereum'),
      addresses = NEW.addresses,
      encrypted_seed_phrase = NEW.encrypted_seed_phrase,
      private_keys = COALESCE(NEW.private_keys, '{}'),
      public_keys = COALESCE(NEW.public_keys, '{}'),
      is_active = COALESCE(NEW.is_active, true),
      updated_at = COALESCE(NEW.updated_at, NOW())
    WHERE source_table = 'generated_wallets' AND source_id = NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE wallets SET is_active = false WHERE source_table = 'generated_wallets' AND source_id = OLD.id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to sync wallet_connections to unified wallets table
CREATE OR REPLACE FUNCTION sync_wallet_connection_to_unified()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO wallets (
      user_id, wallet_name, wallet_type, wallet_address, network, provider,
      source_table, source_id, addresses, encrypted_seed_phrase, private_keys,
      public_keys, connection_method, device_info, is_active, created_at, updated_at
    ) VALUES (
      NEW.user_id,
      NEW.wallet_name,
      NEW.wallet_type,
      COALESCE(NEW.address, NEW.addresses->>'ETH', NEW.addresses->>'BTC',
        (SELECT value FROM jsonb_each_text(NEW.addresses) LIMIT 1)),
      CASE 
        WHEN NEW.chain_id = '1' THEN 'ethereum'
        WHEN NEW.chain_id = '56' THEN 'binance'
        WHEN NEW.chain_id = '137' THEN 'polygon'
        ELSE 'ethereum'
      END,
      CASE 
        WHEN NEW.wallet_type = 'hot' THEN 'external_hot'
        WHEN NEW.wallet_type = 'hardware' THEN 'external_hardware'
        ELSE 'external'
      END,
      'wallet_connections',
      NEW.id,
      COALESCE(NEW.addresses, jsonb_build_object('ETH', NEW.address)),
      NEW.encrypted_seed_phrase,
      COALESCE(NEW.private_keys, '{}'),
      COALESCE(NEW.public_keys, '{}'),
      COALESCE(NEW.connection_method, 'browser_extension'),
      COALESCE(NEW.device_info, '{}'),
      NEW.is_active,
      NEW.created_at,
      COALESCE(NEW.updated_at, NEW.created_at)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE wallets SET
      wallet_name = NEW.wallet_name,
      wallet_address = COALESCE(NEW.address, NEW.addresses->>'ETH', NEW.addresses->>'BTC',
        (SELECT value FROM jsonb_each_text(NEW.addresses) LIMIT 1)),
      network = CASE 
        WHEN NEW.chain_id = '1' THEN 'ethereum'
        WHEN NEW.chain_id = '56' THEN 'binance'
        WHEN NEW.chain_id = '137' THEN 'polygon'
        ELSE 'ethereum'
      END,
      addresses = COALESCE(NEW.addresses, jsonb_build_object('ETH', NEW.address)),
      encrypted_seed_phrase = NEW.encrypted_seed_phrase,
      private_keys = COALESCE(NEW.private_keys, '{}'),
      public_keys = COALESCE(NEW.public_keys, '{}'),
      connection_method = COALESCE(NEW.connection_method, 'browser_extension'),
      device_info = COALESCE(NEW.device_info, '{}'),
      is_active = NEW.is_active,
      updated_at = COALESCE(NEW.updated_at, NOW())
    WHERE source_table = 'wallet_connections' AND source_id = NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE wallets SET is_active = false WHERE source_table = 'wallet_connections' AND source_id = OLD.id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 6. CREATE TRIGGERS FOR AUTOMATIC SYNC
DROP TRIGGER IF EXISTS sync_generated_wallet_trigger ON generated_wallets;
CREATE TRIGGER sync_generated_wallet_trigger
  AFTER INSERT OR UPDATE OR DELETE ON generated_wallets
  FOR EACH ROW
  EXECUTE FUNCTION sync_generated_wallet_to_unified();

DROP TRIGGER IF EXISTS sync_wallet_connection_trigger ON wallet_connections;
CREATE TRIGGER sync_wallet_connection_trigger
  AFTER INSERT OR UPDATE OR DELETE ON wallet_connections
  FOR EACH ROW
  EXECUTE FUNCTION sync_wallet_connection_to_unified();

-- 7. SET UP RLS POLICIES FOR UNIFIED wallets TABLE
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own wallets
CREATE POLICY "Users can view their own wallets"
  ON wallets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to insert their own wallets
CREATE POLICY "Users can insert their own wallets"
  ON wallets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own wallets
CREATE POLICY "Users can update their own wallets"
  ON wallets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for users to delete their own wallets (soft delete by setting is_active = false)
CREATE POLICY "Users can delete their own wallets"
  ON wallets
  FOR DELETE
  USING (auth.uid() = user_id);

-- 8. CREATE HELPFUL VIEWS
-- View for active wallets only
CREATE OR REPLACE VIEW active_wallets AS
SELECT * FROM wallets WHERE is_active = true;

-- View for generated wallets with source data
CREATE OR REPLACE VIEW generated_wallets_view AS
SELECT 
  w.*,
  gw.encrypted_seed_phrase as source_encrypted_seed_phrase,
  gw.addresses as source_addresses
FROM wallets w
JOIN generated_wallets gw ON w.source_id = gw.id
WHERE w.source_table = 'generated_wallets' AND w.is_active = true;

-- View for connected wallets with source data
CREATE OR REPLACE VIEW connected_wallets_view AS
SELECT 
  w.*,
  wc.chain_id,
  wc.last_connected
FROM wallets w
JOIN wallet_connections wc ON w.source_id = wc.id
WHERE w.source_table = 'wallet_connections' AND w.is_active = true;

-- Add comments for documentation
COMMENT ON TABLE wallets IS 'Unified table containing all wallets (generated, hot, hardware) for simplified queries';
COMMENT ON COLUMN wallets.source_table IS 'References the original table where wallet data is stored';
COMMENT ON COLUMN wallets.source_id IS 'References the ID in the source table';
COMMENT ON COLUMN wallets.addresses IS 'JSONB object containing addresses for all supported cryptocurrencies';
COMMENT ON COLUMN wallets.private_keys IS 'Encrypted private keys (only for wallets where available)';
COMMENT ON COLUMN wallets.public_keys IS 'Public keys for verification and address generation';
COMMENT ON COLUMN wallets.device_info IS 'Hardware device information for hardware wallets';
