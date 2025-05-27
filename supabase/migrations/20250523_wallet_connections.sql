-- Create wallet_connections table
CREATE TABLE IF NOT EXISTS wallet_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('hot', 'hardware')),
  wallet_id TEXT NOT NULL,
  wallet_name TEXT NOT NULL,
  address TEXT NOT NULL,
  chain_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_connected TIMESTAMP WITH TIME ZONE
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS wallet_connections_user_id_idx ON wallet_connections(user_id);

-- Create index on wallet_type for faster queries
CREATE INDEX IF NOT EXISTS wallet_connections_wallet_type_idx ON wallet_connections(wallet_type);

-- Create index on is_active for faster queries
CREATE INDEX IF NOT EXISTS wallet_connections_is_active_idx ON wallet_connections(is_active);

-- Create RLS policies
ALTER TABLE wallet_connections ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own wallet connections
CREATE POLICY "Users can view their own wallet connections"
  ON wallet_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to insert their own wallet connections
CREATE POLICY "Users can insert their own wallet connections"
  ON wallet_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own wallet connections
CREATE POLICY "Users can update their own wallet connections"
  ON wallet_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for users to delete their own wallet connections
CREATE POLICY "Users can delete their own wallet connections"
  ON wallet_connections
  FOR DELETE
  USING (auth.uid() = user_id);
