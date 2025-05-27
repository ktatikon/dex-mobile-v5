import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2, Eye, EyeOff, Lock, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const SecurityPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });

  const onSubmit = async (data: PasswordFormValues) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // First, verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: data.currentPassword,
      });

      if (signInError) {
        toast({
          title: "Error",
          description: "Current password is incorrect",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Then update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) throw updateError;

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
        variant: "default",
      });
      
      reset();
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTwoFactor = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    toast({
      title: !twoFactorEnabled ? "2FA Enabled" : "2FA Disabled",
      description: !twoFactorEnabled 
        ? "Two-factor authentication has been enabled." 
        : "Two-factor authentication has been disabled.",
      variant: "default",
    });
  };

  const handleToggleBiometric = () => {
    setBiometricEnabled(!biometricEnabled);
    toast({
      title: !biometricEnabled ? "Biometric Login Enabled" : "Biometric Login Disabled",
      description: !biometricEnabled 
        ? "Biometric login has been enabled." 
        : "Biometric login has been disabled.",
      variant: "default",
    });
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
        <h1 className="text-2xl font-bold text-white">Security</h1>
      </div>

      {/* Change Password */}
      <Card className="bg-black border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Change Password</CardTitle>
          <CardDescription className="text-dex-text-secondary text-base">
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="currentPassword" className="text-white text-sm">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  {...register('currentPassword')}
                  className={`bg-dex-dark border-dex-secondary/30 text-white min-h-[44px] pr-10 ${errors.currentPassword ? 'border-red-500' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-dex-text-secondary"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="newPassword" className="text-white text-sm">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  {...register('newPassword')}
                  className={`bg-dex-dark border-dex-secondary/30 text-white min-h-[44px] pr-10 ${errors.newPassword ? 'border-red-500' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-dex-text-secondary"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword" className="text-white text-sm">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register('confirmPassword')}
                  className={`bg-dex-dark border-dex-secondary/30 text-white min-h-[44px] pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-dex-text-secondary"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full font-medium text-base min-h-[44px] mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Additional Security */}
      <Card className="bg-black border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Additional Security</CardTitle>
          <CardDescription className="text-dex-text-secondary text-base">
            Enhance your account security with additional measures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white text-base font-medium">Two-Factor Authentication</Label>
              <p className="text-dex-text-secondary text-sm">Add an extra layer of security to your account</p>
            </div>
            <Switch 
              checked={twoFactorEnabled} 
              onCheckedChange={handleToggleTwoFactor}
              className="data-[state=checked]:bg-dex-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white text-base font-medium">Biometric Login</Label>
              <p className="text-dex-text-secondary text-sm">Use fingerprint or face recognition to log in</p>
            </div>
            <Switch 
              checked={biometricEnabled} 
              onCheckedChange={handleToggleBiometric}
              className="data-[state=checked]:bg-dex-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card className="bg-black border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Security Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-dex-text-secondary">
            <div className="flex gap-3">
              <Lock className="text-dex-primary min-w-[20px]" size={20} />
              <p>Use a unique password that you don't use for other services.</p>
            </div>
            <div className="flex gap-3">
              <Shield className="text-dex-primary min-w-[20px]" size={20} />
              <p>Enable two-factor authentication for maximum security.</p>
            </div>
            <div className="flex gap-3">
              <AlertTriangle className="text-dex-primary min-w-[20px]" size={20} />
              <p>Never share your password or recovery codes with anyone.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityPage;
