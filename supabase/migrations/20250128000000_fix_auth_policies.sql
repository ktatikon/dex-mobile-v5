-- Fix authentication policies and constraints for users table
-- This migration addresses critical authentication issues

-- =====================================================
-- 1. CLEAN UP DUPLICATE AND CONFLICTING RLS POLICIES
-- =====================================================

-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "Allow insert during signup" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own data" ON public.users;

-- Keep only the essential policies and ensure they're properly configured

-- =====================================================
-- 2. ENSURE PROPER CONSTRAINTS
-- =====================================================

-- Ensure email unique constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%email%'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);
    RAISE NOTICE 'Added unique constraint on users.email';
  ELSE
    RAISE NOTICE 'Unique constraint on users.email already exists';
  END IF;
END
$$;

-- Ensure auth_id unique constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%auth_id%'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_auth_id_unique UNIQUE (auth_id);
    RAISE NOTICE 'Added unique constraint on users.auth_id';
  ELSE
    RAISE NOTICE 'Unique constraint on users.auth_id already exists';
  END IF;
END
$$;

-- =====================================================
-- 3. CREATE OPTIMIZED RLS POLICIES
-- =====================================================

-- Policy for users to insert their own profile (during signup)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON public.users
      FOR INSERT
      WITH CHECK (auth.uid() = auth_id);
    RAISE NOTICE 'Created policy: Users can insert their own profile';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can insert their own profile';
  END IF;
END
$$;

-- Policy for users to read their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can read their own profile'
  ) THEN
    CREATE POLICY "Users can read their own profile"
      ON public.users
      FOR SELECT
      USING (auth.uid() = auth_id);
    RAISE NOTICE 'Created policy: Users can read their own profile';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can read their own profile';
  END IF;
END
$$;

-- Policy for users to update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.users
      FOR UPDATE
      USING (auth.uid() = auth_id)
      WITH CHECK (auth.uid() = auth_id);
    RAISE NOTICE 'Created policy: Users can update their own profile';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can update their own profile';
  END IF;
END
$$;

-- Policy for users to delete their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can delete their own profile'
  ) THEN
    CREATE POLICY "Users can delete their own profile"
      ON public.users
      FOR DELETE
      USING (auth.uid() = auth_id);
    RAISE NOTICE 'Created policy: Users can delete their own profile';
  ELSE
    RAISE NOTICE 'Policy already exists: Users can delete their own profile';
  END IF;
END
$$;

-- =====================================================
-- 4. CREATE FUNCTION TO HANDLE USER PROFILE CREATION
-- =====================================================

-- Function to automatically create user profile after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, full_name, phone, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'active'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User profile already exists, ignore
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the auth creation
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CREATE TRIGGER FOR AUTOMATIC PROFILE CREATION
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. CREATE FUNCTION TO CHECK EMAIL AVAILABILITY
-- =====================================================

-- Function to check if email is available (for client-side validation)
CREATE OR REPLACE FUNCTION public.is_email_available(email_to_check text)
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = lower(trim(email_to_check))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_email_available(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_email_available(text) TO anon;

-- =====================================================
-- 7. ADD HELPFUL INDEXES
-- =====================================================

-- Index on email for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- Index on auth_id for faster joins
CREATE INDEX IF NOT EXISTS users_auth_id_idx ON public.users(auth_id);

-- Index on status for admin queries
CREATE INDEX IF NOT EXISTS users_status_idx ON public.users(status);

-- =====================================================
-- 8. UPDATE EXISTING DATA
-- =====================================================

-- Ensure all existing users have proper status
UPDATE public.users 
SET status = 'active' 
WHERE status IS NULL;

-- Normalize existing email addresses
UPDATE public.users 
SET email = lower(trim(email)) 
WHERE email != lower(trim(email));

RAISE NOTICE 'Authentication policies and constraints have been fixed successfully';
