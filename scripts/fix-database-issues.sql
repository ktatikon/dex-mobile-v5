-- =====================================================
-- Database Issues Fix Script
-- Run this in Supabase SQL Editor to fix common issues
-- =====================================================

-- 1. Ensure users table exists with correct structure
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add missing columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birthdate DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'banned'));

-- 3. Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.users;

-- 5. Create RLS policies for users table
CREATE POLICY "Allow users to insert their own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Allow users to update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Allow users to read their own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = auth_id);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_auth_id_idx ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_status_idx ON public.users(status);

-- 7. Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
SELECT 'avatars', 'avatars', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'avatars'
);

-- 8. Create storage policies for avatars
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;

  -- Create new policies
  CREATE POLICY "Users can upload their own avatars"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars' AND
      auth.uid() = (storage.foldername(name))[1]::uuid
    );

  CREATE POLICY "Users can view their own avatars"
    ON storage.objects
    FOR SELECT
    USING (
      bucket_id = 'avatars' AND
      auth.uid() = (storage.foldername(name))[1]::uuid
    );

  CREATE POLICY "Users can update their own avatars"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'avatars' AND
      auth.uid() = (storage.foldername(name))[1]::uuid
    );
END
$$;

-- 9. Create function to sync auth users to public users using UPSERT
CREATE OR REPLACE FUNCTION sync_auth_user_to_public_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Use UPSERT to handle potential conflicts safely
  INSERT INTO public.users (auth_id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    phone = COALESCE(EXCLUDED.phone, users.phone);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger to automatically sync auth users
DROP TRIGGER IF EXISTS sync_auth_user_trigger ON auth.users;
CREATE TRIGGER sync_auth_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_user_to_public_users();

-- 11. Sync existing auth users to public users using UPSERT (one-time operation)
INSERT INTO public.users (auth_id, email, full_name, phone)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Unknown'),
  COALESCE(au.raw_user_meta_data->>'phone', '')
FROM auth.users au
ON CONFLICT (auth_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, users.full_name),
  phone = COALESCE(EXCLUDED.phone, users.phone);

-- 12. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.kyc TO authenticated;

-- 13. Verify the fixes
SELECT 'Database Fix Complete' as status, NOW() as completed_at;
