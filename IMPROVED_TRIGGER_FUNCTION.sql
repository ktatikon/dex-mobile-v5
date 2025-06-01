-- IMPROVED TRIGGER FUNCTION - Execute in Supabase SQL Editor
-- This creates a robust trigger function with comprehensive error handling

-- Step 1: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Step 2: Create improved trigger function with detailed logging
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql AS $$
DECLARE
  user_full_name TEXT;
  user_phone TEXT;
  user_role TEXT;
  profile_exists BOOLEAN := FALSE;
BEGIN
  -- Log trigger execution start
  RAISE LOG 'handle_new_user: Starting for user ID %', NEW.id;
  RAISE LOG 'handle_new_user: Email %', NEW.email;
  RAISE LOG 'handle_new_user: Raw metadata %', NEW.raw_user_meta_data;
  
  -- Extract and validate metadata
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'User');
  user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  
  -- Validate extracted data
  IF user_full_name IS NULL OR trim(user_full_name) = '' THEN
    user_full_name := 'User';
  END IF;
  
  IF user_phone IS NULL THEN
    user_phone := '';
  END IF;
  
  IF user_role IS NULL OR user_role NOT IN ('user', 'premium', 'admin', 'super_admin') THEN
    user_role := 'user';
  END IF;
  
  RAISE LOG 'handle_new_user: Processed data - Name: %, Phone: %, Role: %', 
    user_full_name, user_phone, user_role;
  
  -- Check if profile already exists
  SELECT EXISTS(
    SELECT 1 FROM public.users WHERE auth_id = NEW.id
  ) INTO profile_exists;
  
  IF profile_exists THEN
    RAISE LOG 'handle_new_user: Profile already exists for user %, updating...', NEW.id;
    
    -- Update existing profile
    UPDATE public.users SET
      email = NEW.email,
      full_name = user_full_name,
      phone = user_phone,
      role = user_role,
      updated_at = NOW()
    WHERE auth_id = NEW.id;
    
    RAISE LOG 'handle_new_user: Profile updated successfully for user %', NEW.id;
  ELSE
    RAISE LOG 'handle_new_user: Creating new profile for user %', NEW.id;
    
    -- Insert new user profile
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
    );
    
    RAISE LOG 'handle_new_user: Profile created successfully for user %', NEW.id;
  END IF;
  
  -- Verify the profile was created/updated
  SELECT EXISTS(
    SELECT 1 FROM public.users WHERE auth_id = NEW.id
  ) INTO profile_exists;
  
  IF NOT profile_exists THEN
    RAISE WARNING 'handle_new_user: Profile verification failed for user %', NEW.id;
  ELSE
    RAISE LOG 'handle_new_user: Profile verification successful for user %', NEW.id;
  END IF;
  
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    RAISE LOG 'handle_new_user: Unique violation for user % - profile may already exist', NEW.id;
    RETURN NEW;
  WHEN foreign_key_violation THEN
    RAISE WARNING 'handle_new_user: Foreign key violation for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
  WHEN check_violation THEN
    RAISE WARNING 'handle_new_user: Check constraint violation for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
  WHEN not_null_violation THEN
    RAISE WARNING 'handle_new_user: Not null violation for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: Unexpected error for user %: % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Step 3: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- Step 4: Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres;

-- Step 5: Test the improved function
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'improved-test-' || extract(epoch from now()) || '@example.com';
  test_metadata JSONB := '{"full_name": "Improved Test User", "phone": "+1234567890", "role": "user"}';
  profile_count INTEGER;
  profile_data RECORD;
BEGIN
  RAISE NOTICE 'Testing improved trigger function...';
  RAISE NOTICE 'Test User ID: %', test_user_id;
  RAISE NOTICE 'Test Email: %', test_email;
  
  -- Insert test auth user
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
  
  -- Wait for trigger
  PERFORM pg_sleep(1);
  
  -- Check result
  SELECT COUNT(*) INTO profile_count
  FROM public.users 
  WHERE auth_id = test_user_id;
  
  IF profile_count > 0 THEN
    RAISE NOTICE 'SUCCESS: Profile created successfully';
    
    -- Get profile details
    SELECT * INTO profile_data
    FROM public.users 
    WHERE auth_id = test_user_id;
    
    RAISE NOTICE 'Profile Details:';
    RAISE NOTICE '  ID: %', profile_data.id;
    RAISE NOTICE '  Auth ID: %', profile_data.auth_id;
    RAISE NOTICE '  Email: %', profile_data.email;
    RAISE NOTICE '  Full Name: %', profile_data.full_name;
    RAISE NOTICE '  Phone: %', profile_data.phone;
    RAISE NOTICE '  Status: %', profile_data.status;
    RAISE NOTICE '  Role: %', profile_data.role;
    
  ELSE
    RAISE WARNING 'FAILURE: No profile created';
  END IF;
  
  -- Cleanup
  DELETE FROM public.users WHERE auth_id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
  
  RAISE NOTICE 'Test completed and cleaned up';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Test failed with error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    -- Cleanup on error
    DELETE FROM public.users WHERE auth_id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;
END;
$$;

-- Step 6: Verify function and trigger are properly installed
SELECT 
  'IMPROVED TRIGGER FUNCTION INSTALLED' as status,
  proname as function_name,
  prosecdef as security_definer_enabled
FROM pg_proc 
WHERE proname = 'handle_new_user';

SELECT 
  'TRIGGER INSTALLED' as status,
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Final message
SELECT 
  'SETUP COMPLETE' as status,
  'The improved trigger function should now handle user creation properly' as message,
  'Try creating a user through the admin interface now' as next_step;
