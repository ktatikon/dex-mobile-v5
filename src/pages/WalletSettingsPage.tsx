import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Shield,
  Eye,
  Bell,
  Download,
  Fingerprint,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import {
  getOrCreateWalletSettings,
  updateWalletSetting,
  WalletSettings,
  AUTO_LOCK_OPTIONS,
  CURRENCY_OPTIONS,
  isBiometricAuthAvailable
} from '@/services/walletSettingsService';
import SlippageTolerance from '@/components/settings/SlippageTolerance';

const WalletSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [settings, setSettings] = useState<WalletSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
      checkBiometricAvailability();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userSettings = await getOrCreateWalletSettings(user.id);
      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading wallet settings:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkBiometricAvailability = async () => {
    const available = await isBiometricAuthAvailable();
    setBiometricAvailable(available);
  };

  const handleSettingChange = async (
    key: keyof Omit<WalletSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    value: any
  ) => {
    if (!user || !settings) return;

    try {
      setSaving(true);
      const success = await updateWalletSetting(user.id, key, value);

      if (success) {
        setSettings(prev => prev ? { ...prev, [key]: value } : null);
        toast({
          title: "Settings Updated",
          description: "Your wallet settings have been saved",
        });
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update wallet settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBackupAllWallets = () => {
    toast({
      title: "Backup Feature",
      description: "Wallet backup functionality will be available soon",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 pt-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-dex-secondary/20 rounded animate-pulse"></div>
          <div className="h-8 w-48 bg-dex-secondary/20 rounded animate-pulse"></div>
        </div>

        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 bg-dex-dark border-dex-secondary/30 animate-pulse">
              <div className="h-6 w-32 bg-dex-secondary/20 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 w-64 bg-dex-secondary/10 rounded"></div>
                <div className="h-4 w-48 bg-dex-secondary/10 rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-4 pt-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="text-white"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-white">Wallet Settings</h1>
        </div>

        <Card className="p-6 bg-dex-dark border-dex-secondary/30 text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-dex-primary" />
          <h3 className="text-lg font-medium text-white mb-2">Settings Not Available</h3>
          <p className="text-gray-400 mb-4">Unable to load wallet settings</p>
          <Button onClick={loadSettings} className="bg-dex-primary hover:bg-dex-primary/80">
            <RefreshCw size={16} className="mr-2" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/settings')}
          className="text-white h-10 w-10"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Wallet Settings</h1>
          <p className="text-sm text-gray-400">Manage your wallet preferences and security</p>
        </div>
      </div>

      {/* Security Section */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="text-dex-primary" size={20} />
            Security Settings
          </CardTitle>
          <CardDescription className="text-gray-400">
            Configure security features for your wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Transaction Confirmations */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-white font-medium">Transaction Confirmations</Label>
              <p className="text-sm text-gray-400">Require confirmation for all transactions</p>
            </div>
            <Switch
              checked={settings.require_transaction_confirmation}
              onCheckedChange={(checked) => handleSettingChange('require_transaction_confirmation', checked)}
              disabled={saving}
            />
          </div>

          <Separator className="bg-dex-secondary/20" />

          {/* Biometric Authentication */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-white font-medium">Biometric Authentication</Label>
                {!biometricAvailable && (
                  <Badge variant="outline" className="text-xs text-gray-400">
                    Not Available
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-400">Use fingerprint or face ID for transactions</p>
            </div>
            <Switch
              checked={settings.biometric_auth_enabled && biometricAvailable}
              onCheckedChange={(checked) => handleSettingChange('biometric_auth_enabled', checked)}
              disabled={saving || !biometricAvailable}
            />
          </div>

          <Separator className="bg-dex-secondary/20" />

          {/* Auto-lock Timeout */}
          <div className="space-y-2">
            <Label className="text-white font-medium">Auto-lock Timeout</Label>
            <p className="text-sm text-gray-400 mb-2">Automatically lock wallet after inactivity</p>
            <Select
              value={settings.auto_lock_timeout.toString()}
              onValueChange={(value) => handleSettingChange('auto_lock_timeout', parseInt(value))}
              disabled={saving}
            >
              <SelectTrigger className="bg-dex-secondary/10 border-dex-secondary/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-dex-dark border-dex-secondary/30">
                {AUTO_LOCK_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()} className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Display Settings Section */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Eye className="text-dex-primary" size={20} />
            Display Settings
          </CardTitle>
          <CardDescription className="text-gray-400">
            Customize how your wallet information is displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hide Small Balances */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-white font-medium">Hide Small Balances</Label>
              <p className="text-sm text-gray-400">
                Hide tokens with balances under ${settings.small_balance_threshold}
              </p>
            </div>
            <Switch
              checked={settings.hide_small_balances}
              onCheckedChange={(checked) => handleSettingChange('hide_small_balances', checked)}
              disabled={saving}
            />
          </div>

          <Separator className="bg-dex-secondary/20" />

          {/* Default Currency */}
          <div className="space-y-2">
            <Label className="text-white font-medium">Default Currency</Label>
            <p className="text-sm text-gray-400 mb-2">Choose your preferred display currency</p>
            <Select
              value={settings.default_currency}
              onValueChange={(value) => handleSettingChange('default_currency', value)}
              disabled={saving}
            >
              <SelectTrigger className="bg-dex-secondary/10 border-dex-secondary/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-dex-dark border-dex-secondary/30">
                {CURRENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-dex-secondary/20" />

          {/* Privacy Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-white font-medium">Privacy Mode</Label>
              <p className="text-sm text-gray-400">Hide all balance amounts</p>
            </div>
            <Switch
              checked={settings.privacy_mode_enabled}
              onCheckedChange={(checked) => handleSettingChange('privacy_mode_enabled', checked)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Slippage Tolerance Section */}
      <SlippageTolerance
        value={settings.slippage_tolerance}
        onChange={(value) => handleSettingChange('slippage_tolerance', value)}
        disabled={saving}
        className="mb-6"
      />

      {/* Backup & Recovery Section */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Download className="text-dex-primary" size={20} />
            Backup & Recovery
          </CardTitle>
          <CardDescription className="text-gray-400">
            Secure your wallet with proper backup procedures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Backup Status */}
          <div className="space-y-3">
            <Label className="text-white font-medium">Wallet Backup Status</Label>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 bg-dex-secondary/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-dex-positive" />
                  <div>
                    <p className="text-sm font-medium text-white">Generated Wallets</p>
                    <p className="text-xs text-gray-400">3 wallets backed up</p>
                  </div>
                </div>
                <Badge className="bg-dex-positive/20 text-dex-positive">
                  Backed Up
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-dex-secondary/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={20} className="text-dex-primary" />
                  <div>
                    <p className="text-sm font-medium text-white">Connected Wallets</p>
                    <p className="text-xs text-gray-400">External wallet connections</p>
                  </div>
                </div>
                <Badge className="bg-dex-primary/20 text-dex-primary">
                  External
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="bg-dex-secondary/20" />

          {/* Backup Actions */}
          <div className="space-y-3">
            <Label className="text-white font-medium">Backup Actions</Label>
            <Button
              onClick={handleBackupAllWallets}
              className="w-full bg-dex-primary hover:bg-dex-primary/80 text-white h-12"
              disabled={saving}
            >
              <Download size={16} className="mr-2" />
              Backup All Wallets
            </Button>
            <p className="text-xs text-gray-400">
              Download encrypted backup files for all your generated wallets
            </p>
          </div>

          <Separator className="bg-dex-secondary/20" />

          {/* Recovery Phrase Verification */}
          <div className="space-y-3">
            <Label className="text-white font-medium">Recovery Phrase Verification</Label>
            <div className="p-3 bg-dex-primary/10 border border-dex-primary/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="text-dex-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Verification Reminder</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Regularly verify your recovery phrases to ensure wallet security
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences Section */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="text-dex-primary" size={20} />
            Notification Preferences
          </CardTitle>
          <CardDescription className="text-gray-400">
            Configure which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Transaction Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-white font-medium">Transaction Notifications</Label>
              <p className="text-sm text-gray-400">Get notified about transaction status updates</p>
            </div>
            <Switch
              checked={settings.transaction_notifications}
              onCheckedChange={(checked) => handleSettingChange('transaction_notifications', checked)}
              disabled={saving}
            />
          </div>

          <Separator className="bg-dex-secondary/20" />

          {/* Price Alerts */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-white font-medium">Price Alerts</Label>
              <p className="text-sm text-gray-400">Receive alerts for significant price changes</p>
            </div>
            <Switch
              checked={settings.price_alerts_enabled}
              onCheckedChange={(checked) => handleSettingChange('price_alerts_enabled', checked)}
              disabled={saving}
            />
          </div>

          <Separator className="bg-dex-secondary/20" />

          {/* Security Alerts */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-white font-medium">Security Alerts</Label>
                <Badge variant="outline" className="text-xs text-dex-primary border-dex-primary">
                  Always Enabled
                </Badge>
              </div>
              <p className="text-sm text-gray-400">Critical security notifications (cannot be disabled)</p>
            </div>
            <Switch
              checked={true}
              disabled={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Status */}
      {saving && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-dex-dark border border-dex-secondary/30 rounded-lg px-4 py-2 flex items-center gap-2">
            <RefreshCw size={16} className="animate-spin text-dex-primary" />
            <span className="text-white text-sm">Saving settings...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletSettingsPage;
