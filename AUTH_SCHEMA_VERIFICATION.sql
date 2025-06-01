-- AUTH SCHEMA VERIFICATION - Execute in Supabase SQL Editor
-- This will diagnose auth schema issues causing Error 500

-- Step 1: Check if auth schema exists and is accessible
SELECT
  'AUTH SCHEMA CHECK' as check_type,
  schema_name
FROM information_schema.schemata
WHERE schema_name = 'auth';

-- Step 2: Check auth.users table structure
SELECT
  'AUTH USERS TABLE STRUCTURE' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'auth'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Step 3: Check for missing required columns in auth.users
WITH required_columns AS (
  SELECT unnest(ARRAY[
    'id', 'email', 'encrypted_password', 'email_confirmed_at', 
    'invited_at', 'confirmation_token', 'confirmation_sent_at',
    'recovery_token', 'recovery_sent_at', 'email_change_token_new',
    'email_change', 'email_change_sent_at', 'last_sign_in_at',
    'raw_app_meta_data', 'raw_user_meta_data', 'is_super_admin',
    'created_at', 'updated_at', 'phone', 'phone_confirmed_at',
    'phone_change', 'phone_change_token', 'phone_change_sent_at',
    'email_change_token_current', 'email_change_confirm_status',
    'banned_until', 'reauthentication_token', 'reauthentication_sent_at',
    'is_sso_user', 'deleted_at', 'is_anonymous'
  ]) as column_name
),
existing_columns AS (
  SELECT column_name
  FROM information_schema.columns 
  WHERE table_schema = 'auth' AND table_name = 'users'
)
SELECT 
  'MISSING AUTH COLUMNS' as check_type,
  rc.column_name as missing_column
FROM required_columns rc
LEFT JOIN existing_columns ec ON rc.column_name = ec.column_name
WHERE ec.column_name IS NULL;

-- Step 4: Check auth.users constraints
SELECT 
  'AUTH USERS CONSTRAINTS' as check_type,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'auth' 
  AND tc.table_name = 'users'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Step 5: Check auth schema permissions using available views
SELECT
  'AUTH SCHEMA PERMISSIONS' as check_type,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.usage_privileges
WHERE object_schema = 'auth'
  AND object_type = 'SCHEMA'
ORDER BY grantee, privilege_type;

-- Step 6: Check auth.users table permissions
SELECT
  'AUTH USERS TABLE PERMISSIONS' as check_type,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'auth'
  AND table_name = 'users'
ORDER BY grantee, privilege_type;

-- Step 7: Check if auth functions exist
SELECT 
  'AUTH FUNCTIONS' as check_type,
  proname as function_name,
  prosecdef as security_definer,
  provolatile as volatility
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'auth'
  AND proname IN ('uid', 'role', 'email', 'jwt')
ORDER BY proname;

-- Step 8: Check auth policies (RLS) using direct pg_catalog queries
SELECT
  'AUTH POLICIES' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'auth'
  AND tablename = 'users';

-- Step 9: Check if auth.users has RLS enabled using pg_tables
SELECT
  'AUTH RLS STATUS' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'auth'
  AND tablename = 'users';

-- Step 10: Test basic auth.users access
DO $$
BEGIN
  -- Test if we can query auth.users
  PERFORM COUNT(*) FROM auth.users LIMIT 1;
  RAISE NOTICE 'SUCCESS: Can query auth.users table';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING 'ERROR: Insufficient privileges to access auth.users';
  WHEN undefined_table THEN
    RAISE WARNING 'ERROR: auth.users table does not exist';
  WHEN OTHERS THEN
    RAISE WARNING 'ERROR: Cannot access auth.users - %', SQLERRM;
END;
$$;

-- Step 11: Test auth.users insert capability
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  test_email TEXT := 'schema-test-' || extract(epoch from now()) || '@example.com';
BEGIN
  -- Test basic insert
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
  ) VALUES (
    test_id,
    test_email,
    crypt('test123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Schema Test"}',
    'authenticated',
    'authenticated'
  );
  
  RAISE NOTICE 'SUCCESS: Can insert into auth.users table';
  
  -- Cleanup
  DELETE FROM auth.users WHERE id = test_id;
  
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING 'ERROR: Insufficient privileges to insert into auth.users';
  WHEN undefined_function THEN
    RAISE WARNING 'ERROR: Missing crypt function - pgcrypto extension may not be installed';
  WHEN OTHERS THEN
    RAISE WARNING 'ERROR: Cannot insert into auth.users - % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- Step 12: Check for pgcrypto extension
SELECT
  'PGCRYPTO EXTENSION' as check_type,
  extname as extension_name,
  extversion as version
FROM pg_extension
WHERE extname = 'pgcrypto';

-- Step 13: Check Supabase auth configuration
SELECT 
  'SUPABASE AUTH CONFIG' as check_type,
  'Check if auth.users has all required Supabase columns' as note,
  'Verify that auth service can write to auth schema' as requirement;

-- Final summary
SELECT 
  'AUTH SCHEMA VERIFICATION COMPLETE' as status,
  'Review all check results above' as instruction,
  'Look for missing columns, permissions, or access errors' as next_step;
