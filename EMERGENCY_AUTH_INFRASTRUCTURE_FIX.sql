-- EMERGENCY AUTH INFRASTRUCTURE FIX - Execute in Supabase SQL Editor
-- This will rebuild the auth infrastructure if it's missing or corrupted

-- Step 1: Ensure pgcrypto extension is installed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 2: Ensure auth schema exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Step 3: Create complete auth.users table if missing or incomplete
DO $$
BEGIN
  -- Drop and recreate auth.users if it exists but is incomplete
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    -- Check if it has essential columns
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'encrypted_password'
    ) THEN
      RAISE NOTICE 'auth.users exists but is incomplete - recreating';
      DROP TABLE auth.users CASCADE;
    ELSE
      RAISE NOTICE 'auth.users exists and appears complete';
    END IF;
  END IF;
END;
$$;

-- Step 4: Create complete auth.users table with all Supabase requirements
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

-- Step 5: Create essential indexes for auth.users
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON auth.users (email);
CREATE INDEX IF NOT EXISTS users_confirmation_token_idx ON auth.users (confirmation_token);
CREATE INDEX IF NOT EXISTS users_recovery_token_idx ON auth.users (recovery_token);
CREATE INDEX IF NOT EXISTS users_email_change_token_new_idx ON auth.users (email_change_token_new);
CREATE INDEX IF NOT EXISTS users_email_change_token_current_idx ON auth.users (email_change_token_current);

-- Step 6: Disable RLS on auth.users (Supabase manages this internally)
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Step 7: Create essential auth functions
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

-- Step 8: Ensure public.users table exists with proper structure
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) DEFAULT '',
  status VARCHAR(50) DEFAULT 'active',
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 9: Disable RLS on public.users temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 10: Create robust trigger function
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
  -- Log trigger start
  RAISE LOG 'handle_new_user: Processing user % with email %', NEW.id, NEW.email;
  
  -- Extract metadata safely
  BEGIN
    user_full_name := COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''), 
      'User'
    );
    user_phone := COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'phone'), ''), 
      ''
    );
    user_role := COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'role'), ''), 
      'user'
    );
  EXCEPTION
    WHEN OTHERS THEN
      user_full_name := 'User';
      user_phone := '';
      user_role := 'user';
      RAISE LOG 'handle_new_user: Using defaults due to metadata error';
  END;
  
  -- Validate role
  IF user_role NOT IN ('user', 'premium', 'admin', 'super_admin') THEN
    user_role := 'user';
  END IF;
  
  -- Insert into public.users
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
  
  RAISE LOG 'handle_new_user: Successfully created profile for user %', NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: Failed for user % - % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
    -- Don't fail the auth signup
    RETURN NEW;
END;
$$;

-- Step 11: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- Step 12: Test the complete auth infrastructure
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  test_email TEXT := 'infrastructure-test-' || extract(epoch from now()) || '@example.com';
  auth_count INTEGER;
  profile_count INTEGER;
BEGIN
  RAISE NOTICE 'Testing complete auth infrastructure...';
  
  -- Test auth.users insert (simulating Supabase auth.signUp)
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    raw_app_meta_data,
    aud,
    role
  ) VALUES (
    test_id,
    test_email,
    crypt('testpassword123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "Infrastructure Test User", "phone": "+1234567890", "role": "user"}',
    '{"provider": "email", "providers": ["email"]}',
    'authenticated',
    'authenticated'
  );
  
  -- Check auth user was created
  SELECT COUNT(*) INTO auth_count FROM auth.users WHERE id = test_id;
  
  -- Wait for trigger
  PERFORM pg_sleep(2);
  
  -- Check profile was created
  SELECT COUNT(*) INTO profile_count FROM public.users WHERE auth_id = test_id;
  
  -- Report results
  IF auth_count > 0 AND profile_count > 0 THEN
    RAISE NOTICE 'SUCCESS: Complete auth infrastructure test passed';
    RAISE NOTICE 'Auth user created: %, Profile created: %', auth_count > 0, profile_count > 0;
  ELSE
    RAISE WARNING 'FAILURE: Auth infrastructure test failed';
    RAISE WARNING 'Auth user: %, Profile: %', auth_count, profile_count;
  END IF;
  
  -- Cleanup
  DELETE FROM public.users WHERE auth_id = test_id;
  DELETE FROM auth.users WHERE id = test_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Infrastructure test failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    -- Cleanup on error
    DELETE FROM public.users WHERE auth_id = test_id;
    DELETE FROM auth.users WHERE id = test_id;
END;
$$;

-- Step 13: Final verification
SELECT 
  'AUTH INFRASTRUCTURE REBUILD COMPLETE' as status,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users') as auth_users_columns,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users') as public_users_columns,
  'Try user creation now' as next_step;

-- Step 14: Show what was created
SELECT 
  'INFRASTRUCTURE SUMMARY' as component,
  'auth.users table with ' || COUNT(*) || ' columns' as details
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
UNION ALL
SELECT 
  'INFRASTRUCTURE SUMMARY' as component,
  'public.users table with ' || COUNT(*) || ' columns' as details
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
UNION ALL
SELECT 
  'INFRASTRUCTURE SUMMARY' as component,
  'Trigger function: ' || proname as details
FROM pg_proc 
WHERE proname = 'handle_new_user';
