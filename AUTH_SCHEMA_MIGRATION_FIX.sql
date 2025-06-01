-- AUTH SCHEMA MIGRATION FIX - Execute in Supabase SQL Editor
-- This will fix auth schema issues causing Error 500

-- Step 1: Ensure pgcrypto extension is installed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 2: Ensure auth schema exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Step 3: Create or fix auth.users table with all required Supabase columns
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  encrypted_password VARCHAR(255),
  email_confirmed_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ,
  confirmation_token VARCHAR(255),
  confirmation_sent_at TIMESTAMPTZ,
  recovery_token VARCHAR(255),
  recovery_sent_at TIMESTAMPTZ,
  email_change_token_new VARCHAR(255),
  email_change VARCHAR(255),
  email_change_sent_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  raw_app_meta_data JSONB DEFAULT '{}',
  raw_user_meta_data JSONB DEFAULT '{}',
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  phone VARCHAR(15),
  phone_confirmed_at TIMESTAMPTZ,
  phone_change VARCHAR(15),
  phone_change_token VARCHAR(255),
  phone_change_sent_at TIMESTAMPTZ,
  email_change_token_current VARCHAR(255),
  email_change_confirm_status SMALLINT DEFAULT 0,
  banned_until TIMESTAMPTZ,
  reauthentication_token VARCHAR(255),
  reauthentication_sent_at TIMESTAMPTZ,
  is_sso_user BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  is_anonymous BOOLEAN DEFAULT FALSE,
  aud VARCHAR(255) DEFAULT 'authenticated',
  role VARCHAR(255) DEFAULT 'authenticated'
);

-- Step 4: Add missing columns if they don't exist
DO $$
BEGIN
  -- Add aud column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'aud'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN aud VARCHAR(255) DEFAULT 'authenticated';
  END IF;

  -- Add role column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN role VARCHAR(255) DEFAULT 'authenticated';
  END IF;

  -- Add is_anonymous column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'is_anonymous'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add deleted_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;

  RAISE NOTICE 'Auth.users table structure updated';
END;
$$;

-- Step 5: Create essential auth functions
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role')
  )::text
$$;

CREATE OR REPLACE FUNCTION auth.email()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.email', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'email')
  )::text
$$;

-- Step 6: Grant proper permissions to service_role
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON auth.users TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO service_role;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Grant permissions to anon users
GRANT USAGE ON SCHEMA auth TO anon;

-- Step 7: Disable RLS on auth.users (Supabase manages this internally)
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Step 8: Drop any conflicting policies on auth.users
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'auth' AND tablename = 'users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON auth.users', policy_record.policyname);
  END LOOP;
  
  RAISE NOTICE 'Removed conflicting policies from auth.users';
END;
$$;

-- Step 9: Create updated trigger function for public.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql AS $$
DECLARE
  user_full_name TEXT;
  user_phone TEXT;
  user_role TEXT;
BEGIN
  -- Extract metadata with better error handling
  BEGIN
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'User');
    user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  EXCEPTION
    WHEN OTHERS THEN
      user_full_name := 'User';
      user_phone := '';
      user_role := 'user';
  END;
  
  -- Insert into public.users with conflict handling
  INSERT INTO public.users (
    auth_id,
    email,
    full_name,
    phone,
    status,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_phone,
    'active',
    user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    updated_at = NOW();
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'handle_new_user failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Step 10: Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- Step 11: Test auth.users functionality
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  test_email TEXT := 'migration-test-' || extract(epoch from now()) || '@example.com';
  user_count INTEGER;
BEGIN
  -- Test insert with minimal required fields
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    test_id,
    test_email,
    crypt('test123', gen_salt('bf')),
    NOW(),
    NOW(),
    '{"provider": "email"}',
    '{"full_name": "Migration Test"}'
  );
  
  -- Check if user was created
  SELECT COUNT(*) INTO user_count
  FROM auth.users 
  WHERE id = test_id;
  
  IF user_count > 0 THEN
    RAISE NOTICE 'SUCCESS: Auth.users insert test passed';
  ELSE
    RAISE WARNING 'FAILURE: Auth.users insert test failed';
  END IF;
  
  -- Check if trigger created profile
  SELECT COUNT(*) INTO user_count
  FROM public.users 
  WHERE auth_id = test_id;
  
  IF user_count > 0 THEN
    RAISE NOTICE 'SUCCESS: Trigger function test passed';
  ELSE
    RAISE WARNING 'FAILURE: Trigger function test failed';
  END IF;
  
  -- Cleanup
  DELETE FROM public.users WHERE auth_id = test_id;
  DELETE FROM auth.users WHERE id = test_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Migration test failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    -- Cleanup on error
    DELETE FROM public.users WHERE auth_id = test_id;
    DELETE FROM auth.users WHERE id = test_id;
END;
$$;

-- Step 12: Final verification
SELECT 
  'AUTH SCHEMA MIGRATION COMPLETED' as status,
  COUNT(*) as auth_users_count
FROM auth.users;

SELECT 
  'TRIGGER FUNCTION STATUS' as check_type,
  proname as function_name,
  prosecdef as security_definer
FROM pg_proc 
WHERE proname = 'handle_new_user';

SELECT 
  'TRIGGER STATUS' as check_type,
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Final message
SELECT 
  'MIGRATION FIX COMPLETE' as status,
  'Auth schema should now support Supabase auth.signUp()' as message,
  'Try creating a user through the admin interface' as next_step;
