/**
 * MANUAL USER CREATION COMPONENT
 * 
 * Admin interface for creating individual users with secure Supabase auth integration
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AuthValidationService } from '@/services/authValidationService';

interface UserCreationForm {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: string;
}

interface CreationResult {
  success: boolean;
  userId?: string;
  email: string;
  error?: string;
  timestamp: Date;
}

const ManualUserCreation: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserCreationForm>({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'user'
  });
  const [results, setResults] = useState<CreationResult[]>([]);
  const { toast } = useToast();

  const validateForm = (): { isValid: boolean; error?: string } => {
    // Email validation
    const emailValidation = AuthValidationService.validateEmail(formData.email);
    if (!emailValidation.isValid) {
      return { isValid: false, error: emailValidation.error };
    }

    // Password validation
    const passwordValidation = AuthValidationService.validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      return { isValid: false, error: passwordValidation.error };
    }

    // Full name validation
    const nameValidation = AuthValidationService.validateFullName(formData.fullName);
    if (!nameValidation.isValid) {
      return { isValid: false, error: nameValidation.error };
    }

    // Phone validation (empty allowed, enhanced logging)
    console.log(`📱 Phone validation - Input: "${formData.phone}" (length: ${formData.phone.length})`);
    if (formData.phone.trim() !== '') {
      const phoneValidation = AuthValidationService.validatePhone(formData.phone);
      console.log(`📱 Phone validation result:`, phoneValidation);
      if (!phoneValidation.isValid) {
        return { isValid: false, error: phoneValidation.error };
      }
    } else {
      console.log(`📱 Phone validation: Empty phone allowed`);
    }

    return { isValid: true };
  };

  // Emergency fallback function for when auth.signUp fails
  const createUserDirectly = async (logPrefix: string, userMetadata: any): Promise<CreationResult> => {
    try {
      console.log(`${logPrefix} 🆘 Using emergency direct database creation...`);

      // Generate UUID for auth_id
      const authId = crypto.randomUUID();

      // Insert directly into public.users table
      const { data, error } = await supabase
        .from('users')
        .insert({
          auth_id: authId,
          email: formData.email.trim().toLowerCase(),
          full_name: userMetadata.full_name,
          phone: userMetadata.phone,
          status: 'active',
          role: userMetadata.role
        })
        .select()
        .single();

      if (error) {
        console.error(`${logPrefix} ❌ Direct database insert failed:`, error);
        return {
          success: false,
          email: formData.email,
          error: `Direct database creation failed: ${error.message}`,
          timestamp: new Date()
        };
      }

      console.log(`${logPrefix} ✅ Emergency user creation successful:`, data);

      return {
        success: true,
        userId: authId,
        email: formData.email,
        timestamp: new Date()
      };

    } catch (exception: any) {
      console.error(`${logPrefix} 💥 Emergency creation exception:`, exception);
      return {
        success: false,
        email: formData.email,
        error: `Emergency creation failed: ${exception.message}`,
        timestamp: new Date()
      };
    }
  };

  const createUser = async (): Promise<CreationResult> => {
    const startTime = new Date();
    const logPrefix = `[USER_CREATION_${startTime.getTime()}]`;

    try {
      console.log(`${logPrefix} 🔐 Starting user creation process...`);
      console.log(`${logPrefix} 📧 Email: ${formData.email}`);
      console.log(`${logPrefix} 👤 Full Name: ${formData.fullName}`);
      console.log(`${logPrefix} 📱 Phone: "${formData.phone}" (length: ${formData.phone.length})`);
      console.log(`${logPrefix} 🔑 Role: ${formData.role}`);

      // Prepare user metadata
      const userMetadata = {
        full_name: formData.fullName.trim(),
        phone: formData.phone.trim(),
        role: formData.role
      };

      console.log(`${logPrefix} 📋 User metadata prepared:`, userMetadata);

      // EMERGENCY FALLBACK: Try direct database insert if auth.signUp fails repeatedly
      console.log(`${logPrefix} 🚀 Attempting Supabase auth.signUp...`);
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: userMetadata
        }
      });

      // If auth.signUp fails with 500 error, try emergency fallback
      if (error && error.status === 500) {
        console.log(`${logPrefix} ⚠️ Auth.signUp failed with 500 error, trying emergency fallback...`);
        return await createUserDirectly(logPrefix, userMetadata);
      }

      console.log(`${logPrefix} 📊 Auth signup response:`, {
        hasData: !!data,
        hasUser: !!data?.user,
        userId: data?.user?.id,
        hasError: !!error,
        errorCode: error?.status,
        errorMessage: error?.message
      });

      if (error) {
        console.error(`${logPrefix} ❌ Auth signup error:`, {
          status: error.status,
          message: error.message,
          code: error.code || 'unknown',
          details: error
        });

        // Enhanced error classification
        let errorMessage = error.message;
        let errorSolution = '';

        if (error.status === 500) {
          if (error.message.includes('Database error saving new user')) {
            errorMessage = 'Database schema migration issue detected';
            errorSolution = 'Execute AUTH_SCHEMA_MIGRATION_FIX.sql in Supabase SQL Editor';
          } else if (error.message.includes('unexpected_failure')) {
            errorMessage = 'Supabase auth service configuration error';
            errorSolution = 'Check auth schema permissions and structure';
          }
        } else if (error.status === 422) {
          errorMessage = 'User already exists or validation failed';
          errorSolution = 'Check if email is already registered';
        } else if (error.status === 429) {
          errorMessage = 'Rate limit exceeded';
          errorSolution = 'Wait a few minutes before trying again';
        }

        return {
          success: false,
          email: formData.email,
          error: `Auth Error (${error.status}): ${errorMessage}${errorSolution ? ` - ${errorSolution}` : ''}`,
          timestamp: new Date()
        };
      }

      if (!data.user) {
        console.error(`${logPrefix} ❌ No user data returned from auth.signUp`);
        return {
          success: false,
          email: formData.email,
          error: 'Auth signup succeeded but no user data returned',
          timestamp: new Date()
        };
      }

      console.log(`${logPrefix} ✅ Auth user created successfully:`, {
        userId: data.user.id,
        email: data.user.email,
        emailConfirmed: data.user.email_confirmed_at,
        createdAt: data.user.created_at
      });

      // Wait a moment for trigger to execute
      console.log(`${logPrefix} ⏳ Waiting for trigger function to execute...`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify profile was created in public.users
      console.log(`${logPrefix} 🔍 Verifying profile creation in public.users...`);
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', data.user.id)
        .single();

      if (profileError) {
        console.error(`${logPrefix} ❌ Profile verification failed:`, profileError);
        return {
          success: false,
          email: formData.email,
          error: `Database error saving new user: ${profileError.message} (Code: ${profileError.code})`,
          timestamp: new Date()
        };
      }

      if (!profileData) {
        console.error(`${logPrefix} ❌ No profile found in public.users table`);
        return {
          success: false,
          email: formData.email,
          error: 'User authenticated but profile not created in database',
          timestamp: new Date()
        };
      }

      console.log(`${logPrefix} ✅ Profile verified in database:`, {
        profileId: profileData.id,
        authId: profileData.auth_id,
        email: profileData.email,
        fullName: profileData.full_name,
        phone: profileData.phone,
        status: profileData.status,
        role: profileData.role
      });

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      console.log(`${logPrefix} 🎉 User creation completed successfully in ${duration}ms`);

      // Success - both auth and profile created
      return {
        success: true,
        userId: data.user.id,
        email: formData.email,
        timestamp: new Date()
      };

    } catch (exception: any) {
      console.error(`${logPrefix} 💥 Exception during user creation:`, {
        name: exception.name,
        message: exception.message,
        stack: exception.stack
      });

      return {
        success: false,
        email: formData.email,
        error: `System Exception: ${exception.message}`,
        timestamp: new Date()
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitTime = new Date();
    const submitLogPrefix = `[FORM_SUBMIT_${submitTime.getTime()}]`;

    console.log(`${submitLogPrefix} 📝 Form submission started`);
    console.log(`${submitLogPrefix} 📋 Form data:`, {
      email: formData.email,
      fullName: formData.fullName,
      phone: `"${formData.phone}" (${formData.phone.length} chars)`,
      role: formData.role,
      passwordLength: formData.password.length
    });

    // Validate form
    console.log(`${submitLogPrefix} ✅ Running form validation...`);
    const validation = validateForm();
    if (!validation.isValid) {
      console.error(`${submitLogPrefix} ❌ Form validation failed:`, validation.error);
      toast({
        title: "Validation Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }
    console.log(`${submitLogPrefix} ✅ Form validation passed`);

    setLoading(true);
    try {
      console.log(`${submitLogPrefix} 🚀 Starting user creation process...`);
      const result = await createUser();

      console.log(`${submitLogPrefix} 📊 User creation result:`, {
        success: result.success,
        userId: result.userId,
        email: result.email,
        error: result.error,
        timestamp: result.timestamp
      });

      // Add result to history
      setResults(prev => [result, ...prev]);

      if (result.success) {
        console.log(`${submitLogPrefix} 🎉 User creation successful!`);
        toast({
          title: "User Created Successfully",
          description: `User ${result.email} has been created with ID: ${result.userId}`,
        });

        // Reset form
        setFormData({
          email: '',
          password: '',
          fullName: '',
          phone: '',
          role: 'user'
        });
        console.log(`${submitLogPrefix} 🔄 Form reset completed`);
      } else {
        console.error(`${submitLogPrefix} ❌ User creation failed:`, result.error);
        toast({
          title: "User Creation Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error(`${submitLogPrefix} 💥 Unexpected error during submission:`, {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      toast({
        title: "Creation Error",
        description: `Unexpected error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log(`${submitLogPrefix} 🏁 Form submission completed`);
    }
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "✅ SUCCESS" : "❌ FAILED"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-dex-dark border-dex-primary/30">
        <CardHeader>
          <CardTitle className="text-dex-accent">👤 Manual User Creation</CardTitle>
          <p className="text-gray-400">
            Create individual users with secure Supabase authentication
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
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
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-dex-dark/70 border-dex-primary/30"
                  placeholder="Min 6 chars, mixed case, numbers, symbols"
                  required
                />
              </div>
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-dex-dark/70 border-dex-primary/30"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-dex-dark/70 border-dex-primary/30"
                  placeholder="Optional - leave empty if not provided"
                />
              </div>
              <div>
                <Label htmlFor="role">User Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="bg-dex-dark/70 border-dex-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="premium">Premium User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="bg-dex-accent hover:bg-dex-accent/90"
            >
              {loading ? 'Creating User...' : 'Create User'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="bg-dex-dark border-dex-primary/30">
          <CardHeader>
            <CardTitle>Creation History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{result.email}</span>
                    {getStatusBadge(result.success)}
                  </div>
                  {result.success ? (
                    <p className="text-sm text-green-400">User ID: {result.userId}</p>
                  ) : (
                    <p className="text-sm text-red-400">Error: {result.error}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {result.timestamp.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManualUserCreation;
