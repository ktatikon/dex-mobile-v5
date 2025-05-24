-- Setup script for creating the first admin user
-- Replace 'YOUR_USER_EMAIL' with the actual email of the user you want to make admin

-- First, find the user ID by email
-- You can run this query to find the user ID:
-- SELECT id, email, full_name FROM auth.users WHERE email = 'YOUR_USER_EMAIL';

-- Then replace 'YOUR_USER_ID' with the actual user ID and run this:
-- INSERT INTO public.admin_users (user_id, role, created_by, permissions)
-- VALUES ('YOUR_USER_ID', 'super_admin', 'YOUR_USER_ID', '{"all": true}');

-- Example usage:
-- 1. Find user ID:
--    SELECT id, email, full_name FROM auth.users WHERE email = 'admin@example.com';
-- 
-- 2. Create admin user (replace the UUID with the actual user ID):
--    INSERT INTO public.admin_users (user_id, role, created_by, permissions)
--    VALUES ('12345678-1234-1234-1234-123456789012', 'super_admin', '12345678-1234-1234-1234-123456789012', '{"all": true}');

-- Verify the admin user was created:
-- SELECT au.*, u.email, u.full_name 
-- FROM public.admin_users au 
-- JOIN auth.users u ON au.user_id = u.id;

-- To check admin permissions:
-- SELECT public.check_admin_permission('YOUR_USER_ID', 'super_admin');
