import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Settings,
  LogOut,
  Shield,
  Home,
  Menu
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminHeaderProps {
  title?: string;
  showBackButton?: boolean;
  backPath?: string;
}

const AdminHeader = ({ 
  title = "Admin Panel", 
  showBackButton = false, 
  backPath = "/admin" 
}: AdminHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminUser, logActivity } = useAdmin();
  const { signOut } = useAuth();

  const handleBack = () => {
    navigate(backPath);
  };

  const handleGoHome = async () => {
    await logActivity('navigation_home');
    navigate('/');
  };

  const handleGoToDashboard = async () => {
    await logActivity('navigation_dashboard');
    navigate('/admin');
  };

  const handleLogout = async () => {
    await logActivity('admin_logout');
    await signOut();
    navigate('/auth');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-500/20 text-red-400';
      case 'user_manager':
        return 'bg-blue-500/20 text-blue-400';
      case 'transaction_manager':
        return 'bg-green-500/20 text-green-400';
      case 'report_viewer':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-dex-primary/20 text-dex-primary';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-dex-secondary/30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-white hover:bg-dex-secondary/20 min-h-[44px] min-w-[44px] p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-dex-primary" />
            <h1 className="text-lg font-semibold text-white">{title}</h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Admin role badge */}
          {adminUser && (
            <Badge 
              variant="secondary" 
              className={`hidden sm:inline-flex ${getRoleColor(adminUser.role)}`}
            >
              {adminUser.role.replace('_', ' ').toUpperCase()}
            </Badge>
          )}

          {/* Admin menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-dex-secondary/20 min-h-[44px] min-w-[44px] p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-dex-dark border-dex-secondary/30"
            >
              {/* Admin info */}
              <div className="px-3 py-2 border-b border-dex-secondary/30">
                <p className="text-sm font-medium text-white">Admin Panel</p>
                {adminUser && (
                  <p className="text-xs text-gray-400">
                    {adminUser.role.replace('_', ' ')}
                  </p>
                )}
              </div>

              {/* Navigation items */}
              <DropdownMenuItem 
                onClick={handleGoToDashboard}
                className="text-white hover:bg-dex-secondary/20 cursor-pointer"
              >
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin Dashboard</span>
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={handleGoHome}
                className="text-white hover:bg-dex-secondary/20 cursor-pointer"
              >
                <Home className="mr-2 h-4 w-4" />
                <span>Main App</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-dex-secondary/30" />

              {/* Admin settings (super admin only) */}
              {adminUser?.role === 'super_admin' && (
                <DropdownMenuItem 
                  onClick={() => navigate('/admin/settings')}
                  className="text-white hover:bg-dex-secondary/20 cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Admin Settings</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="bg-dex-secondary/30" />

              {/* Logout */}
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-dex-negative hover:bg-dex-negative/20 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
