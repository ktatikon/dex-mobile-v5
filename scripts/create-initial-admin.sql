-- =====================================================
-- Create Initial Admin User (Bypass RLS)
-- Run this in Supabase SQL Editor as a one-time setup
-- =====================================================

-- Create a function that can bypass RLS to create the initial admin
CREATE OR REPLACE FUNCTION create_initial_admin(
  p_email TEXT,
  p_role TEXT DEFAULT 'super_admin'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
DECLARE
  v_user_id UUID;
  v_admin_user admin_users;
  v_result JSON;
BEGIN
  -- Find the user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  -- Check if user exists
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found with email: ' || p_email
    );
  END IF;

  -- Check if admin user already exists
  SELECT * INTO v_admin_user
  FROM admin_users
  WHERE user_id = v_user_id;

  IF v_admin_user.id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Admin user already exists',
      'admin_user', row_to_json(v_admin_user)
    );
  END IF;

  -- Create the admin user (this bypasses RLS due to SECURITY DEFINER)
  INSERT INTO admin_users (
    user_id,
    role,
    permissions,
    created_by,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    p_role,
    '{"all": true}'::jsonb,
    v_user_id,
    true,
    NOW(),
    NOW()
  )
  RETURNING * INTO v_admin_user;

  -- Log the creation
  INSERT INTO admin_activity_logs (
    admin_user_id,
    action,
    target_type,
    target_id,
    details,
    ip_address,
    user_agent,
    created_at
  )
  VALUES (
    v_admin_user.id,
    'admin_user_created',
    'admin_users',
    v_admin_user.id::text,
    json_build_object(
      'role', p_role,
      'created_by_function', 'create_initial_admin'
    ),
    '127.0.0.1',
    'Supabase SQL Function',
    NOW()
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Admin user created successfully',
    'admin_user', row_to_json(v_admin_user)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_initial_admin(TEXT, TEXT) TO authenticated;

-- Now create the initial admin user
-- Replace 't.krishnadeepak@gmail.com' with your actual email
SELECT create_initial_admin('t.krishnadeepak@gmail.com', 'super_admin');

-- Verify the admin user was created
SELECT 
  id,
  user_id,
  role,
  is_active,
  permissions,
  created_at
FROM admin_users
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 't.krishnadeepak@gmail.com'
);
