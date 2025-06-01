-- SERVICE ROLE CHECK ONLY - Execute in Supabase SQL Editor
-- This checks existing service_role permissions without trying to modify them

-- Step 1: Check if service_role exists and its attributes
SELECT 
  'SERVICE ROLE STATUS' as check_type,
  rolname,
  rolsuper,
  rolinherit,
  rolcreaterole,
  rolcreatedb,
  rolcanlogin,
  rolreplication,
  rolbypassrls
FROM pg_roles 
WHERE rolname = 'service_role';

-- Step 2: Check service_role permissions on auth schema
SELECT 
  'SERVICE ROLE AUTH SCHEMA PERMISSIONS' as check_type,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.usage_privileges 
WHERE object_schema = 'auth'
  AND object_type = 'SCHEMA'
  AND grantee = 'service_role'
ORDER BY privilege_type;

-- Step 3: Check service_role permissions on auth.users table
SELECT 
  'SERVICE ROLE AUTH USERS PERMISSIONS' as check_type,
  grantee,
  table_name,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
  AND grantee = 'service_role'
ORDER BY privilege_type;

-- Step 4: Check service_role permissions on public.users table
SELECT 
  'SERVICE ROLE PUBLIC USERS PERMISSIONS' as check_type,
  grantee,
  table_name,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND grantee = 'service_role'
ORDER BY privilege_type;

-- Step 5: Test if service_role can access auth.users (read-only test)
DO $$
BEGIN
  -- Test basic read access
  PERFORM COUNT(*) FROM auth.users LIMIT 1;
  RAISE NOTICE 'SUCCESS: Current session can read auth.users';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING 'ERROR: Insufficient privileges to read auth.users';
  WHEN undefined_table THEN
    RAISE WARNING 'ERROR: auth.users table does not exist';
  WHEN OTHERS THEN
    RAISE WARNING 'ERROR: Cannot access auth.users - %', SQLERRM;
END;
$$;

-- Step 6: Test if we can access public.users
DO $$
BEGIN
  PERFORM COUNT(*) FROM public.users LIMIT 1;
  RAISE NOTICE 'SUCCESS: Current session can read public.users';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING 'ERROR: Insufficient privileges to read public.users';
  WHEN undefined_table THEN
    RAISE WARNING 'ERROR: public.users table does not exist';
  WHEN OTHERS THEN
    RAISE WARNING 'ERROR: Cannot access public.users - %', SQLERRM;
END;
$$;

-- Step 7: Check if our trigger function exists and its permissions
SELECT 
  'TRIGGER FUNCTION STATUS' as check_type,
  proname as function_name,
  prosecdef as security_definer,
  provolatile as volatility,
  proacl as access_privileges
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Step 8: Check if trigger exists
SELECT 
  'TRIGGER STATUS' as check_type,
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgfoid::regproc as function_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Step 9: Test pgcrypto functions availability
DO $$
BEGIN
  PERFORM crypt('test', gen_salt('bf'));
  RAISE NOTICE 'SUCCESS: pgcrypto functions are available';
EXCEPTION
  WHEN undefined_function THEN
    RAISE WARNING 'ERROR: pgcrypto functions not available';
  WHEN OTHERS THEN
    RAISE WARNING 'ERROR: Cannot test pgcrypto - %', SQLERRM;
END;
$$;

-- Step 10: Summary of what we found
SELECT 
  'PERMISSION CHECK SUMMARY' as status,
  'service_role is managed by Supabase and cannot be modified' as note,
  'Check results above for any missing permissions or tables' as instruction,
  'Focus on fixing auth schema structure instead' as recommendation;
