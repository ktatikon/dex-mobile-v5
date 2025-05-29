-- Check if you exist as admin user
SELECT au.*, u.email 
FROM admin_users au 
JOIN auth.users u ON au.user_id = u.id 
WHERE u.email = 't.krishnadeepak@gmail.com';

-- Create admin user if missing
INSERT INTO admin_users (user_id, role, created_by, permissions, is_active)
SELECT id, 'super_admin', id, '{"all": true}', true
FROM auth.users 
WHERE email = 't.krishnadeepak@gmail.com'
ON CONFLICT (user_id) DO NOTHING;