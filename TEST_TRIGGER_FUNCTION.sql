-- TEST TRIGGER FUNCTION - Execute in Supabase SQL Editor
-- This will test the handle_new_user() trigger function directly

-- Step 1: Check if trigger function exists and is properly configured
SELECT 
  proname as function_name,
  prosecdef as security_definer,
  provolatile as volatility,
  prolang as language_oid,
  (SELECT lanname FROM pg_language WHERE oid = prolang) as language_name
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Step 2: Check if trigger exists on auth.users
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgfoid::regproc as function_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Step 3: Check current users table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Step 4: Check for any constraints that might cause issues
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  tc.table_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'users';

-- Step 5: Test the trigger function manually
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'test-trigger-' || extract(epoch from now()) || '@example.com';
  test_metadata JSONB := '{"full_name": "Test User", "phone": "+1234567890", "role": "user"}';
  profile_count INTEGER;
BEGIN
  RAISE NOTICE 'Testing trigger function with:';
  RAISE NOTICE 'User ID: %', test_user_id;
  RAISE NOTICE 'Email: %', test_email;
  RAISE NOTICE 'Metadata: %', test_metadata;
  
  -- Simulate auth.users insert (this should trigger the function)
  INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    created_at,
    updated_at,
    email_confirmed_at,
    aud,
    role
  ) VALUES (
    test_user_id,
    test_email,
    test_metadata,
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  );
  
  -- Wait a moment for trigger to execute
  PERFORM pg_sleep(1);
  
  -- Check if profile was created
  SELECT COUNT(*) INTO profile_count
  FROM public.users 
  WHERE auth_id = test_user_id;
  
  IF profile_count > 0 THEN
    RAISE NOTICE 'SUCCESS: Profile created in public.users table';
    
    -- Show the created profile
    SELECT 
      id,
      auth_id,
      email,
      full_name,
      phone,
      status,
      role,
      created_at
    FROM public.users 
    WHERE auth_id = test_user_id;
    
  ELSE
    RAISE WARNING 'FAILURE: No profile found in public.users table';
  END IF;
  
  -- Cleanup test data
  DELETE FROM public.users WHERE auth_id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
  
  RAISE NOTICE 'Test cleanup completed';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'ERROR during trigger test: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    
    -- Cleanup on error
    DELETE FROM public.users WHERE auth_id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;
END;
$$;

-- Step 6: Check for any recent errors in the logs
-- Note: This might not work in all Supabase environments
SELECT 
  'Check Supabase logs for any trigger function errors' as note,
  'Look for handle_new_user function execution logs' as instruction;

-- Step 7: Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  hasrls as has_rls_policies
FROM pg_tables 
WHERE tablename IN ('users') 
  AND schemaname = 'public';

-- Step 8: Test direct insert into public.users (should work with RLS disabled)
DO $$
DECLARE
  test_auth_id UUID := gen_random_uuid();
  test_email TEXT := 'direct-test-' || extract(epoch from now()) || '@example.com';
BEGIN
  -- Test direct insert
  INSERT INTO public.users (
    auth_id,
    email,
    full_name,
    phone,
    status,
    role
  ) VALUES (
    test_auth_id,
    test_email,
    'Direct Test User',
    '+1234567890',
    'active',
    'user'
  );
  
  RAISE NOTICE 'SUCCESS: Direct insert into public.users works';
  
  -- Cleanup
  DELETE FROM public.users WHERE auth_id = test_auth_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'ERROR during direct insert test: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- Final summary
SELECT 
  'TRIGGER FUNCTION TEST COMPLETED' as status,
  'Check the notices and warnings above for results' as instruction,
  'If trigger test failed, the handle_new_user function needs fixing' as note;
