-- Create KYC table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.kyc (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  middle_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(255),
  document_type VARCHAR(50) CHECK (document_type IN ('passport', 'drivers_license', 'national_id')),
  government_id_url TEXT,
  back_document_url TEXT,
  selfie_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  review_date TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS kyc_user_id_idx ON public.kyc(user_id);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS kyc_status_idx ON public.kyc(status);

-- Enable Row Level Security
ALTER TABLE public.kyc ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can insert their own KYC
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'kyc' 
    AND policyname = 'Users can insert own KYC'
  ) THEN
    CREATE POLICY "Users can insert own KYC"
      ON public.kyc
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- RLS Policy: Users can view their own KYC
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'kyc' 
    AND policyname = 'Users can view own KYC'
  ) THEN
    CREATE POLICY "Users can view own KYC"
      ON public.kyc
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- RLS Policy: Users can update their own KYC (only when status is pending)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'kyc' 
    AND policyname = 'Users can update own pending KYC'
  ) THEN
    CREATE POLICY "Users can update own pending KYC"
      ON public.kyc
      FOR UPDATE
      USING (auth.uid() = user_id AND status = 'pending')
      WITH CHECK (auth.uid() = user_id AND status = 'pending');
  END IF;
END
$$;

-- Create storage bucket for KYC documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'kyc', 'kyc', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'kyc'
);

-- Set up storage policies for KYC documents
DO $$
BEGIN
  -- Policy for uploading KYC documents
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE name = 'Users can upload their own KYC documents' AND bucket_id = 'kyc'
  ) THEN
    CREATE POLICY "Users can upload their own KYC documents"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'kyc' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
      );
  END IF;

  -- Policy for viewing KYC documents
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE name = 'Users can view their own KYC documents' AND bucket_id = 'kyc'
  ) THEN
    CREATE POLICY "Users can view their own KYC documents"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'kyc' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
      );
  END IF;

  -- Policy for updating KYC documents
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE name = 'Users can update their own KYC documents' AND bucket_id = 'kyc'
  ) THEN
    CREATE POLICY "Users can update their own KYC documents"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'kyc' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
      );
  END IF;
END
$$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_kyc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS kyc_updated_at_trigger ON public.kyc;
CREATE TRIGGER kyc_updated_at_trigger
  BEFORE UPDATE ON public.kyc
  FOR EACH ROW
  EXECUTE FUNCTION update_kyc_updated_at();
