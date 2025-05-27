-- Manual Admin System Setup for DEX Mobile V5
-- Run this script in your Supabase SQL Editor

-- Step 1: Create admin tables (if they don't exist)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'report_viewer' CHECK (role IN ('super_admin', 'user_manager', 'transaction_manager', 'report_viewer')),
  permissions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  last_login TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  location_info JSONB,
  success BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.user_status_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id),
  old_status TEXT,
  new_status TEXT NOT NULL CHECK (new_status IN ('active', 'inactive', 'suspended', 'banned')),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 2: Add status column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'banned'));

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS admin_users_role_idx ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS admin_users_is_active_idx ON public.admin_users(is_active);
CREATE INDEX IF NOT EXISTS admin_activity_logs_admin_user_id_idx ON public.admin_activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS admin_activity_logs_created_at_idx ON public.admin_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS user_login_history_user_id_idx ON public.user_login_history(user_id);
CREATE INDEX IF NOT EXISTS user_login_history_login_time_idx ON public.user_login_history(login_time);
CREATE INDEX IF NOT EXISTS user_status_changes_user_id_idx ON public.user_status_changes(user_id);
CREATE INDEX IF NOT EXISTS users_status_idx ON public.users(status);

-- Step 4: Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_status_changes ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
DROP POLICY IF EXISTS "Super admins can view all admin users" ON public.admin_users;
CREATE POLICY "Super admins can view all admin users"
  ON public.admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin' 
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can view their own profile" ON public.admin_users;
CREATE POLICY "Admins can view their own profile"
  ON public.admin_users
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Super admins can insert admin users" ON public.admin_users;
CREATE POLICY "Super admins can insert admin users"
  ON public.admin_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin' 
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Super admins can update admin users" ON public.admin_users;
CREATE POLICY "Super admins can update admin users"
  ON public.admin_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin' 
      AND is_active = true
    )
  );

-- Step 6: Create utility functions
CREATE OR REPLACE FUNCTION public.update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_admin_updated_at();

CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_admin_user_id UUID,
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.admin_activity_logs (
    admin_user_id,
    action,
    target_type,
    target_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_user_id,
    p_action,
    p_target_type,
    p_target_id,
    p_details,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_admin_permission(
  p_user_id UUID,
  p_required_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  is_active BOOLEAN;
BEGIN
  SELECT role, is_active INTO user_role, is_active
  FROM public.admin_users
  WHERE user_id = p_user_id;
  
  IF NOT FOUND OR NOT is_active THEN
    RETURN FALSE;
  END IF;
  
  CASE p_required_role
    WHEN 'super_admin' THEN
      RETURN user_role = 'super_admin';
    WHEN 'user_manager' THEN
      RETURN user_role IN ('super_admin', 'user_manager');
    WHEN 'transaction_manager' THEN
      RETURN user_role IN ('super_admin', 'user_manager', 'transaction_manager');
    WHEN 'report_viewer' THEN
      RETURN user_role IN ('super_admin', 'user_manager', 'transaction_manager', 'report_viewer');
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create admin user for t.krishnadeepak@gmail.com
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find the user ID
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = 't.krishnadeepak@gmail.com';
  
  IF target_user_id IS NOT NULL THEN
    -- Insert or update admin user
    INSERT INTO public.admin_users (user_id, role, created_by, permissions, is_active)
    VALUES (target_user_id, 'super_admin', target_user_id, '{"all": true}', true)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role = 'super_admin',
      permissions = '{"all": true}',
      is_active = true,
      updated_at = now();
    
    RAISE NOTICE 'Admin user created/updated for user ID: %', target_user_id;
  ELSE
    RAISE NOTICE 'User with email t.krishnadeepak@gmail.com not found';
  END IF;
END $$;

-- Step 8: Verification queries
SELECT 'Admin Tables Check' as check_type, 
       COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admin_users', 'admin_activity_logs', 'user_login_history', 'user_status_changes');

SELECT 'Admin User Check' as check_type,
       au.id,
       au.user_id,
       au.role,
       au.is_active,
       u.email
FROM public.admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE u.email = 't.krishnadeepak@gmail.com';

SELECT 'Permission Function Check' as check_type,
       public.check_admin_permission(
         (SELECT id FROM auth.users WHERE email = 't.krishnadeepak@gmail.com'),
         'super_admin'
       ) as has_permission;
