import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AdminRole = 'super_admin' | 'user_manager' | 'transaction_manager' | 'report_viewer';

export interface AdminUser {
  id: string;
  user_id: string;
  role: AdminRole;
  permissions: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  last_login: string | null;
}

export interface AdminContextType {
  adminUser: AdminUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  hasPermission: (requiredRole: AdminRole) => boolean;
  logActivity: (action: string, targetType?: string, targetId?: string, details?: any) => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType>({} as AdminContextType);

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const roleHierarchy: Record<AdminRole, number> = {
    'super_admin': 4,
    'user_manager': 3,
    'transaction_manager': 2,
    'report_viewer': 1,
  };

  const hasPermission = (requiredRole: AdminRole): boolean => {
    if (!adminUser || !adminUser.is_active) return false;

    const userLevel = roleHierarchy[adminUser.role];
    const requiredLevel = roleHierarchy[requiredRole];

    return userLevel >= requiredLevel;
  };

  const logActivity = async (
    action: string,
    targetType?: string,
    targetId?: string,
    details?: any
  ): Promise<void> => {
    if (!adminUser) return;

    try {
      const { error } = await supabase.rpc('log_admin_activity', {
        p_admin_user_id: adminUser.id,
        p_action: action,
        p_target_type: targetType || null,
        p_target_id: targetId || null,
        p_details: details ? JSON.stringify(details) : null,
        p_ip_address: null, // Could be enhanced to get real IP
        p_user_agent: navigator.userAgent,
      });

      if (error) {
        console.error('Error logging admin activity:', error);
      }
    } catch (error) {
      console.error('Error logging admin activity:', error);
    }
  };

  const refreshAdminStatus = async (): Promise<void> => {
    console.log('🔄 AdminContext: Refreshing admin status...');

    if (!user) {
      console.log('❌ AdminContext: No user found');
      setAdminUser(null);
      setIsLoading(false);
      return;
    }

    console.log('👤 AdminContext: Checking admin status for user:', user.id, user.email);

    try {
      // First try the bypass function to avoid RLS issues
      const { data: bypassResult, error: bypassError } = await supabase
        .rpc('check_admin_status_bypass', {
          p_user_id: user.id
        });

      console.log('📊 AdminContext: Bypass function result:', { bypassResult, bypassError });

      if (bypassError) {
        console.warn('⚠️ AdminContext: Bypass function failed, trying direct query:', {
          message: bypassError.message,
          code: bypassError.code
        });

        // Fallback to direct query
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('❌ AdminContext: Error fetching admin user:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          setAdminUser(null);
        } else if (data) {
          console.log('✅ AdminContext: Admin user found via direct query:', data);
          setAdminUser(data);
        } else {
          console.log('❌ AdminContext: No admin user found');
          setAdminUser(null);
        }
      } else if (bypassResult?.success && bypassResult?.is_admin) {
        console.log('✅ AdminContext: Admin user found via bypass function:', bypassResult.admin_user);
        setAdminUser(bypassResult.admin_user);

        // Update last login using the safe function
        try {
          await supabase.rpc('update_admin_last_login', {
            p_user_id: user.id
          });
          console.log('✅ AdminContext: Last login updated');
        } catch (loginError) {
          console.warn('⚠️ AdminContext: Failed to update last login:', loginError);
        }
      } else {
        console.log('❌ AdminContext: User is not an admin');
        setAdminUser(null);
      }
    } catch (error) {
      console.error('💥 AdminContext: Unexpected error checking admin status:', error);
      setAdminUser(null);
    } finally {
      setIsLoading(false);
      console.log('🏁 AdminContext: Admin status refresh complete');
    }
  };

  useEffect(() => {
    refreshAdminStatus();
  }, [user]);

  const isAdmin = adminUser !== null && adminUser.is_active;

  return (
    <AdminContext.Provider
      value={{
        adminUser,
        isAdmin,
        isLoading,
        hasPermission,
        logActivity,
        refreshAdminStatus,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
