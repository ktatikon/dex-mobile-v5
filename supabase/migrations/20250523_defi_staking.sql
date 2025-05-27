-- Create user_staking_positions table
CREATE TABLE IF NOT EXISTS user_staking_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id TEXT NOT NULL,
  protocol TEXT NOT NULL,
  token TEXT NOT NULL,
  amount TEXT NOT NULL,
  rewards_earned TEXT NOT NULL DEFAULT '0',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'pending')) DEFAULT 'pending',
  apy DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_staking_positions_user_id_idx ON user_staking_positions(user_id);
CREATE INDEX IF NOT EXISTS user_staking_positions_wallet_id_idx ON user_staking_positions(wallet_id);
CREATE INDEX IF NOT EXISTS user_staking_positions_protocol_idx ON user_staking_positions(protocol);
CREATE INDEX IF NOT EXISTS user_staking_positions_status_idx ON user_staking_positions(status);
CREATE INDEX IF NOT EXISTS user_staking_positions_start_date_idx ON user_staking_positions(start_date);

-- Create RLS policies
ALTER TABLE user_staking_positions ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own staking positions
CREATE POLICY "Users can view their own staking positions"
  ON user_staking_positions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to insert their own staking positions
CREATE POLICY "Users can insert their own staking positions"
  ON user_staking_positions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own staking positions
CREATE POLICY "Users can update their own staking positions"
  ON user_staking_positions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own staking positions
CREATE POLICY "Users can delete their own staking positions"
  ON user_staking_positions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_staking_positions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_staking_positions_updated_at
  BEFORE UPDATE ON user_staking_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_staking_positions_updated_at();
