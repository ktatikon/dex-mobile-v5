-- Add new columns to the existing kyc table
ALTER TABLE public.kyc ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE public.kyc ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
ALTER TABLE public.kyc ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE public.kyc ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE public.kyc ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE public.kyc ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE public.kyc ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE public.kyc ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.kyc ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.kyc ADD COLUMN IF NOT EXISTS document_type VARCHAR(50);
ALTER TABLE public.kyc ADD COLUMN IF NOT EXISTS back_document_url TEXT;
ALTER TABLE public.kyc ADD COLUMN IF NOT EXISTS selfie_url TEXT;
ALTER TABLE public.kyc ADD COLUMN IF NOT EXISTS review_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.kyc ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- Ensure status column has proper constraints
ALTER TABLE public.kyc DROP CONSTRAINT IF EXISTS kyc_status_check;
ALTER TABLE public.kyc ADD CONSTRAINT kyc_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Ensure document_type column has proper constraints
ALTER TABLE public.kyc ADD CONSTRAINT kyc_document_type_check 
  CHECK (document_type IN ('passport', 'drivers_license', 'national_id'));

-- Create storage bucket for KYC documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'kyc', 'kyc', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'kyc'
);

-- Set up storage policies if they don't exist
DO $$
BEGIN
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
END
$$;
