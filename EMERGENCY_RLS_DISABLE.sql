-- EMERGENCY RLS DISABLE - EXECUTE IMMEDIATELY IN SUPABASE SQL EDITOR
-- This will temporarily disable RLS to fix the infinite recursion errors

-- Step 1: Disable RLS on public.users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all problematic RLS policies on public.users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
DROP POLICY IF EXISTS "service_role_bypass_for_triggers" ON public.users;
DROP POLICY IF EXISTS "admin_full_access" ON public.users;
DROP POLICY IF EXISTS "service_role_bypass" ON public.users;

-- Step 3: Ensure the trigger function exists and works properly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql AS $$
BEGIN
  -- Log trigger execution
  RAISE LOG 'handle_new_user triggered for user: %', NEW.id;
  
  -- Insert user profile (RLS is disabled so this will work)
  INSERT INTO public.users (auth_id, email, full_name, phone, status, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'active',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  
  RAISE LOG 'User profile created successfully for: %', NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    RAISE LOG 'User profile already exists for: %', NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Step 4: Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- Step 5: Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.users TO postgres;

-- Step 6: Drop problematic admin functions that might cause recursion
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS admin_create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT);

-- Verification
SELECT 'EMERGENCY RLS DISABLE COMPLETED - ADMIN SYSTEM SHOULD NOW WORK' as status;

-- Check if users table is accessible
SELECT COUNT(*) as total_users FROM public.users;

-- Check if trigger function exists
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'handle_new_user';
