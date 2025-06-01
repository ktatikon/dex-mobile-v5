-- AUTH SCHEMA FIX NO PERMISSIONS - Execute in Supabase SQL Editor
-- This fixes auth schema issues WITHOUT trying to modify service_role permissions

-- Step 1: Ensure pgcrypto extension is installed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 2: Check if auth.users table exists and has required structure
DO $$
BEGIN
  -- Check if auth.users exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    RAISE WARNING 'auth.users table does not exist - this is a critical Supabase infrastructure issue';
    RAISE WARNING 'Contact Supabase support or check your project setup';
  ELSE
    RAISE NOTICE 'auth.users table exists';
  END IF;
END;
$$;

-- Step 3: Add missing columns to auth.users if they don't exist
DO $$
BEGIN
  -- Add aud column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'aud'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN aud VARCHAR(255) DEFAULT 'authenticated';
    RAISE NOTICE 'Added aud column to auth.users';
  END IF;

  -- Add role column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN role VARCHAR(255) DEFAULT 'authenticated';
    RAISE NOTICE 'Added role column to auth.users';
  END IF;

  -- Add raw_user_meta_data if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'raw_user_meta_data'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN raw_user_meta_data JSONB DEFAULT '{}';
    RAISE NOTICE 'Added raw_user_meta_data column to auth.users';
  END IF;

  -- Add raw_app_meta_data if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'raw_app_meta_data'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN raw_app_meta_data JSONB DEFAULT '{}';
    RAISE NOTICE 'Added raw_app_meta_data column to auth.users';
  END IF;

  RAISE NOTICE 'Auth.users column check completed';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING 'Cannot modify auth.users - insufficient privileges';
  WHEN OTHERS THEN
    RAISE WARNING 'Error modifying auth.users: %', SQLERRM;
END;
$$;

-- Step 4: Ensure public.users table has proper structure
DO $$
BEGIN
  -- Ensure public.users exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    CREATE TABLE public.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      auth_id UUID UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      status VARCHAR(50) DEFAULT 'active',
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created public.users table';
  ELSE
    RAISE NOTICE 'public.users table already exists';
  END IF;
END;
$$;

-- Step 5: Disable RLS on auth.users (Supabase manages this internally)
DO $$
BEGIN
  ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'Disabled RLS on auth.users';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING 'Cannot disable RLS on auth.users - insufficient privileges';
  WHEN OTHERS THEN
    RAISE WARNING 'Error disabling RLS on auth.users: %', SQLERRM;
END;
$$;

-- Step 6: Create improved trigger function with better error handling
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
  -- Log the trigger execution
  RAISE LOG 'handle_new_user: Processing user %', NEW.id;
  
  -- Safely extract metadata
  BEGIN
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'User');
    user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  EXCEPTION
    WHEN OTHERS THEN
      -- Fallback to defaults if metadata parsing fails
      user_full_name := 'User';
      user_phone := '';
      user_role := 'user';
      RAISE LOG 'handle_new_user: Using default values due to metadata parsing error';
  END;
  
  -- Validate and clean data
  IF user_full_name IS NULL OR trim(user_full_name) = '' THEN
    user_full_name := 'User';
  END IF;
  
  IF user_phone IS NULL THEN
    user_phone := '';
  END IF;
  
  IF user_role NOT IN ('user', 'premium', 'admin', 'super_admin') THEN
    user_role := 'user';
  END IF;
  
  -- Insert into public.users with conflict resolution
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
  
  RAISE LOG 'handle_new_user: Successfully processed user %', NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'handle_new_user: Error processing user % - % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Step 7: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- Step 8: Test the setup with a minimal test
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  test_email TEXT := 'schema-fix-test-' || extract(epoch from now()) || '@example.com';
  profile_count INTEGER;
BEGIN
  -- Test if we can insert into auth.users (this simulates what Supabase auth does)
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    created_at,
    updated_at,
    raw_user_meta_data,
    raw_app_meta_data,
    aud,
    role
  ) VALUES (
    test_id,
    test_email,
    crypt('test123', gen_salt('bf')),
    NOW(),
    NOW(),
    '{"full_name": "Schema Fix Test", "phone": "+1234567890", "role": "user"}',
    '{"provider": "email"}',
    'authenticated',
    'authenticated'
  );
  
  -- Wait for trigger
  PERFORM pg_sleep(1);
  
  -- Check if profile was created
  SELECT COUNT(*) INTO profile_count
  FROM public.users 
  WHERE auth_id = test_id;
  
  IF profile_count > 0 THEN
    RAISE NOTICE 'SUCCESS: Auth schema fix test passed - profile created';
  ELSE
    RAISE WARNING 'FAILURE: Profile was not created by trigger';
  END IF;
  
  -- Cleanup
  DELETE FROM public.users WHERE auth_id = test_id;
  DELETE FROM auth.users WHERE id = test_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Schema fix test failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    -- Cleanup on error
    DELETE FROM public.users WHERE auth_id = test_id;
    DELETE FROM auth.users WHERE id = test_id;
END;
$$;

-- Step 9: Final status check
SELECT 
  'AUTH SCHEMA FIX COMPLETED' as status,
  'Trigger function and auth schema should now work properly' as message,
  'service_role permissions are managed by Supabase automatically' as note,
  'Try creating a user through the admin interface now' as next_step;
