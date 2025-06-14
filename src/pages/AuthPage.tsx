
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff } from 'lucide-react';
import { AuthValidationService } from '@/services/authValidationService';

const AuthPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });

  const handleSubmit = async (action: 'login' | 'signup') => {
    setLoading(true);

    try {
      if (action === 'login') {
        // Validate login form
        const loginValidation = AuthValidationService.validateLoginForm({
          email: formData.email,
          password: formData.password,
        });

        if (!loginValidation.isValid) {
          throw new Error(loginValidation.error);
        }

        // Additional safety check
        if (typeof signIn !== 'function') {
          throw new Error('Authentication system is not properly initialized. Please refresh the page and try again.');
        }

        await signIn(formData.email, formData.password);
        navigate('/');
      } else {
        // Validate signup form
        const signupValidation = AuthValidationService.validateSignupForm({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone,
        });

        if (!signupValidation.isValid) {
          throw new Error(signupValidation.error);
        }

        // Check email availability
        const emailCheck = await AuthValidationService.checkEmailAvailability(formData.email);

        if (!emailCheck.isAvailable) {
          throw new Error(emailCheck.error || 'An account with this email address already exists. Please try logging in instead.');
        }

        // Additional safety check
        if (typeof signUp !== 'function') {
          throw new Error('Authentication system is not properly initialized. Please refresh the page and try again.');
        }

        const result = await signUp(formData.email, formData.password, {
          full_name: formData.fullName,
          phone: formData.phone,
        });

        if (result.needsVerification) {
          toast({
            title: "Registration Successful",
            description: "Please check your email to verify your account.",
            variant: "default",
          });

          // Navigate to email verification page with email
          navigate('/auth/verify-email', {
            state: { email: result.email },
            replace: true
          });
        } else {
          // Fallback for auto-confirmed accounts
          toast({
            title: "Registration Successful",
            description: "Welcome to V-DEX! You can now start trading.",
            variant: "default",
          });
          navigate('/');
        }
      }
    } catch (error: any) {
      // Enhanced error handling with specific recovery strategies
      let errorMessage = AuthValidationService.formatAuthError(error);

      // Handle specific authentication errors
      if (error.message?.includes('AuthSessionMissingError') || error.message?.includes('Auth session missing')) {
        errorMessage = 'Authentication session error. Please try again or refresh the page.';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please try logging in instead.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message?.includes('Password')) {
        errorMessage = 'Password must be at least 6 characters long.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the verification link before logging in.';
      }

      toast({
        title: action === 'login' ? "Login Failed" : "Registration Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-dex-dark via-dex-primary/20 to-dex-secondary/20 p-4">
      <Card className="w-full max-w-md bg-dex-dark/80 backdrop-blur-lg border border-dex-primary/30 text-white shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-white">
            V-DEX Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-dex-dark/50">
              <TabsTrigger value="login" className="text-white data-[state=active]:bg-dex-primary/50">Login</TabsTrigger>
              <TabsTrigger value="signup" className="text-white data-[state=active]:bg-dex-primary/50">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-white">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-dex-dark/70 border-dex-primary/30 text-white placeholder-gray-400 focus:ring-dex-accent"
                  required
                />
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="login-password" className="text-white">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-dex-dark/70 border-dex-primary/30 text-white placeholder-gray-400 focus:ring-dex-accent pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                className="w-full bg-dex-accent hover:bg-dex-accent/90 text-white"
                onClick={() => handleSubmit('login')}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-fullname" className="text-white">Full Name</Label>
                <Input
                  id="signup-fullname"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-dex-dark/70 border-dex-primary/30 text-white placeholder-gray-400 focus:ring-dex-accent"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-white">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-dex-dark/70 border-dex-primary/30 text-white placeholder-gray-400 focus:ring-dex-accent"
                  required
                />
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="signup-password" className="text-white">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-dex-dark/70 border-dex-primary/30 text-white placeholder-gray-400 focus:ring-dex-accent pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-phone" className="text-white">Phone Number (Optional)</Label>
                <Input
                  id="signup-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-dex-dark/70 border-dex-primary/30 text-white placeholder-gray-400 focus:ring-dex-accent"
                  placeholder="Enter your phone number (optional)"
                />
              </div>

              <Button
                className="w-full bg-dex-accent hover:bg-dex-accent/90 text-white"
                onClick={() => handleSubmit('signup')}
                disabled={loading}
              >
                {loading ? 'Signing up...' : 'Sign Up'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
