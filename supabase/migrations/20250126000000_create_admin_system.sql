-- Create admin_users table
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

-- Create admin_activity_logs table
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT, -- 'user', 'transaction', 'kyc', etc.
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_login_history table
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

-- Create user_status_changes table
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

-- Add status column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'banned'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS admin_users_role_idx ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS admin_users_is_active_idx ON public.admin_users(is_active);
CREATE INDEX IF NOT EXISTS admin_activity_logs_admin_user_id_idx ON public.admin_activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS admin_activity_logs_created_at_idx ON public.admin_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS user_login_history_user_id_idx ON public.user_login_history(user_id);
CREATE INDEX IF NOT EXISTS user_login_history_login_time_idx ON public.user_login_history(login_time);
CREATE INDEX IF NOT EXISTS user_status_changes_user_id_idx ON public.user_status_changes(user_id);
CREATE INDEX IF NOT EXISTS users_status_idx ON public.users(status);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_status_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users
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

CREATE POLICY "Admins can view their own profile"
  ON public.admin_users
  FOR SELECT
  USING (auth.uid() = user_id);

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

-- RLS Policies for admin_activity_logs
CREATE POLICY "Admins can view activity logs"
  ON public.admin_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Admins can insert activity logs"
  ON public.admin_activity_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- RLS Policies for user_login_history
CREATE POLICY "Admins can view user login history"
  ON public.user_login_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "System can insert login history"
  ON public.user_login_history
  FOR INSERT
  WITH CHECK (true); -- Allow system to insert login records

-- RLS Policies for user_status_changes
CREATE POLICY "Admins can view user status changes"
  ON public.user_status_changes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "User managers can insert status changes"
  ON public.user_status_changes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'user_manager')
      AND is_active = true
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for admin_users updated_at
CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_admin_updated_at();

-- Create function to log admin activities
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

-- Create function to check admin permissions
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

  -- Role hierarchy: super_admin > user_manager > transaction_manager > report_viewer
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

-- Insert default super admin (replace with actual admin user ID)
-- This should be run manually with the actual admin user ID
-- INSERT INTO public.admin_users (user_id, role, created_by, permissions)
-- VALUES ('YOUR_ADMIN_USER_ID', 'super_admin', 'YOUR_ADMIN_USER_ID', '{"all": true}');
