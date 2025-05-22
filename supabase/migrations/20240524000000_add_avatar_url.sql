-- Add avatar_url column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'avatars', 'avatars', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'avatars'
);

-- Set up storage policies for avatars bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE name = 'Users can upload their own avatars' AND bucket_id = 'avatars'
  ) THEN
    CREATE POLICY "Users can upload their own avatars"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = SUBSTRING(name, 1, POSITION('_' in name) - 1)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE name = 'Users can view their own avatars' AND bucket_id = 'avatars'
  ) THEN
    CREATE POLICY "Users can view their own avatars"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = SUBSTRING(name, 1, POSITION('_' in name) - 1)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE name = 'Users can update their own avatars' AND bucket_id = 'avatars'
  ) THEN
    CREATE POLICY "Users can update their own avatars"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = SUBSTRING(name, 1, POSITION('_' in name) - 1)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE name = 'Users can delete their own avatars' AND bucket_id = 'avatars'
  ) THEN
    CREATE POLICY "Users can delete their own avatars"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = SUBSTRING(name, 1, POSITION('_' in name) - 1)
      );
  END IF;

  -- Public read access for avatars
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE name = 'Public can view all avatars' AND bucket_id = 'avatars'
  ) THEN
    CREATE POLICY "Public can view all avatars"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'avatars'
      );
  END IF;
END
$$;
