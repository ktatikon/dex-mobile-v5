-- =====================================================
-- Create Admin Bypass Function for Testing
-- This function can bypass RLS to check admin status
-- =====================================================

-- Create a function to check admin status bypassing RLS
CREATE OR REPLACE FUNCTION check_admin_status_bypass(
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
DECLARE
  v_admin_user admin_users;
  v_result JSON;
BEGIN
  -- Get admin user record (bypasses RLS due to SECURITY DEFINER)
  SELECT * INTO v_admin_user
  FROM admin_users
  WHERE user_id = p_user_id
    AND is_active = true;

  IF v_admin_user.id IS NOT NULL THEN
    RETURN json_build_object(
      'success', true,
      'is_admin', true,
      'admin_user', row_to_json(v_admin_user)
    );
  ELSE
    RETURN json_build_object(
      'success', true,
      'is_admin', false,
      'admin_user', null
    );
  END IF;

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
GRANT EXECUTE ON FUNCTION check_admin_status_bypass(UUID) TO authenticated;

-- Create a function to get admin user safely
CREATE OR REPLACE FUNCTION get_admin_user_safe(
  p_user_id UUID
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  role TEXT,
  permissions JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.user_id,
    au.role,
    au.permissions,
    au.is_active,
    au.created_at,
    au.updated_at,
    au.last_login
  FROM admin_users au
  WHERE au.user_id = p_user_id
    AND au.is_active = true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_admin_user_safe(UUID) TO authenticated;

-- Test the functions with your user
SELECT check_admin_status_bypass(
  (SELECT id FROM auth.users WHERE email = 't.krishnadeepak@gmail.com')
);

SELECT * FROM get_admin_user_safe(
  (SELECT id FROM auth.users WHERE email = 't.krishnadeepak@gmail.com')
);
