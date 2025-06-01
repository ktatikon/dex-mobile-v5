/**
 * USER EDIT MODAL COMPONENT
 * 
 * Modal for editing user information and managing user accounts
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AuthValidationService } from '@/services/authValidationService';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Calendar,
  Save,
  X,
  Key,
  AlertTriangle
} from 'lucide-react';

interface User {
  id: string;
  auth_id: string;
  email: string;
  full_name: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  role: string;
  created_at: string;
  updated_at: string;
}

interface UserEditModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

interface EditForm {
  full_name: string;
  email: string;
  phone: string;
  status: string;
  role: string;
}

const UserEditModal: React.FC<UserEditModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EditForm>({
    full_name: '',
    email: '',
    phone: '',
    status: 'active',
    role: 'user'
  });
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || '',
        status: user.status,
        role: user.role
      });
    }
  }, [user]);

  const validateForm = (): { isValid: boolean; error?: string } => {
    // Email validation
    const emailValidation = AuthValidationService.validateEmail(formData.email);
    if (!emailValidation.isValid) {
      return { isValid: false, error: emailValidation.error };
    }

    // Full name validation
    const nameValidation = AuthValidationService.validateFullName(formData.full_name);
    if (!nameValidation.isValid) {
      return { isValid: false, error: nameValidation.error };
    }

    // Phone validation (empty allowed)
    if (formData.phone.trim() !== '') {
      const phoneValidation = AuthValidationService.validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        return { isValid: false, error: phoneValidation.error };
      }
    }

    return { isValid: true };
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate form
    const validation = validateForm();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Update user profile
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          status: formData.status,
          role: formData.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "User Updated",
        description: "User information has been successfully updated",
      });

      onUserUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user) return;

    setResetLoading(true);
    try {
      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`
      });

      if (error) throw error;

      toast({
        title: "Password Reset Sent",
        description: `Password reset email has been sent to ${user.email}`,
      });

      setShowPasswordReset(false);
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      suspended: "destructive"
    } as const;

    const colors = {
      active: "✅",
      inactive: "⏸️",
      suspended: "🚫"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {colors[status as keyof typeof colors]} {status.toUpperCase()}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: "bg-red-500/20 text-red-400",
      super_admin: "bg-purple-500/20 text-purple-400",
      premium: "bg-yellow-500/20 text-yellow-400",
      user: "bg-blue-500/20 text-blue-400"
    };

    return (
      <Badge className={colors[role as keyof typeof colors] || "bg-gray-500/20 text-gray-400"}>
        {role.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-dex-dark border-dex-primary/30 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit User: {user.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info Summary */}
          <div className="p-4 bg-dex-dark/50 rounded border border-dex-primary/20">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">User ID</p>
                <p className="text-white font-mono">{user.id.slice(0, 8)}...</p>
              </div>
              <div>
                <p className="text-gray-400">Auth ID</p>
                <p className="text-white font-mono">{user.auth_id.slice(0, 8)}...</p>
              </div>
              <div>
                <p className="text-gray-400">Created</p>
                <p className="text-white">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-400">Last Updated</p>
                <p className="text-white">{new Date(user.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name *
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="bg-dex-dark/70 border-dex-primary/30"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-dex-dark/70 border-dex-primary/30"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-dex-dark/70 border-dex-primary/30"
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="status">Account Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-dex-dark/70 border-dex-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  User Role
                </Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="bg-dex-dark/70 border-dex-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="premium">Premium User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Password Reset Section */}
          <div className="p-4 bg-yellow-900/20 rounded border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-yellow-400 font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Password Management
                </h4>
                <p className="text-sm text-yellow-300 mt-1">
                  Send a password reset email to the user
                </p>
              </div>
              <Button
                onClick={() => setShowPasswordReset(true)}
                variant="outline"
                size="sm"
                className="border-yellow-500/30 text-yellow-400"
              >
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
            </div>
          </div>

          {/* Password Reset Confirmation */}
          {showPasswordReset && (
            <div className="p-4 bg-red-900/20 rounded border border-red-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-red-400 font-medium">Confirm Password Reset</h4>
                  <p className="text-sm text-red-300 mt-1">
                    This will send a password reset email to <strong>{user.email}</strong>. 
                    The user will receive an email with instructions to reset their password.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={handlePasswordReset}
                      disabled={resetLoading}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {resetLoading ? 'Sending...' : 'Send Reset Email'}
                    </Button>
                    <Button
                      onClick={() => setShowPasswordReset(false)}
                      variant="outline"
                      size="sm"
                      className="border-gray-500/30"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-dex-primary/20">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-dex-primary/30"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-dex-accent hover:bg-dex-accent/90"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditModal;
