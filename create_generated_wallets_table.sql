-- Drop the table if it exists to recreate it with the correct schema
DROP TABLE IF EXISTS public.generated_wallets;

-- Create the generated_wallets table with the correct schema
CREATE TABLE public.generated_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    encrypted_seed_phrase TEXT NOT NULL,
    addresses JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comment to the table
COMMENT ON TABLE public.generated_wallets IS 'Stores generated cryptocurrency wallets for users';

-- Create index for faster queries
CREATE INDEX generated_wallets_user_id_idx ON public.generated_wallets (user_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.generated_wallets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view only their own wallets
CREATE POLICY "Users can view their own wallets" 
    ON public.generated_wallets 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own wallets
CREATE POLICY "Users can insert their own wallets" 
    ON public.generated_wallets 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own wallets
CREATE POLICY "Users can update their own wallets" 
    ON public.generated_wallets 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own wallets
CREATE POLICY "Users can delete their own wallets" 
    ON public.generated_wallets 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_wallets TO authenticated;
