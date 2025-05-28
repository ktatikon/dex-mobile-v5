DO $$
DECLARE
  test_auth_id UUID := '12345678-1234-1234-1234-123456789012';
  test_email TEXT := 'test.kyc@example.com';
  result_count INTEGER;
  kyc_record RECORD;
BEGIN
  RAISE NOTICE 'Starting KYC Fix Tests...';
  
  -- Clean up any existing test data
  DELETE FROM public.kyc WHERE user_id = test_auth_id;
  DELETE FROM auth.users WHERE email = test_email;
  
  -- Create a test auth user (simulating signup)
  INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
  VALUES (test_auth_id, test_email, NOW(), NOW(), NOW());
  
  -- Test 1: Insert KYC record with auth user ID
  INSERT INTO public.kyc (
    user_id,
    first_name,
    last_name,
    date_of_birth,
    address,
    city,
    state,
    postal_code,
    country,
    phone,
    email,
    document_type,
    status,
    submitted_at
  ) VALUES (
    test_auth_id,
    'Test',
    'User',
    '1990-01-01',
    '123 Test Street',
    'Test City',
    'Test State',
    '12345',
    'Test Country',
    '+1234567890',
    test_email,
    'passport',
    'pending',
    NOW()
  );
  
  SELECT COUNT(*) INTO result_count FROM public.kyc WHERE user_id = test_auth_id;
  
  IF result_count = 1 THEN
    RAISE NOTICE 'Test 1 PASSED: KYC record inserted successfully with auth user ID';
  ELSE
    RAISE NOTICE 'Test 1 FAILED: KYC record not inserted';
  END IF;
  
  -- Test 2: Verify the KYC record can be retrieved
  SELECT * INTO kyc_record FROM public.kyc WHERE user_id = test_auth_id;
  
  IF kyc_record.first_name = 'Test' AND kyc_record.status = 'pending' THEN
    RAISE NOTICE 'Test 2 PASSED: KYC record retrieved successfully';
  ELSE
    RAISE NOTICE 'Test 2 FAILED: KYC record not retrieved correctly';
  END IF;
  
  -- Test 3: Update KYC record
  UPDATE public.kyc 
  SET 
    first_name = 'Updated Test',
    last_name = 'Updated User',
    address = '456 Updated Street'
  WHERE user_id = test_auth_id;
  
  SELECT * INTO kyc_record FROM public.kyc WHERE user_id = test_auth_id;
  
  IF kyc_record.first_name = 'Updated Test' AND kyc_record.address = '456 Updated Street' THEN
    RAISE NOTICE 'Test 3 PASSED: KYC record updated successfully';
  ELSE
    RAISE NOTICE 'Test 3 FAILED: KYC record not updated correctly';
  END IF;
  
  -- Test 4: Verify no duplicate KYC records
  SELECT COUNT(*) INTO result_count FROM public.kyc WHERE user_id = test_auth_id;
  
  IF result_count <= 1 THEN
    RAISE NOTICE 'Test 4 PASSED: No duplicate KYC records found';
  ELSE
    RAISE NOTICE 'Test 4 FAILED: Duplicate KYC records found';
  END IF;

END $$;