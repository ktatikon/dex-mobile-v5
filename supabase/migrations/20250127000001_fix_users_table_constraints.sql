-- =====================================================
-- Fix Users Table Constraints and Indexes
-- Addresses duplicate key constraint violations
-- =====================================================

-- 1. Add explicit unique constraint on email if it doesn't exist
DO $$
BEGIN
  -- Check if unique constraint on email already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%email%'
  ) THEN
    -- Add unique constraint on email
    ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);
    RAISE NOTICE 'Added unique constraint on users.email';
  ELSE
    RAISE NOTICE 'Unique constraint on users.email already exists';
  END IF;
END
$$;

-- 2. Ensure auth_id unique constraint exists (should already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%auth_id%'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_auth_id_unique UNIQUE (auth_id);
    RAISE NOTICE 'Added unique constraint on users.auth_id';
  ELSE
    RAISE NOTICE 'Unique constraint on users.auth_id already exists';
  END IF;
END
$$;

-- 3. Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_auth_id_idx ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS users_status_idx ON public.users(status);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON public.users(created_at);

-- 4. Add check constraint for email format
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_schema = 'public' 
    AND constraint_name = 'users_email_format_check'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_email_format_check 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    RAISE NOTICE 'Added email format check constraint';
  ELSE
    RAISE NOTICE 'Email format check constraint already exists';
  END IF;
END
$$;

-- 5. Add check constraint for phone format (basic validation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_schema = 'public' 
    AND constraint_name = 'users_phone_format_check'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_phone_format_check 
    CHECK (phone ~ '^[+]?[0-9\s\-\(\)]{5,20}$');
    RAISE NOTICE 'Added phone format check constraint';
  ELSE
    RAISE NOTICE 'Phone format check constraint already exists';
  END IF;
END
$$;

-- 6. Ensure full_name is not empty
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_schema = 'public' 
    AND constraint_name = 'users_full_name_not_empty'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_full_name_not_empty 
    CHECK (length(trim(full_name)) > 0);
    RAISE NOTICE 'Added full_name not empty check constraint';
  ELSE
    RAISE NOTICE 'Full name not empty check constraint already exists';
  END IF;
END
$$;

-- 7. Create function to handle duplicate email conflicts during migration
CREATE OR REPLACE FUNCTION resolve_duplicate_emails()
RETURNS void AS $$
DECLARE
  duplicate_record RECORD;
  counter INTEGER := 1;
BEGIN
  -- Find and resolve duplicate emails by appending numbers
  FOR duplicate_record IN 
    SELECT email, COUNT(*) as count
    FROM public.users 
    GROUP BY email 
    HAVING COUNT(*) > 1
  LOOP
    -- Update duplicate emails by appending incremental numbers
    UPDATE public.users 
    SET email = email || '.' || generate_random_uuid()::text
    WHERE email = duplicate_record.email 
    AND id NOT IN (
      SELECT id FROM public.users 
      WHERE email = duplicate_record.email 
      ORDER BY created_at ASC 
      LIMIT 1
    );
    
    RAISE NOTICE 'Resolved % duplicate emails for: %', duplicate_record.count - 1, duplicate_record.email;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 8. Run the duplicate resolution function
SELECT resolve_duplicate_emails();

-- 9. Drop the temporary function
DROP FUNCTION resolve_duplicate_emails();

-- 10. Verify constraints were created successfully
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
