import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin, AdminRole } from '@/contexts/AdminContext';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdminTestnetRouteProps {
  children: React.ReactNode;
  requiredRole?: AdminRole;
}

/**
 * AdminTestnetRoute Component
 * 
 * Protects testnet functionality with admin-only access controls.
 * Provides user-friendly error messages and fallback mechanisms.
 * 
 * Features:
 * - Role-based access control for testnet features
 * - Loading states during admin verification
 * - Clear error messages for non-admin users
 * - Maintains established UI design patterns
 */
const AdminTestnetRoute: React.FC<AdminTestnetRouteProps> = ({ 
  children, 
  requiredRole = 'report_viewer' 
}) => {
  const { isAdmin, isLoading, hasPermission, adminUser } = useAdmin();
  const location = useLocation();

  // Loading state during admin verification
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dex-dark via-dex-primary/20 to-dex-secondary/20 px-4">
        <Loader2 className="h-12 w-12 animate-spin text-dex-primary mb-4" />
        <p className="text-white text-center">Verifying admin permissions for testnet access...</p>
      </div>
    );
  }

  // Non-admin user access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dex-dark via-dex-primary/20 to-dex-secondary/20 px-4">
        <Card className="max-w-md w-full bg-dex-dark/80 border-dex-secondary/30">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-dex-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Testnet Access Restricted</h1>
            <p className="text-gray-400 mb-4">
              Testnet functionality is restricted to administrators only. This includes:
            </p>
            <ul className="text-gray-400 text-sm mb-6 space-y-1 text-left">
              <li>• Testnet wallet creation and management</li>
              <li>• Sepolia, Ganache, and Solana Devnet access</li>
              <li>• Test token requests and transactions</li>
              <li>• Development and testing features</li>
            </ul>
            <p className="text-gray-400 text-sm mb-6">
              All mainnet features remain fully accessible. Contact your administrator for testnet access.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="flex-1 border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
              >
                Go Back
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-dex-primary text-white hover:bg-dex-primary/80"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin user with insufficient permissions
  if (!hasPermission(requiredRole)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dex-dark via-dex-primary/20 to-dex-secondary/20 px-4">
        <Card className="max-w-md w-full bg-dex-dark/80 border-dex-secondary/30">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Insufficient Permissions</h1>
            <p className="text-gray-400 mb-4">
              Your admin role ({adminUser?.role.replace('_', ' ')}) does not have sufficient permissions 
              to access testnet functionality.
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Required permission level: {requiredRole.replace('_', ' ')}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="flex-1 border-dex-secondary/30 text-white hover:bg-dex-secondary/20"
              >
                Go Back
              </Button>
              <Button
                onClick={() => window.location.href = '/admin'}
                className="flex-1 bg-dex-primary text-white hover:bg-dex-primary/80"
              >
                Admin Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin user with sufficient permissions - render protected content
  return <>{children}</>;
};

export default AdminTestnetRoute;
