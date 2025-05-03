import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  User,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  Info
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      {/* Profile Section */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white">Profile Settings</CardTitle>
          <CardDescription className="text-gray-400">
            Manage your account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="flex items-center justify-between p-2 rounded-lg hover:bg-dex-secondary/5 cursor-pointer transition-all duration-200"
            onClick={() => navigate('/profile-settings')}
          >
            <div className="flex items-center gap-3">
              <User className="text-dex-secondary" size={20} />
              <div>
                <p className="text-white font-medium">Profile Settings</p>
                <p className="text-sm text-gray-400">{user?.email || 'Not signed in'}</p>
              </div>
            </div>
            <ChevronRight className="text-dex-secondary" size={18} />
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-dex-secondary/5 cursor-pointer transition-all duration-200">
            <div className="flex items-center gap-3">
              <Bell className="text-dex-secondary" size={20} />
              <div>
                <p className="text-white font-medium">Notifications</p>
                <p className="text-sm text-gray-400">Manage notification preferences</p>
              </div>
            </div>
            <ChevronRight className="text-dex-secondary" size={18} />
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-dex-secondary/5 cursor-pointer transition-all duration-200">
            <div className="flex items-center gap-3">
              <Shield className="text-dex-secondary" size={20} />
              <div>
                <p className="text-white font-medium">Security</p>
                <p className="text-sm text-gray-400">Password and authentication</p>
              </div>
            </div>
            <ChevronRight className="text-dex-secondary" size={18} />
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white">Help & Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-dex-secondary/5 cursor-pointer transition-all duration-200">
            <div className="flex items-center gap-3">
              <HelpCircle className="text-dex-secondary" size={20} />
              <p className="text-white font-medium">FAQ</p>
            </div>
            <ChevronRight className="text-dex-secondary" size={18} />
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-dex-secondary/5 cursor-pointer transition-all duration-200">
            <div className="flex items-center gap-3">
              <Info className="text-dex-secondary" size={20} />
              <p className="text-white font-medium">About</p>
            </div>
            <ChevronRight className="text-dex-secondary" size={18} />
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
        <CardContent className="p-4">
          <Button
            variant="glossy"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
