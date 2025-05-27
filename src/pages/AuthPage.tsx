
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff } from 'lucide-react';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
        await signIn(formData.email, formData.password);
        // Always navigate to home page after successful login
        navigate('/');
      } else {
        // Validate required fields
        if (!formData.fullName.trim()) {
          throw new Error('Full name is required');
        }
        if (!formData.email.trim()) {
          throw new Error('Email is required');
        }
        if (!formData.password.trim()) {
          throw new Error('Password is required');
        }
        if (!formData.phone.trim()) {
          throw new Error('Phone number is required');
        }

        await signUp(formData.email, formData.password, {
          full_name: formData.fullName,
          phone: formData.phone,
        });
        toast({
          title: "Success",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred during authentication",
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
                <Label htmlFor="signup-phone" className="text-white">Phone Number</Label>
                <Input
                  id="signup-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-dex-dark/70 border-dex-primary/30 text-white placeholder-gray-400 focus:ring-dex-accent"
                  required
                  placeholder="Enter your phone number"
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
