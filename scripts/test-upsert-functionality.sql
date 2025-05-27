-- =====================================================
-- Test UPSERT Functionality for Users Table
-- Run this to verify the fixes work correctly
-- =====================================================

-- 1. Test basic UPSERT functionality
DO $$
DECLARE
  test_auth_id UUID := '12345678-1234-1234-1234-123456789012';
  test_email TEXT := 'test.upsert@example.com';
  result_count INTEGER;
BEGIN
  RAISE NOTICE 'Starting UPSERT functionality tests...';
  
  -- Clean up any existing test data
  DELETE FROM public.users WHERE email = test_email;
  
  -- Test 1: Insert new user
  INSERT INTO public.users (auth_id, email, full_name, phone)
  VALUES (test_auth_id, test_email, 'Test User', '+1234567890')
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;
  
  SELECT COUNT(*) INTO result_count FROM public.users WHERE email = test_email;
  
  IF result_count = 1 THEN
    RAISE NOTICE 'Test 1 PASSED: New user inserted successfully';
  ELSE
    RAISE NOTICE 'Test 1 FAILED: Expected 1 user, found %', result_count;
  END IF;
  
  -- Test 2: Update existing user (UPSERT)
  INSERT INTO public.users (auth_id, email, full_name, phone)
  VALUES (test_auth_id, test_email, 'Updated Test User', '+0987654321')
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;
  
  SELECT COUNT(*) INTO result_count FROM public.users WHERE email = test_email AND full_name = 'Updated Test User';
  
  IF result_count = 1 THEN
    RAISE NOTICE 'Test 2 PASSED: User updated successfully via UPSERT';
  ELSE
    RAISE NOTICE 'Test 2 FAILED: User not updated correctly';
  END IF;
  
  -- Test 3: Verify no duplicates created
  SELECT COUNT(*) INTO result_count FROM public.users WHERE auth_id = test_auth_id;
  
  IF result_count = 1 THEN
    RAISE NOTICE 'Test 3 PASSED: No duplicate users created';
  ELSE
    RAISE NOTICE 'Test 3 FAILED: Found % users with same auth_id', result_count;
  END IF;
  
  -- Clean up test data
  DELETE FROM public.users WHERE email = test_email;
  
  RAISE NOTICE 'UPSERT functionality tests completed.';
END
$$;

-- 2. Test email uniqueness constraint
DO $$
DECLARE
  test_email TEXT := 'unique.test@example.com';
  test_auth_id1 UUID := '11111111-1111-1111-1111-111111111111';
  test_auth_id2 UUID := '22222222-2222-2222-2222-222222222222';
  constraint_violated BOOLEAN := false;
BEGIN
  RAISE NOTICE 'Starting email uniqueness tests...';
  
  -- Clean up any existing test data
  DELETE FROM public.users WHERE email = test_email;
  
  -- Insert first user
  INSERT INTO public.users (auth_id, email, full_name, phone)
  VALUES (test_auth_id1, test_email, 'First User', '+1111111111');
  
  -- Try to insert second user with same email but different auth_id
  BEGIN
    INSERT INTO public.users (auth_id, email, full_name, phone)
    VALUES (test_auth_id2, test_email, 'Second User', '+2222222222');
  EXCEPTION
    WHEN unique_violation THEN
      constraint_violated := true;
      RAISE NOTICE 'Email uniqueness constraint working correctly';
  END;
  
  IF constraint_violated THEN
    RAISE NOTICE 'Test PASSED: Email uniqueness constraint prevents duplicates';
  ELSE
    RAISE NOTICE 'Test FAILED: Email uniqueness constraint not working';
  END IF;
  
  -- Clean up test data
  DELETE FROM public.users WHERE email = test_email;
  
  RAISE NOTICE 'Email uniqueness tests completed.';
END
$$;

-- 3. Test auth_id uniqueness constraint
DO $$
DECLARE
  test_auth_id UUID := '33333333-3333-3333-3333-333333333333';
  test_email1 TEXT := 'auth1.test@example.com';
  test_email2 TEXT := 'auth2.test@example.com';
  constraint_violated BOOLEAN := false;
BEGIN
  RAISE NOTICE 'Starting auth_id uniqueness tests...';
  
  -- Clean up any existing test data
  DELETE FROM public.users WHERE email IN (test_email1, test_email2);
  
  -- Insert first user
  INSERT INTO public.users (auth_id, email, full_name, phone)
  VALUES (test_auth_id, test_email1, 'First User', '+1111111111');
  
  -- Try to insert second user with same auth_id but different email
  BEGIN
    INSERT INTO public.users (auth_id, email, full_name, phone)
    VALUES (test_auth_id, test_email2, 'Second User', '+2222222222');
  EXCEPTION
    WHEN unique_violation THEN
      constraint_violated := true;
      RAISE NOTICE 'Auth_id uniqueness constraint working correctly';
  END;
  
  IF constraint_violated THEN
    RAISE NOTICE 'Test PASSED: Auth_id uniqueness constraint prevents duplicates';
  ELSE
    RAISE NOTICE 'Test FAILED: Auth_id uniqueness constraint not working';
  END IF;
  
  -- Clean up test data
  DELETE FROM public.users WHERE email IN (test_email1, test_email2);
  
  RAISE NOTICE 'Auth_id uniqueness tests completed.';
END
$$;

-- 4. Test sync function
DO $$
BEGIN
  RAISE NOTICE 'Testing sync function exists and is properly defined...';
  
  -- Check if function exists
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'sync_auth_user_to_public_users'
  ) THEN
    RAISE NOTICE 'Test PASSED: Sync function exists';
  ELSE
    RAISE NOTICE 'Test FAILED: Sync function not found';
  END IF;
  
  -- Check if trigger exists
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_schema = 'auth' 
    AND trigger_name = 'sync_auth_user_trigger'
  ) THEN
    RAISE NOTICE 'Test PASSED: Sync trigger exists';
  ELSE
    RAISE NOTICE 'Test FAILED: Sync trigger not found';
  END IF;
END
$$;

-- 5. Display current constraints and indexes
SELECT 
  'Current Constraints' as info_type,
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY constraint_type, constraint_name;

-- 6. Display current indexes
SELECT 
  'Current Indexes' as info_type,
  indexname as index_name,
  tablename as table_name,
  indexdef as definition
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY indexname;

-- 7. Final summary
SELECT 
  'Test Summary' as info_type,
  'All UPSERT functionality tests completed' as message,
  NOW() as completed_at;
