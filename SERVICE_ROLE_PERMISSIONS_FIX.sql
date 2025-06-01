-- SERVICE ROLE PERMISSIONS FIX - Execute in Supabase SQL Editor
-- This ensures service_role has all necessary permissions for auth operations

-- Step 1: Grant comprehensive auth schema permissions
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL PRIVILEGES ON SCHEMA auth TO service_role;

-- Step 2: Grant all permissions on auth.users table
GRANT ALL PRIVILEGES ON auth.users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.users TO service_role;

-- Step 3: Grant sequence permissions (for auto-incrementing fields)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO service_role;

-- Step 4: Grant function execution permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO service_role;

-- Step 5: Grant permissions on public schema for trigger function
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON public.users TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Step 6: Ensure service_role can execute our trigger function
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- Step 7: Grant permissions for pgcrypto functions (password hashing)
GRANT EXECUTE ON FUNCTION crypt(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION gen_salt(text) TO service_role;
GRANT EXECUTE ON FUNCTION gen_salt(text, integer) TO service_role;

-- Step 8: Create service_role if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role;
    RAISE NOTICE 'Created service_role';
  ELSE
    RAISE NOTICE 'service_role already exists';
  END IF;
END;
$$;

-- Step 9: Grant service_role necessary database-level permissions
ALTER ROLE service_role WITH LOGIN;
ALTER ROLE service_role WITH CREATEDB;
ALTER ROLE service_role WITH CREATEROLE;

-- Step 10: Make service_role a member of postgres role for full access
GRANT postgres TO service_role;

-- Step 11: Ensure service_role can bypass RLS when needed
ALTER ROLE service_role SET row_security = off;

-- Step 12: Grant permissions on system catalogs that Supabase might need
GRANT SELECT ON pg_authid TO service_role;
GRANT SELECT ON pg_database TO service_role;
GRANT SELECT ON pg_roles TO service_role;

-- Step 13: Test service_role permissions
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  test_email TEXT := 'service-role-test-' || extract(epoch from now()) || '@example.com';
BEGIN
  -- Test if service_role can insert into auth.users
  SET ROLE service_role;
  
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
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
    '{"provider": "email"}',
    '{"full_name": "Service Role Test"}',
    'authenticated',
    'authenticated'
  );
  
  RESET ROLE;
  
  RAISE NOTICE 'SUCCESS: service_role can insert into auth.users';
  
  -- Cleanup
  DELETE FROM public.users WHERE auth_id = test_id;
  DELETE FROM auth.users WHERE id = test_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RESET ROLE;
    RAISE WARNING 'ERROR: service_role permission test failed - % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    -- Cleanup on error
    DELETE FROM public.users WHERE auth_id = test_id;
    DELETE FROM auth.users WHERE id = test_id;
END;
$$;

-- Step 14: Verify all permissions are granted
SELECT 
  'SERVICE ROLE AUTH PERMISSIONS' as check_type,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.schema_privileges 
WHERE schema_name = 'auth' 
  AND grantee = 'service_role'
ORDER BY privilege_type;

SELECT 
  'SERVICE ROLE TABLE PERMISSIONS' as check_type,
  grantee,
  table_name,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
  AND grantee = 'service_role'
ORDER BY privilege_type;

-- Step 15: Check role attributes
SELECT 
  'SERVICE ROLE ATTRIBUTES' as check_type,
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

-- Final verification message
SELECT 
  'SERVICE ROLE PERMISSIONS FIX COMPLETE' as status,
  'service_role should now have full access to auth schema' as message,
  'Supabase auth.signUp() should work properly now' as expected_result;
