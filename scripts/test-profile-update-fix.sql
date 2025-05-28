-- =====================================================
-- Profile Update Fix Test Script
-- Run this in Supabase SQL Editor to test the profile update functionality
-- =====================================================

-- 1. Test UPDATE vs INSERT operations
DO $$
DECLARE
  test_auth_id UUID := '12345678-1234-1234-1234-123456789012';
  test_email TEXT := 'test.profile.update@example.com';
  test_email_new TEXT := 'test.profile.updated@example.com';
  result_count INTEGER;
  user_record RECORD;
BEGIN
  RAISE NOTICE 'Starting Profile Update Fix Tests...';
  
  -- Clean up any existing test data
  DELETE FROM public.users WHERE email IN (test_email, test_email_new);
  
  -- Test 1: Create a user first (simulating signup)
  INSERT INTO public.users (auth_id, email, full_name, phone, status)
  VALUES (test_auth_id, test_email, 'Test User', '+1234567890', 'active');
  
  SELECT COUNT(*) INTO result_count FROM public.users WHERE auth_id = test_auth_id;
  
  IF result_count = 1 THEN
    RAISE NOTICE 'Test 1 PASSED: User created successfully';
  ELSE
    RAISE NOTICE 'Test 1 FAILED: User not created';
  END IF;
  
  -- Test 2: Update the user profile (simulating profile settings update)
  UPDATE public.users 
  SET 
    email = test_email_new,
    full_name = 'Updated Test User',
    phone = '+0987654321',
    bio = 'Updated bio',
    location = 'Updated location',
    updated_at = NOW()
  WHERE auth_id = test_auth_id;
  
  -- Verify the update worked
  SELECT * INTO user_record FROM public.users WHERE auth_id = test_auth_id;
  
  IF user_record.email = test_email_new AND user_record.full_name = 'Updated Test User' THEN
    RAISE NOTICE 'Test 2 PASSED: User profile updated successfully via UPDATE';
  ELSE
    RAISE NOTICE 'Test 2 FAILED: User profile not updated correctly';
  END IF;
  
  -- Test 3: Verify no duplicate users were created
  SELECT COUNT(*) INTO result_count FROM public.users WHERE auth_id = test_auth_id;
  
  IF result_count = 1 THEN
    RAISE NOTICE 'Test 3 PASSED: No duplicate users created during update';
  ELSE
    RAISE NOTICE 'Test 3 FAILED: Found % users with same auth_id', result_count;
  END IF;
  
  -- Test 4: Test UPSERT functionality
  INSERT INTO public.users (auth_id, email, full_name, phone, status, bio)
  VALUES (test_auth_id, 'test.upsert@example.com', 'Upserted User', '+1111111111', 'active', 'Upserted bio')
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    bio = EXCLUDED.bio,
    updated_at = NOW();
  
  SELECT * INTO user_record FROM public.users WHERE auth_id = test_auth_id;
  
  IF user_record.email = 'test.upsert@example.com' AND user_record.full_name = 'Upserted User' THEN
    RAISE NOTICE 'Test 4 PASSED: UPSERT operation worked correctly';
  ELSE
    RAISE NOTICE 'Test 4 FAILED: UPSERT operation failed';
  END IF;
  
  -- Test 5: Verify still only one user
  SELECT COUNT(*) INTO result_count FROM public.users WHERE auth_id = test_auth_id;
  
  IF result_count = 1 THEN
    RAISE NOTICE 'Test 5 PASSED: UPSERT did not create duplicates';
  ELSE
    RAISE NOTICE 'Test 5 FAILED: Found % users after UPSERT', result_count;
  END IF;
  
  -- Clean up test data
  DELETE FROM public.users WHERE auth_id = test_auth_id;
  
  RAISE NOTICE 'Profile Update Fix Tests completed successfully.';
END
$$;

-- 2. Test email uniqueness constraint during updates
DO $$
DECLARE
  test_auth_id1 UUID := '11111111-1111-1111-1111-111111111111';
  test_auth_id2 UUID := '22222222-2222-2222-2222-222222222222';
  test_email1 TEXT := 'user1@example.com';
  test_email2 TEXT := 'user2@example.com';
  constraint_violated BOOLEAN := false;
BEGIN
  RAISE NOTICE 'Starting Email Uniqueness During Update Tests...';
  
  -- Clean up any existing test data
  DELETE FROM public.users WHERE email IN (test_email1, test_email2);
  
  -- Create two users with different emails
  INSERT INTO public.users (auth_id, email, full_name, phone)
  VALUES 
    (test_auth_id1, test_email1, 'User One', '+1111111111'),
    (test_auth_id2, test_email2, 'User Two', '+2222222222');
  
  -- Try to update user2's email to user1's email (should fail)
  BEGIN
    UPDATE public.users 
    SET email = test_email1
    WHERE auth_id = test_auth_id2;
  EXCEPTION
    WHEN unique_violation THEN
      constraint_violated := true;
      RAISE NOTICE 'Email uniqueness constraint correctly prevented duplicate email during update';
  END;
  
  IF constraint_violated THEN
    RAISE NOTICE 'Test PASSED: Email uniqueness constraint works during updates';
  ELSE
    RAISE NOTICE 'Test FAILED: Email uniqueness constraint not working during updates';
  END IF;
  
  -- Clean up test data
  DELETE FROM public.users WHERE email IN (test_email1, test_email2);
  
  RAISE NOTICE 'Email Uniqueness During Update Tests completed.';
END
$$;

-- 3. Verify database constraints are in place
SELECT 
  'Constraint Verification' as check_type,
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND constraint_type IN ('UNIQUE', 'CHECK')
ORDER BY constraint_type, constraint_name;

-- 4. Check RLS policies
SELECT 
  'RLS Policy Verification' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY policyname;

RAISE NOTICE 'All Profile Update Fix Tests completed!';
