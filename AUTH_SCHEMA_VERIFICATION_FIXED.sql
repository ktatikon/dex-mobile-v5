-- AUTH SCHEMA VERIFICATION FIXED - Execute in Supabase SQL Editor
-- This uses only available information_schema views to diagnose auth issues

-- Step 1: Check if auth schema exists
SELECT 
  'AUTH SCHEMA CHECK' as check_type,
  schema_name,
  'Schema exists' as status
FROM information_schema.schemata 
WHERE schema_name = 'auth'
UNION ALL
SELECT 
  'AUTH SCHEMA CHECK' as check_type,
  'auth' as schema_name,
  'Schema MISSING' as status
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
);

-- Step 2: Check if auth.users table exists
SELECT 
  'AUTH USERS TABLE CHECK' as check_type,
  table_schema,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
UNION ALL
SELECT 
  'AUTH USERS TABLE CHECK' as check_type,
  'auth' as table_schema,
  'users' as table_name,
  'TABLE MISSING' as table_type
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'auth' AND table_name = 'users'
);

-- Step 3: Check auth.users table structure (if it exists)
SELECT 
  'AUTH USERS COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Step 4: Check for essential auth.users columns
WITH essential_columns AS (
  SELECT unnest(ARRAY[
    'id', 'email', 'encrypted_password', 'created_at', 'updated_at',
    'raw_user_meta_data', 'raw_app_meta_data', 'aud', 'role'
  ]) as column_name
),
existing_columns AS (
  SELECT column_name
  FROM information_schema.columns 
  WHERE table_schema = 'auth' AND table_name = 'users'
)
SELECT 
  'MISSING ESSENTIAL COLUMNS' as check_type,
  ec.column_name as missing_column,
  'REQUIRED FOR SUPABASE AUTH' as importance
FROM essential_columns ec
LEFT JOIN existing_columns ex ON ec.column_name = ex.column_name
WHERE ex.column_name IS NULL;

-- Step 5: Check auth.users constraints
SELECT 
  'AUTH USERS CONSTRAINTS' as check_type,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'auth' 
  AND tc.table_name = 'users'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Step 6: Check table permissions for service_role
SELECT 
  'AUTH TABLE PERMISSIONS' as check_type,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
  AND grantee IN ('service_role', 'authenticated', 'anon')
ORDER BY grantee, privilege_type;

-- Step 7: Check routine permissions (functions)
SELECT 
  'AUTH FUNCTION PERMISSIONS' as check_type,
  grantee,
  routine_name,
  privilege_type
FROM information_schema.routine_privileges 
WHERE routine_schema = 'auth'
  AND grantee IN ('service_role', 'authenticated', 'anon')
ORDER BY grantee, routine_name;

-- Step 8: Check if essential auth functions exist
SELECT 
  'AUTH FUNCTIONS CHECK' as check_type,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'auth'
  AND routine_name IN ('uid', 'role', 'email', 'jwt')
ORDER BY routine_name;

-- Step 9: Check for pgcrypto extension
SELECT 
  'PGCRYPTO EXTENSION' as check_type,
  extname as extension_name,
  extversion as version,
  'INSTALLED' as status
FROM pg_extension 
WHERE extname = 'pgcrypto'
UNION ALL
SELECT 
  'PGCRYPTO EXTENSION' as check_type,
    extname as extension_name,
  extversion as version,
  'INSTALLED' as status
FROM pg_extension 
WHERE extname = 'pgcrypto'
UNION ALL
SELECT 
  'PGCRYPTO EXTENSION' as check_type,
  'pgcrypto' as extension_name,
  NULL as version,  -- Changed 'N/A' to NULL
  'MISSING - REQUIRED FOR PASSWORD HASHING' as status
WHERE NOT EXISTS (
  SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
);

-- Step 10: Check RLS status on auth.users
SELECT 
  'AUTH RLS STATUS' as check_type,
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN 'RLS ENABLED'
    ELSE 'RLS DISABLED'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'auth' 
  AND tablename = 'users';

-- Step 11: Check for RLS policies on auth.users
SELECT 
  'AUTH RLS POLICIES' as check_type,
  schemaname,
  tablename,
  policyname,
  cmd as command_type,
  roles
FROM pg_policies 
WHERE schemaname = 'auth' 
  AND tablename = 'users'
UNION ALL
SELECT 
  'AUTH RLS POLICIES' as check_type,
  'auth' as schemaname,
  'users' as tablename,
  'NO POLICIES FOUND' as policyname,
   NULL as command_type,  -- Changed 'N/A' to NULL
   NULL as roles  -- Changed 'N/A' to NULL
WHERE NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname = 'auth' AND tablename = 'users'
);

-- Step 12: Test basic auth.users access
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

-- Step 13: Test crypt function availability
DO $$
BEGIN
  PERFORM crypt('test', gen_salt('bf'));
  RAISE NOTICE 'SUCCESS: pgcrypto crypt function is available';
EXCEPTION
  WHEN undefined_function THEN
    RAISE WARNING 'ERROR: pgcrypto crypt function not available - extension may not be installed';
  WHEN OTHERS THEN
    RAISE WARNING 'ERROR: Cannot test crypt function - %', SQLERRM;
END;
$$;

-- Step 14: Test auth.users insert capability (minimal test)
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  test_email TEXT := 'schema-test-' || extract(epoch from now()) || '@example.com';
BEGIN
  -- Test minimal insert
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
  
  RAISE NOTICE 'SUCCESS: Can insert into auth.users table';
  
  -- Cleanup
  DELETE FROM auth.users WHERE id = test_id;
  
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING 'ERROR: Insufficient privileges to insert into auth.users';
  WHEN undefined_table THEN
    RAISE WARNING 'ERROR: auth.users table does not exist for insert';
  WHEN OTHERS THEN
    RAISE WARNING 'ERROR: Cannot insert into auth.users - % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- Step 15: Summary and recommendations
SELECT 
  'VERIFICATION SUMMARY' as check_type,
  'Check all results above for issues' as instruction,
  'Look for MISSING tables, columns, or permissions' as focus_areas,
  'Execute AUTH_SCHEMA_MIGRATION_FIX.sql to resolve issues' as next_step;

-- Step 16: Show current user and role for context
SELECT 
  'CURRENT SESSION INFO' as check_type,
  current_user as current_user,
  session_user as session_user,
  current_setting('role') as current_role;
