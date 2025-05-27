import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettings {
  price_alerts: boolean;
  trade_confirmations: boolean;
  security_alerts: boolean;
  market_updates: boolean;
  promotional_emails: boolean;
}

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<NotificationSettings>({
    price_alerts: true,
    trade_confirmations: true,
    security_alerts: true,
    market_updates: false,
    promotional_emails: false
  });

  useEffect(() => {
    const fetchNotificationSettings = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Check if user has notification settings
        const { data, error } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error fetching notification settings:', error);
          return;
        }

        // If settings exist, update state
        if (data) {
          setSettings({
            price_alerts: data.price_alerts,
            trade_confirmations: data.trade_confirmations,
            security_alerts: data.security_alerts,
            market_updates: data.market_updates,
            promotional_emails: data.promotional_emails
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotificationSettings();
  }, [user]);

  const handleToggle = (setting: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Check if settings already exist
      const { data, error: checkError } = await supabase
        .from('notification_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (data) {
        // Update existing settings
        const { error } = await supabase
          .from('notification_settings')
          .update(settings)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from('notification_settings')
          .insert({
            user_id: user.id,
            ...settings
          });

        if (error) throw error;
      }

      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated.",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => navigate('/settings')}
          aria-label="Back to Settings"
        >
          <ArrowLeft className="text-white" size={26} />
        </Button>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      ) : (
        <>
          <Card className="bg-black border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
            <CardHeader>
              <CardTitle className="text-white text-xl">Notification Preferences</CardTitle>
              <CardDescription className="text-dex-text-secondary text-base">
                Choose which notifications you'd like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white text-base font-medium">Price Alerts</Label>
                  <p className="text-dex-text-secondary text-sm">Get notified about significant price changes</p>
                </div>
                <Switch 
                  checked={settings.price_alerts} 
                  onCheckedChange={() => handleToggle('price_alerts')}
                  className="data-[state=checked]:bg-dex-primary"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white text-base font-medium">Trade Confirmations</Label>
                  <p className="text-dex-text-secondary text-sm">Receive notifications for completed trades</p>
                </div>
                <Switch 
                  checked={settings.trade_confirmations} 
                  onCheckedChange={() => handleToggle('trade_confirmations')}
                  className="data-[state=checked]:bg-dex-primary"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white text-base font-medium">Security Alerts</Label>
                  <p className="text-dex-text-secondary text-sm">Get notified about account security events</p>
                </div>
                <Switch 
                  checked={settings.security_alerts} 
                  onCheckedChange={() => handleToggle('security_alerts')}
                  className="data-[state=checked]:bg-dex-primary"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white text-base font-medium">Market Updates</Label>
                  <p className="text-dex-text-secondary text-sm">Receive weekly market analysis and trends</p>
                </div>
                <Switch 
                  checked={settings.market_updates} 
                  onCheckedChange={() => handleToggle('market_updates')}
                  className="data-[state=checked]:bg-dex-primary"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white text-base font-medium">Promotional Emails</Label>
                  <p className="text-dex-text-secondary text-sm">Receive offers and promotional content</p>
                </div>
                <Switch 
                  checked={settings.promotional_emails} 
                  onCheckedChange={() => handleToggle('promotional_emails')}
                  className="data-[state=checked]:bg-dex-primary"
                />
              </div>

              <Button
                variant="primary"
                className="w-full font-medium text-base min-h-[44px] mt-6"
                onClick={saveSettings}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default NotificationsPage;
