-- DEEP AUTH DIAGNOSTIC - Execute in Supabase SQL Editor
-- This will identify the exact cause of Auth Error 500

-- Step 1: Check if auth schema and table exist
SELECT 
  'AUTH INFRASTRUCTURE CHECK' as diagnostic_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') 
    THEN 'AUTH SCHEMA EXISTS'
    ELSE 'AUTH SCHEMA MISSING - CRITICAL ERROR'
  END as auth_schema_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') 
    THEN 'AUTH.USERS TABLE EXISTS'
    ELSE 'AUTH.USERS TABLE MISSING - CRITICAL ERROR'
  END as auth_users_status;

-- Step 2: Check auth.users table structure in detail
SELECT 
  'AUTH USERS STRUCTURE' as diagnostic_type,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Step 3: Check for critical missing columns
WITH required_auth_columns AS (
  SELECT unnest(ARRAY[
    'id', 'email', 'encrypted_password', 'email_confirmed_at',
    'created_at', 'updated_at', 'raw_user_meta_data', 'raw_app_meta_data',
    'aud', 'role', 'confirmation_token', 'recovery_token'
  ]) as column_name
),
existing_auth_columns AS (
  SELECT column_name
  FROM information_schema.columns 
  WHERE table_schema = 'auth' AND table_name = 'users'
)
SELECT 
  'CRITICAL MISSING COLUMNS' as diagnostic_type,
  rac.column_name as missing_column,
  'REQUIRED FOR SUPABASE AUTH' as severity
FROM required_auth_columns rac
LEFT JOIN existing_auth_columns eac ON rac.column_name = eac.column_name
WHERE eac.column_name IS NULL;

-- Step 4: Check auth.users constraints and indexes
SELECT 
  'AUTH USERS CONSTRAINTS' as diagnostic_type,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'auth' 
  AND tc.table_name = 'users'
ORDER BY tc.constraint_type;

-- Step 5: Test direct auth.users insert with minimal data
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  test_email TEXT := 'direct-auth-test-' || extract(epoch from now()) || '@example.com';
  insert_success BOOLEAN := FALSE;
  error_details TEXT;
BEGIN
  -- Attempt minimal insert into auth.users
  BEGIN
    INSERT INTO auth.users (
      id,
      email,
      created_at,
      updated_at
    ) VALUES (
      test_id,
      test_email,
      NOW(),
      NOW()
    );
    insert_success := TRUE;
    RAISE NOTICE 'SUCCESS: Direct auth.users insert works';
  EXCEPTION
    WHEN OTHERS THEN
      error_details := SQLERRM;
      RAISE WARNING 'FAILED: Direct auth.users insert failed - % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  END;
  
  -- Cleanup if successful
  IF insert_success THEN
    DELETE FROM auth.users WHERE id = test_id;
  END IF;
  
  -- Report result
  IF NOT insert_success THEN
    RAISE WARNING 'AUTH.USERS INSERT FAILURE DETAILS: %', error_details;
  END IF;
END;
$$;

-- Step 6: Test auth.users insert with encrypted password
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  test_email TEXT := 'auth-password-test-' || extract(epoch from now()) || '@example.com';
  insert_success BOOLEAN := FALSE;
BEGIN
  -- Test with encrypted password (what Supabase auth does)
  BEGIN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      created_at,
      updated_at,
      aud,
      role
    ) VALUES (
      test_id,
      test_email,
      crypt('testpassword', gen_salt('bf')),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    );
    insert_success := TRUE;
    RAISE NOTICE 'SUCCESS: Auth.users insert with encrypted password works';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'FAILED: Auth.users insert with password failed - % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  END;
  
  -- Cleanup
  IF insert_success THEN
    DELETE FROM auth.users WHERE id = test_id;
  END IF;
END;
$$;

-- Step 7: Check if pgcrypto is properly installed
SELECT 
  'PGCRYPTO STATUS' as diagnostic_type,
  extname,
  extversion,
  nspname as schema
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname = 'pgcrypto'
UNION ALL
SELECT 
  'PGCRYPTO STATUS' as diagnostic_type,
  'pgcrypto' as extname,
  'NOT INSTALLED' as extversion,
  'CRITICAL ERROR' as schema
WHERE NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto');

-- Step 8: Test crypt function specifically
DO $$
BEGIN
  PERFORM crypt('test', gen_salt('bf'));
  RAISE NOTICE 'SUCCESS: pgcrypto crypt function works';
EXCEPTION
  WHEN undefined_function THEN
    RAISE WARNING 'CRITICAL: pgcrypto crypt function not available';
  WHEN OTHERS THEN
    RAISE WARNING 'ERROR: pgcrypto test failed - %', SQLERRM;
END;
$$;

-- Step 9: Check auth.users RLS and policies
SELECT 
  'AUTH RLS STATUS' as diagnostic_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  'RLS should be DISABLED for auth.users' as note
FROM pg_tables 
WHERE schemaname = 'auth' 
  AND tablename = 'users';

-- Step 10: Check for conflicting policies
SELECT 
  'AUTH POLICIES' as diagnostic_type,
  schemaname,
  tablename,
  policyname,
  cmd,
  'These policies may interfere with Supabase auth' as warning
FROM pg_policies 
WHERE schemaname = 'auth' 
  AND tablename = 'users';

-- Step 11: Check current database and user context
SELECT 
  'DATABASE CONTEXT' as diagnostic_type,
  current_database() as database_name,
  current_user as current_user,
  session_user as session_user,
  current_setting('role') as current_role;

-- Step 12: Check if we're in a Supabase environment
SELECT 
  'SUPABASE ENVIRONMENT CHECK' as diagnostic_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'supabase_functions')
    THEN 'SUPABASE DETECTED'
    ELSE 'NOT SUPABASE OR INCOMPLETE SETUP'
  END as environment_status;

-- Step 13: Check auth service configuration
SELECT 
  'AUTH SERVICE CHECK' as diagnostic_type,
  'Check Supabase Dashboard > Authentication > Settings' as instruction,
  'Verify auth service is enabled and configured' as action_required;

-- Step 14: Final diagnostic summary
SELECT 
  'DIAGNOSTIC COMPLETE' as status,
  'Review all results above for CRITICAL ERRORS' as instruction,
  'Focus on missing tables, columns, or pgcrypto issues' as priority,
  'If auth.users table is missing, this is a Supabase infrastructure problem' as note;
