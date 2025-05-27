-- Add new columns to the users table for profile settings
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birthdate DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS website VARCHAR(255);

-- Update RLS policies for the users table
-- This policy allows users to update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Allow users to update their own profile'
  ) THEN
    CREATE POLICY "Allow users to update their own profile"
      ON public.users
      FOR UPDATE
      USING (auth.uid() = auth_id)
      WITH CHECK (auth.uid() = auth_id);
  END IF;
END
$$;

-- This policy allows users to read their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Allow users to read their own profile'
  ) THEN
    CREATE POLICY "Allow users to read their own profile"
      ON public.users
      FOR SELECT
      USING (auth.uid() = auth_id);
  END IF;
END
$$;
