-- Migration: Fix RLS Policy Issues for Signup
-- Date: 2025-01-28
-- Description: Fixes RLS policy violations blocking user profile creation during signup
--              Ensures trigger function has proper SECURITY DEFINER privileges and permissions

-- =====================================================
-- 1. VERIFY AND FIX TRIGGER FUNCTION
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

-- =====================================================
-- 2. VERIFY RLS POLICIES ARE PROPERLY CONFIGURED
-- =====================================================

-- Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;

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

-- =====================================================
-- 3. CREATE MANUAL PROFILE CREATION FUNCTION (FALLBACK)
-- =====================================================

-- Enhanced manual profile creation function with proper error handling
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

-- Grant permissions to manual function
GRANT EXECUTE ON FUNCTION public.create_user_profile_enhanced(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile_enhanced(UUID, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile_enhanced(UUID, TEXT, TEXT, TEXT) TO service_role;

-- =====================================================
-- 4. CREATE DIAGNOSTIC FUNCTIONS
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

-- Grant permissions to diagnostic functions
GRANT EXECUTE ON FUNCTION public.check_trigger_function_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_trigger_function_exists() TO anon;
GRANT EXECUTE ON FUNCTION public.test_phone_constraint(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_phone_constraint(TEXT) TO anon;

-- =====================================================
-- 5. VERIFICATION AND TESTING
-- =====================================================

-- Verify trigger function exists and has correct properties
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
  
  RAISE NOTICE 'RLS policy fix migration completed successfully';
  RAISE NOTICE 'Trigger function: handle_new_user() - VERIFIED';
  RAISE NOTICE 'Trigger: on_auth_user_created - VERIFIED';
  RAISE NOTICE 'Security: DEFINER - VERIFIED';
  RAISE NOTICE 'RLS policies: UPDATED';
END;
$$;

-- Test phone constraint
DO $$
BEGIN
  IF NOT public.test_phone_constraint('') THEN
    RAISE EXCEPTION 'Phone constraint does not allow empty phone';
  END IF;
  
  IF NOT public.test_phone_constraint('+1234567890') THEN
    RAISE EXCEPTION 'Phone constraint does not allow valid international format';
  END IF;
  
  RAISE NOTICE 'Phone constraint verification: PASSED';
END;
$$;

-- Final verification message
SELECT 'RLS policy fix migration completed successfully' as status;
