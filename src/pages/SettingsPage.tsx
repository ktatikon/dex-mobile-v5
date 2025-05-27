import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useKYC } from '@/contexts/KYCContext';
import { useAdmin } from '@/contexts/AdminContext';
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
  Info,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wallet,
  MessageSquare
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import LanguageSelector from '@/components/LanguageSelector';
import { useTranslation } from 'react-i18next';

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { kycStatus } = useKYC();
  const { isAdmin, adminUser } = useAdmin();
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      <h1 className="text-2xl font-bold text-white mb-6">{t('settings.general', 'Settings')}</h1>

      {/* Portfolio Section */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white">Portfolio Settings</CardTitle>
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
                <p className="text-white font-medium">Portfolio Settings</p>
                <p className="text-sm text-gray-400">{user?.email || 'Not signed in'}</p>
              </div>
            </div>
            <ChevronRight className="text-dex-secondary" size={18} />
          </div>

          <div
            className="flex items-center justify-between p-2 rounded-lg hover:bg-dex-secondary/5 cursor-pointer transition-all duration-200"
            onClick={() => navigate('/notifications')}
          >
            <div className="flex items-center gap-3">
              <Bell className="text-dex-secondary" size={20} />
              <div>
                <p className="text-white font-medium">Notifications</p>
                <p className="text-sm text-gray-400">Manage notification preferences</p>
              </div>
            </div>
            <ChevronRight className="text-dex-secondary" size={18} />
          </div>

          <div
            className="flex items-center justify-between p-2 rounded-lg hover:bg-dex-secondary/5 cursor-pointer transition-all duration-200"
            onClick={() => navigate('/security')}
          >
            <div className="flex items-center gap-3">
              <Shield className="text-dex-secondary" size={20} />
              <div>
                <p className="text-white font-medium">Security</p>
                <p className="text-sm text-gray-400">Password and authentication</p>
              </div>
            </div>
            <ChevronRight className="text-dex-secondary" size={18} />
          </div>

          <div
            className="flex items-center justify-between p-2 rounded-lg hover:bg-dex-secondary/5 cursor-pointer transition-all duration-200"
            onClick={() => navigate('/wallet-settings')}
          >
            <div className="flex items-center gap-3">
              <Wallet className="text-dex-secondary" size={20} />
              <div>
                <p className="text-white font-medium">Wallet Settings</p>
                <p className="text-sm text-gray-400">Manage your crypto wallets and preferences</p>
              </div>
            </div>
            <ChevronRight className="text-dex-secondary" size={18} />
          </div>

          <div
            className="flex items-center justify-between p-2 rounded-lg hover:bg-dex-secondary/5 cursor-pointer transition-all duration-200"
            onClick={() => navigate('/kyc')}
          >
            <div className="flex items-center gap-3">
              <FileCheck className="text-dex-secondary" size={20} />
              <div>
                <p className="text-white font-medium">KYC Verification</p>
                <p className="text-sm text-gray-400">Verify your identity</p>
              </div>
            </div>
            <div className="flex items-center">
              {kycStatus === 'approved' ? (
                <Badge className="mr-2 bg-green-600 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              ) : kycStatus === 'pending' ? (
                <Badge className="mr-2 bg-yellow-600 text-white">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              ) : kycStatus === 'rejected' ? (
                <Badge className="mr-2 bg-dex-primary text-white">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Rejected
                </Badge>
              ) : (
                <Badge className="mr-2 bg-dex-secondary/20 text-white">
                  Required
                </Badge>
              )}
              <ChevronRight className="text-dex-secondary" size={18} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white">Help & Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="flex items-center justify-between p-2 rounded-lg hover:bg-dex-secondary/5 cursor-pointer transition-all duration-200"
            onClick={() => navigate('/live-chat')}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="text-dex-secondary" size={20} />
              <p className="text-white font-medium">Live Chat Support</p>
            </div>
            <ChevronRight className="text-dex-secondary" size={18} />
          </div>

          <div
            className="flex items-center justify-between p-2 rounded-lg hover:bg-dex-secondary/5 cursor-pointer transition-all duration-200"
            onClick={() => navigate('/faq')}
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="text-dex-secondary" size={20} />
              <p className="text-white font-medium">FAQ</p>
            </div>
            <ChevronRight className="text-dex-secondary" size={18} />
          </div>

          <div
            className="flex items-center justify-between p-2 rounded-lg hover:bg-dex-secondary/5 cursor-pointer transition-all duration-200"
            onClick={() => navigate('/about')}
          >
            <div className="flex items-center gap-3">
              <Info className="text-dex-secondary" size={20} />
              <p className="text-white font-medium">About</p>
            </div>
            <ChevronRight className="text-dex-secondary" size={18} />
          </div>
        </CardContent>
      </Card>

      {/* Admin Panel Access */}
      {isAdmin && (
        <Card className="bg-dex-dark/80 border-dex-primary/30 mb-6 shadow-lg shadow-dex-primary/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="text-dex-primary" size={20} />
              Admin Panel
            </CardTitle>
            <CardDescription className="text-gray-400">
              Administrative tools and system management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="flex items-center justify-between p-3 rounded-lg hover:bg-dex-secondary/5 cursor-pointer transition-all duration-200 border border-dex-primary/20"
              onClick={() => navigate('/admin')}
            >
              <div className="flex items-center gap-3">
                <Shield className="text-dex-primary" size={20} />
                <div>
                  <p className="text-white font-medium">Access Admin Dashboard</p>
                  <p className="text-sm text-gray-400">
                    Role: {adminUser?.role.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* App Preferences */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white">{t('settings.preferences', 'App Preferences')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-2">
            <LanguageSelector variant="dropdown" showLabel={true} />
          </div>
        </CardContent>
      </Card>

      {/* Legal & Compliance */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white">Legal & Compliance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="flex items-center justify-between p-2 rounded-lg hover:bg-dex-secondary/5 cursor-pointer transition-all duration-200"
            onClick={() => navigate('/privacy-policy')}
          >
            <div className="flex items-center gap-3">
              <Shield className="text-dex-secondary" size={20} />
              <p className="text-white font-medium">Privacy Policy</p>
            </div>
            <ChevronRight className="text-dex-secondary" size={18} />
          </div>

          <div
            className="flex items-center justify-between p-2 rounded-lg hover:bg-dex-secondary/5 cursor-pointer transition-all duration-200"
            onClick={() => navigate('/terms-of-service')}
          >
            <div className="flex items-center gap-3">
              <FileCheck className="text-dex-secondary" size={20} />
              <p className="text-white font-medium">Terms of Service</p>
            </div>
            <ChevronRight className="text-dex-secondary" size={18} />
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
        <CardContent className="p-4">
          <Button
            variant="primary"
            className="w-full flex items-center justify-center gap-3 py-3 px-4 h-auto min-h-[44px] rounded-lg text-white font-medium text-base"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
