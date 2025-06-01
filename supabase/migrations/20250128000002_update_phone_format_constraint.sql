-- Migration: Update Phone Format Constraint
-- Date: 2025-01-28
-- Description: Updates the phone format validation constraint to allow empty phone numbers
--              and phone numbers with 5-20 characters containing digits, spaces, hyphens, 
--              parentheses, and optional leading plus sign

-- 1. Drop existing phone format constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_schema = 'public' 
    AND constraint_name = 'users_phone_format_check'
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_phone_format_check;
    RAISE NOTICE 'Dropped existing phone format check constraint';
  ELSE
    RAISE NOTICE 'Phone format check constraint does not exist, skipping drop';
  END IF;
END
$$;

-- 2. Add updated phone format constraint
-- New constraint allows:
-- - Empty phone numbers (phone = '')
-- - Phone numbers with 5-20 characters containing digits, spaces, hyphens, parentheses, and optional leading plus sign
DO $$
BEGIN
  ALTER TABLE public.users 
  ADD CONSTRAINT users_phone_format_check
  CHECK (
    phone = '' OR phone ~ '^[+]?[0-9\s\-\(\)]{5,20}$'
  );
  RAISE NOTICE 'Added updated phone format check constraint allowing empty phone numbers';
END
$$;

-- 3. Verify the constraint was created successfully
SELECT 
  'Phone Format Constraint Verification' as check_type,
  constraint_name,
  constraint_type,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_schema = 'public' 
  AND constraint_name = 'users_phone_format_check';

-- 4. Test the constraint with sample data (optional verification)
DO $$
DECLARE
  test_cases text[] := ARRAY[
    '',                    -- Empty phone (should pass)
    '+1234567890',        -- Valid international format (should pass)
    '(555) 123-4567',     -- Valid US format with parentheses (should pass)
    '555-123-4567',       -- Valid US format with hyphens (should pass)
    '555 123 4567',       -- Valid format with spaces (should pass)
    '12345',              -- Minimum length (should pass)
    '12345678901234567890', -- Maximum length (should pass)
    '123456789012345678901', -- Too long (should fail)
    'abcd',               -- Invalid characters (should fail)
    '123'                 -- Too short (should fail)
  ];
  test_phone text;
  is_valid boolean;
BEGIN
  RAISE NOTICE 'Testing phone format constraint...';
  
  FOREACH test_phone IN ARRAY test_cases
  LOOP
    -- Test if the phone number matches the constraint
    SELECT (test_phone = '' OR test_phone ~ '^[+]?[0-9\s\-\(\)]{5,20}$') INTO is_valid;
    
    RAISE NOTICE 'Phone: "%" - Valid: %', test_phone, is_valid;
  END LOOP;
  
  RAISE NOTICE 'Phone format constraint testing completed';
END
$$;

-- 5. Add comment to document the constraint
COMMENT ON CONSTRAINT users_phone_format_check ON public.users IS 
'Validates phone number format: allows empty string or 5-20 characters containing digits, spaces, hyphens, parentheses, and optional leading plus sign';

-- Migration completed successfully
SELECT 'Phone format constraint migration completed successfully' as status;
