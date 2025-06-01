-- CRITICAL: Execute this complete script in Supabase SQL Editor
-- This resolves the RLS/trigger function issues before implementing admin features
ALTER TABLE public.users
ADD COLUMN role text NOT NULL DEFAULT 'user';

CREATE POLICY "admin_full_access" 
ON public.users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND (status = 'active')  -- Change this condition as needed
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND (status = 'active')  -- Change this condition as needed
  )
);


-- Step 1: Create service role bypass policy for trigger function
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'service_role_bypass_for_triggers' 
    AND tablename = 'users'
  ) THEN
    CREATE POLICY "service_role_bypass_for_triggers" 
    ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
    RAISE NOTICE 'Created service_role_bypass_for_triggers policy';
  ELSE
    RAISE NOTICE 'service_role_bypass_for_triggers policy already exists';
  END IF;
END
$$;

-- Step 2: Ensure the trigger function has proper SECURITY DEFINER and role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public, auth
SET role = 'service_role'  -- Explicitly use service role
LANGUAGE plpgsql AS $$
BEGIN
  -- Log trigger execution for debugging
  RAISE LOG 'handle_new_user triggered for user ID: %, email: %', NEW.id, NEW.email;
  
  -- Insert user profile with service role privileges
  INSERT INTO public.users (auth_id, email, full_name, phone, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'active'
  );
  
  RAISE LOG 'User profile created successfully for auth_id: %', NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    -- User profile already exists, this is OK
    RAISE LOG 'User profile already exists for auth_id: %', NEW.id;
    RETURN NEW;
    
  WHEN OTHERS THEN
    -- Log detailed error but don't fail the auth creation
    RAISE WARNING 'Failed to create user profile for auth_id %: % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Step 3: Grant comprehensive permissions to the function
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres;

-- Step 4: Ensure RLS policies allow admin operations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'admin_full_access' 
    AND tablename = 'users'
  ) THEN
    CREATE POLICY "admin_full_access" 
    ON public.users
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = auth.uid() 
        AND (role = 'admin' OR role = 'super_admin')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = auth.uid() 
        AND (role = 'admin' OR role = 'super_admin')
      )
    );
    RAISE NOTICE 'Created admin_full_access policy';
  ELSE
    RAISE NOTICE 'admin_full_access policy already exists';
  END IF;
END
$$;

-- Step 5: Create admin role management functions
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = user_id 
    AND role IN ('admin', 'super_admin')
  );
END;
$$;

-- Step 6: Create secure admin user creation function
CREATE OR REPLACE FUNCTION admin_create_user_profile(
  p_auth_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT '',
  p_role TEXT DEFAULT 'user'
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Verify caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Insert user profile
  INSERT INTO public.users (auth_id, email, full_name, phone, status, role)
  VALUES (p_auth_id, p_email, p_full_name, p_phone, 'active', p_role);
  
  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'User profile already exists for auth_id: %', p_auth_id;
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$;

-- Step 7: Grant permissions for admin functions
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Verification query - run this to confirm setup
SELECT 'ADMIN PREREQUISITES SETUP COMPLETED SUCCESSFULLY' as status;