-- Create AML checks table
CREATE TABLE IF NOT EXISTS public.aml_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chain VARCHAR(50) NOT NULL CHECK (chain IN ('ethereum', 'bitcoin', 'polygon', 'bsc', 'arbitrum', 'optimism', 'avalanche', 'fantom')),
  address VARCHAR(255) NOT NULL,
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT unique_user_chain_address UNIQUE (user_id, chain, address)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_aml_checks_user_id ON public.aml_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_aml_checks_chain ON public.aml_checks(chain);
CREATE INDEX IF NOT EXISTS idx_aml_checks_status ON public.aml_checks(status);
CREATE INDEX IF NOT EXISTS idx_aml_checks_risk_level ON public.aml_checks(risk_level);
CREATE INDEX IF NOT EXISTS idx_aml_checks_created_at ON public.aml_checks(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_aml_checks_updated_at 
    BEFORE UPDATE ON public.aml_checks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.aml_checks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own AML checks" ON public.aml_checks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AML checks" ON public.aml_checks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AML checks" ON public.aml_checks
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.aml_checks TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
