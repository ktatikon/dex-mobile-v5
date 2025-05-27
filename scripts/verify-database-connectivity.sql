-- =====================================================
-- Database Connectivity Verification Script
-- Run this in Supabase SQL Editor to diagnose issues
-- =====================================================

-- 1. Check if users table exists and has correct structure
SELECT 
  'Users Table Structure' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Check if users table has RLS enabled
SELECT 
  'Users Table RLS Status' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- 3. Check users table RLS policies
SELECT 
  'Users Table Policies' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- 4. Check if KYC table exists and has correct structure
SELECT 
  'KYC Table Structure' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'kyc'
ORDER BY ordinal_position;

-- 5. Check KYC table RLS policies
SELECT 
  'KYC Table Policies' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'kyc';

-- 6. Check storage buckets
SELECT 
  'Storage Buckets' as check_type,
  id,
  name,
  public
FROM storage.buckets 
WHERE id IN ('kyc', 'avatars');

-- 7. Check storage policies
SELECT 
  'Storage Policies' as check_type,
  bucket_id,
  name,
  definition
FROM storage.policies 
WHERE bucket_id IN ('kyc', 'avatars');

-- 8. Test user data query (replace with actual user ID)
-- SELECT 
--   'User Data Test' as check_type,
--   id,
--   auth_id,
--   full_name,
--   email,
--   phone,
--   birthdate,
--   location,
--   bio,
--   website,
--   avatar_url,
--   status,
--   created_at
-- FROM public.users 
-- WHERE auth_id = 'YOUR_USER_ID_HERE';

-- 9. Check for any existing users
SELECT 
  'Existing Users Count' as check_type,
  COUNT(*) as total_users
FROM public.users;

-- 10. Check auth.users table
SELECT 
  'Auth Users Count' as check_type,
  COUNT(*) as total_auth_users
FROM auth.users;

-- 11. Check for orphaned auth users (users in auth.users but not in public.users)
SELECT 
  'Orphaned Auth Users' as check_type,
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_id
WHERE pu.auth_id IS NULL;

-- 12. Test RLS function
SELECT 
  'RLS Function Test' as check_type,
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 13. Check for any database errors or constraints
SELECT 
  'Table Constraints' as check_type,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('users', 'kyc')
ORDER BY tc.table_name, tc.constraint_type;
