import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin, AdminRole } from '@/contexts/AdminContext';
import { Loader2, Shield } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: AdminRole;
}

const AdminRoute = ({ children, requiredRole = 'report_viewer' }: AdminRouteProps) => {
  const { isAdmin, isLoading, hasPermission } = useAdmin();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dex-dark via-dex-primary/20 to-dex-secondary/20">
        <Loader2 className="h-12 w-12 animate-spin text-dex-primary" />
        <p className="mt-4 text-white">Checking admin permissions...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dex-dark via-dex-primary/20 to-dex-secondary/20 px-4">
        <Shield className="h-16 w-16 text-dex-primary mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-gray-400 text-center mb-6">
          You don't have permission to access the admin panel.
        </p>
        <button
          onClick={() => window.history.back()}
          className="bg-dex-primary text-white px-6 py-3 rounded-lg hover:bg-dex-primary/80 transition-colors min-h-[44px]"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!hasPermission(requiredRole)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dex-dark via-dex-primary/20 to-dex-secondary/20 px-4">
        <Shield className="h-16 w-16 text-dex-primary mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Insufficient Permissions</h1>
        <p className="text-gray-400 text-center mb-6">
          You need {requiredRole.replace('_', ' ')} permissions to access this page.
        </p>
        <button
          onClick={() => window.history.back()}
          className="bg-dex-primary text-white px-6 py-3 rounded-lg hover:bg-dex-primary/80 transition-colors min-h-[44px]"
        >
          Go Back
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
