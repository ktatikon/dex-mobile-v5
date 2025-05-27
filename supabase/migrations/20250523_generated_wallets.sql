-- Create generated_wallets table
CREATE TABLE IF NOT EXISTS generated_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  encrypted_seed_phrase TEXT NOT NULL,
  addresses JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS generated_wallets_user_id_idx ON generated_wallets(user_id);

-- Create RLS policies
ALTER TABLE generated_wallets ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own generated wallets
CREATE POLICY "Users can view their own generated wallets"
  ON generated_wallets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to insert their own generated wallets
CREATE POLICY "Users can insert their own generated wallets"
  ON generated_wallets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own generated wallets
CREATE POLICY "Users can update their own generated wallets"
  ON generated_wallets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for users to delete their own generated wallets
CREATE POLICY "Users can delete their own generated wallets"
  ON generated_wallets
  FOR DELETE
  USING (auth.uid() = user_id);
