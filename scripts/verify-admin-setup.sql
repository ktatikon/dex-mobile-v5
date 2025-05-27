-- =====================================================
-- Admin System Verification Script
-- Run this in Supabase SQL Editor to verify setup
-- =====================================================

-- 1. Check if admin tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('admin_users', 'admin_activity_logs', 'user_login_history', 'user_status_changes')
ORDER BY table_name;

-- 2. Check admin_users table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'admin_users'
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled on admin tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('admin_users', 'admin_activity_logs', 'user_login_history', 'user_status_changes');

-- 4. Check RLS policies on admin_users table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'admin_users';

-- 5. Check if admin functions exist
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('check_admin_permission', 'log_admin_activity', 'create_admin_user')
ORDER BY routine_name;

-- 6. Check current user's auth record
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 't.krishnadeepak@gmail.com';

-- 7. Check if there are any admin users
SELECT 
  id,
  user_id,
  role,
  is_active,
  permissions,
  created_at,
  last_login
FROM admin_users;

-- 8. Test admin permission function (if it exists)
-- This will fail if the function doesn't exist or user is not admin
-- SELECT check_admin_permission(
--   (SELECT id FROM auth.users WHERE email = 't.krishnadeepak@gmail.com'),
--   'super_admin'
-- );

-- 9. Check if we can insert into admin_users (should fail due to RLS)
-- DO NOT RUN THIS - it's just for reference
-- INSERT INTO admin_users (user_id, role, permissions, created_by, is_active)
-- VALUES (
--   (SELECT id FROM auth.users WHERE email = 't.krishnadeepak@gmail.com'),
--   'super_admin',
--   '{"all": true}',
--   (SELECT id FROM auth.users WHERE email = 't.krishnadeepak@gmail.com'),
--   true
-- );

-- 10. Manual admin user creation (run this if needed)
-- Replace the email with your actual email
/*
INSERT INTO admin_users (user_id, role, permissions, created_by, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 't.krishnadeepak@gmail.com'),
  'super_admin',
  '{"all": true}',
  (SELECT id FROM auth.users WHERE email = 't.krishnadeepak@gmail.com'),
  true
);
*/
