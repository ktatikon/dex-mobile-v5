-- Create wallet_preferences table
CREATE TABLE IF NOT EXISTS wallet_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_wallet_id TEXT NOT NULL,
  default_wallet_type TEXT NOT NULL CHECK (default_wallet_type IN ('generated', 'hot', 'hardware')),
  wallet_categories JSONB NOT NULL DEFAULT '{}',
  display_order TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create unique index on user_id (one preference record per user)
CREATE UNIQUE INDEX IF NOT EXISTS wallet_preferences_user_id_idx ON wallet_preferences(user_id);

-- Create RLS policies
ALTER TABLE wallet_preferences ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own wallet preferences
CREATE POLICY "Users can view their own wallet preferences"
  ON wallet_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to insert their own wallet preferences
CREATE POLICY "Users can insert their own wallet preferences"
  ON wallet_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own wallet preferences
CREATE POLICY "Users can update their own wallet preferences"
  ON wallet_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own wallet preferences
CREATE POLICY "Users can delete their own wallet preferences"
  ON wallet_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wallet_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_wallet_preferences_updated_at
  BEFORE UPDATE ON wallet_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_preferences_updated_at();
