-- =====================================================
-- CRITICAL DATABASE MIGRATION - MANUAL APPLICATION
-- Execute this entire script in Supabase SQL Editor
-- =====================================================

-- Step 1: Fix Phone Constraint (Allow Empty Phone Numbers)
-- =====================================================

DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_schema = 'public' 
    AND constraint_name = 'users_phone_format_check'
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_phone_format_check;
    RAISE NOTICE 'Dropped existing phone format check constraint';
  ELSE
    RAISE NOTICE 'Phone format check constraint does not exist, skipping drop';
  END IF;
END
$$;

-- Add updated phone format constraint
ALTER TABLE public.users 
ADD CONSTRAINT users_phone_format_check
CHECK (
  phone = '' OR phone ~ '^[+]?[0-9\s\-\(\)]{5,20}$'
);

RAISE NOTICE 'Phone constraint updated to allow empty phone numbers';

-- Step 2: Create Enhanced Trigger Function with SECURITY DEFINER
-- =====================================================

-- Drop existing trigger and function to recreate properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create enhanced trigger function with proper RLS bypass
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER  -- This allows bypassing RLS policies
SET search_path = public, auth
LANGUAGE plpgsql AS $$
BEGIN
  -- Log the trigger execution for debugging
  RAISE LOG 'handle_new_user trigger fired for user: % with email: %', NEW.id, NEW.email;
  
  -- Insert user profile with RLS bypass (function runs as definer)
  INSERT INTO public.users (auth_id, email, full_name, phone, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'active'
  );
  
  RAISE LOG 'Successfully created user profile for auth_id: %', NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    -- User profile already exists, this is OK
    RAISE LOG 'User profile already exists for auth_id: %', NEW.id;
    RETURN NEW;
    
  WHEN OTHERS THEN
    -- Log detailed error but don't fail the auth creation
    RAISE WARNING 'Failed to create user profile for auth_id %: % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

RAISE NOTICE 'Trigger function created with SECURITY DEFINER privileges';

-- Step 3: Fix RLS Policies
-- =====================================================

-- Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- Allow service role to bypass RLS for trigger function
CREATE POLICY "Service role can manage all users"
  ON public.users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

RAISE NOTICE 'RLS policies updated';

-- Step 4: Create Diagnostic Functions (Required by Frontend)
-- =====================================================

-- Function to check trigger function exists
CREATE OR REPLACE FUNCTION public.check_trigger_function_exists()
RETURNS TABLE(
  function_exists BOOLEAN,
  trigger_exists BOOLEAN,
  function_security TEXT,
  permissions TEXT[]
)
SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name = 'handle_new_user'
    ) as function_exists,
    EXISTS(
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_schema = 'public' 
        AND trigger_name = 'on_auth_user_created'
    ) as trigger_exists,
    (
      SELECT routine_security_type 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name = 'handle_new_user'
    ) as function_security,
    ARRAY(
      SELECT grantee 
      FROM information_schema.routine_privileges 
      WHERE routine_schema = 'public' 
        AND routine_name = 'handle_new_user'
    ) as permissions;
END;
$$;

-- Function to test phone constraint
CREATE OR REPLACE FUNCTION public.test_phone_constraint(test_phone TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
  -- Test if phone matches constraint
  RETURN (test_phone = '' OR test_phone ~ '^[+]?[0-9\s\-\(\)]{5,20}$');
END;
$$;

-- Enhanced manual profile creation function
CREATE OR REPLACE FUNCTION public.create_user_profile_enhanced(
  p_auth_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT ''
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Validate inputs
  IF p_auth_id IS NULL OR p_email IS NULL OR p_full_name IS NULL THEN
    RAISE EXCEPTION 'Required parameters cannot be null';
  END IF;
  
  -- Insert user profile with RLS bypass
  INSERT INTO public.users (auth_id, email, full_name, phone, status)
  VALUES (p_auth_id, p_email, p_full_name, COALESCE(p_phone, ''), 'active')
  RETURNING id INTO user_id;
  
  RAISE LOG 'Manual profile creation successful for auth_id: %', p_auth_id;
  RETURN user_id;
  
EXCEPTION
  WHEN unique_violation THEN
    -- Return existing user ID if profile already exists
    SELECT id INTO user_id FROM public.users WHERE auth_id = p_auth_id;
    RAISE LOG 'Profile already exists for auth_id: %, returning existing ID: %', p_auth_id, user_id;
    RETURN user_id;
    
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user profile: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- Grant permissions to diagnostic functions
GRANT EXECUTE ON FUNCTION public.check_trigger_function_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_trigger_function_exists() TO anon;
GRANT EXECUTE ON FUNCTION public.check_trigger_function_exists() TO service_role;

GRANT EXECUTE ON FUNCTION public.test_phone_constraint(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_phone_constraint(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.test_phone_constraint(TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION public.create_user_profile_enhanced(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile_enhanced(UUID, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile_enhanced(UUID, TEXT, TEXT, TEXT) TO service_role;

-- Step 5: Verification Tests
-- =====================================================

-- Test 1: Verify trigger function exists and has correct properties
DO $$
DECLARE
  func_exists BOOLEAN;
  trig_exists BOOLEAN;
  func_security TEXT;
BEGIN
  SELECT function_exists, trigger_exists, function_security 
  INTO func_exists, trig_exists, func_security
  FROM public.check_trigger_function_exists();
  
  IF NOT func_exists THEN
    RAISE EXCEPTION 'Trigger function handle_new_user() was not created properly';
  END IF;
  
  IF NOT trig_exists THEN
    RAISE EXCEPTION 'Trigger on_auth_user_created was not created properly';
  END IF;
  
  IF func_security != 'DEFINER' THEN
    RAISE EXCEPTION 'Trigger function does not have SECURITY DEFINER privilege';
  END IF;
  
  RAISE NOTICE 'SUCCESS: Trigger function verification passed';
END;
$$;

-- Test 2: Verify phone constraint
DO $$
BEGIN
  IF NOT public.test_phone_constraint('') THEN
    RAISE EXCEPTION 'Phone constraint does not allow empty phone';
  END IF;
  
  IF NOT public.test_phone_constraint('+1234567890') THEN
    RAISE EXCEPTION 'Phone constraint does not allow valid international format';
  END IF;
  
  IF public.test_phone_constraint('invalid-phone-123456789012345678901') THEN
    RAISE EXCEPTION 'Phone constraint incorrectly allows invalid format';
  END IF;
  
  RAISE NOTICE 'SUCCESS: Phone constraint verification passed';
END;
$$;

-- Test 3: Verify RLS policies exist
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'users' AND schemaname = 'public';
  
  IF policy_count < 3 THEN
    RAISE EXCEPTION 'Not enough RLS policies found. Expected at least 3, found %', policy_count;
  END IF;
  
  RAISE NOTICE 'SUCCESS: RLS policies verification passed (% policies found)', policy_count;
END;
$$;

-- Final Success Message
SELECT 
  'CRITICAL DATABASE MIGRATION COMPLETED SUCCESSFULLY' as status,
  'All functions created, constraints updated, and policies applied' as details,
  NOW() as completed_at;
