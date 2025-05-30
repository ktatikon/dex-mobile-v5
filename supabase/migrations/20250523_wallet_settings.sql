-- Create wallet_settings table
CREATE TABLE IF NOT EXISTS wallet_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  require_transaction_confirmation BOOLEAN DEFAULT true,
  biometric_auth_enabled BOOLEAN DEFAULT false,
  hide_small_balances BOOLEAN DEFAULT false,
  small_balance_threshold DECIMAL(10,2) DEFAULT 1.00,
  default_currency TEXT DEFAULT 'USD' CHECK (default_currency IN ('USD', 'EUR', 'GBP', 'BTC', 'ETH')),
  privacy_mode_enabled BOOLEAN DEFAULT false,
  auto_lock_timeout INTEGER DEFAULT 300, -- seconds (5 minutes)
  slippage_tolerance DECIMAL(5,2) DEFAULT 0.50 CHECK (slippage_tolerance >= 0.01 AND slippage_tolerance <= 50.00), -- percentage (0.01% - 50%)
  transaction_notifications BOOLEAN DEFAULT true,
  price_alerts_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on user_id (one settings record per user)
CREATE UNIQUE INDEX IF NOT EXISTS wallet_settings_user_id_idx ON wallet_settings(user_id);

-- Create RLS policies
ALTER TABLE wallet_settings ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own wallet settings
CREATE POLICY "Users can view their own wallet settings"
  ON wallet_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to insert their own wallet settings
CREATE POLICY "Users can insert their own wallet settings"
  ON wallet_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own wallet settings
CREATE POLICY "Users can update their own wallet settings"
  ON wallet_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own wallet settings
CREATE POLICY "Users can delete their own wallet settings"
  ON wallet_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wallet_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_wallet_settings_updated_at
  BEFORE UPDATE ON wallet_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_settings_updated_at();

-- Create function to create default wallet settings for new users
CREATE OR REPLACE FUNCTION create_default_wallet_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallet_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create wallet settings for new users
CREATE TRIGGER create_default_wallet_settings_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_wallet_settings();
