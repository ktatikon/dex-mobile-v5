-- =====================================================
-- Fix RLS Policy Infinite Recursion
-- Run this in Supabase SQL Editor to fix the policies
-- =====================================================

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admin users can read all admin records" ON admin_users;
DROP POLICY IF EXISTS "Admin users can insert admin records" ON admin_users;
DROP POLICY IF EXISTS "Admin users can update admin records" ON admin_users;
DROP POLICY IF EXISTS "Admin users can delete admin records" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage all admin records" ON admin_users;
DROP POLICY IF EXISTS "Users can read own admin record" ON admin_users;

-- Drop policies on other tables too
DROP POLICY IF EXISTS "Admin users can read all activity logs" ON admin_activity_logs;
DROP POLICY IF EXISTS "Admin users can insert activity logs" ON admin_activity_logs;
DROP POLICY IF EXISTS "Admin users can read all login history" ON user_login_history;
DROP POLICY IF EXISTS "Admin users can insert login history" ON user_login_history;
DROP POLICY IF EXISTS "Admin users can read all status changes" ON user_status_changes;
DROP POLICY IF EXISTS "Admin users can insert status changes" ON user_status_changes;

-- Create simple, non-recursive policies for admin_users table
-- Policy 1: Allow users to read their own admin record
CREATE POLICY "Users can read own admin record" ON admin_users
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: Allow authenticated users to read active admin records (for admin checks)
CREATE POLICY "Authenticated users can read active admin records" ON admin_users
  FOR SELECT
  USING (is_active = true AND auth.role() = 'authenticated');

-- Policy 3: Only allow inserts through the create_initial_admin function (SECURITY DEFINER)
-- This prevents direct inserts but allows the function to work
CREATE POLICY "Restrict direct admin inserts" ON admin_users
  FOR INSERT
  WITH CHECK (false); -- Block all direct inserts

-- Policy 4: Allow updates only by super admins or self-updates
CREATE POLICY "Admin users can update records" ON admin_users
  FOR UPDATE
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.role = 'super_admin' 
      AND au.is_active = true
    )
  );

-- Policy 5: Only super admins can delete admin records
CREATE POLICY "Super admins can delete admin records" ON admin_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.role = 'super_admin' 
      AND au.is_active = true
    )
  );

-- Create policies for admin_activity_logs
CREATE POLICY "Admin users can read activity logs" ON admin_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
    )
  );

CREATE POLICY "Admin users can insert activity logs" ON admin_activity_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
    )
  );

-- Create policies for user_login_history
CREATE POLICY "Admin users can read login history" ON user_login_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
    )
  );

CREATE POLICY "Admin users can insert login history" ON user_login_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
    )
  );

-- Create policies for user_status_changes
CREATE POLICY "Admin users can read status changes" ON user_status_changes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
    )
  );

CREATE POLICY "Admin users can insert status changes" ON user_status_changes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
    )
  );

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('admin_users', 'admin_activity_logs', 'user_login_history', 'user_status_changes')
ORDER BY tablename, cmd;
