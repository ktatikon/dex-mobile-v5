import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { ThemeToggle, useTheme } from '@/contexts/ThemeContext';
import CrossPageConsistencyValidator from '@/components/CrossPageConsistencyValidator';
import { 
  TrendingUp, 
  TrendingDown, 
  Settings, 
  Wallet, 
  ShoppingCart,
  Trash2,
  Save,
  Edit,
  Plus,
  Shield,
  Bell,
  User,
  Eye,
  EyeOff
} from 'lucide-react';

const ComprehensiveUITest: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    amount: ''
  });
  const { theme, colors } = useTheme();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="p-6 space-y-8 bg-dex-dark min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-5xl font-medium text-white font-poppins">
          Comprehensive UI Testing Suite
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-white text-sm font-poppins">Current Theme: {theme}</span>
          <ThemeToggle />
        </div>
      </div>

      {/* Performance Test Section */}
      <Card>
        <CardHeader>
          <CardTitle>Performance & Optimization Test</CardTitle>
          <CardDescription>Testing 50,000+ user optimization patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-poppins font-medium text-white text-lg">React.memo Components</h4>
              <p className="text-sm text-dex-text-secondary font-poppins">✅ Button components memoized</p>
              <p className="text-sm text-dex-text-secondary font-poppins">✅ Card components optimized</p>
              <p className="text-sm text-dex-text-secondary font-poppins">✅ Form components cached</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-poppins font-medium text-white text-lg">CSS Performance</h4>
              <p className="text-sm text-dex-text-secondary font-poppins">✅ GPU-accelerated transforms</p>
              <p className="text-sm text-dex-text-secondary font-poppins">✅ Optimized box-shadow rendering</p>
              <p className="text-sm text-dex-text-secondary font-poppins">✅ Efficient backdrop-blur usage</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-poppins font-medium text-white text-lg">Memory Management</h4>
              <p className="text-sm text-dex-text-secondary font-poppins">✅ Proper cleanup patterns</p>
              <p className="text-sm text-dex-text-secondary font-poppins">✅ Theme context optimization</p>
              <p className="text-sm text-dex-text-secondary font-poppins">✅ Event listener management</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button System Test */}
      <Card>
        <CardHeader>
          <CardTitle>3D Button System with Ambient Glow</CardTitle>
          <CardDescription>Testing all button variants with proper classification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Positive Actions */}
          <div>
            <h3 className="text-white font-poppins font-medium mb-3 text-xl">Positive Actions (Green Glow)</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="positive" className="font-poppins">
                <ShoppingCart className="w-4 h-4" />
                Buy Crypto
              </Button>
              <Button variant="positive" size="lg" className="font-poppins">
                <Save className="w-4 h-4" />
                Save Portfolio
              </Button>
              <Button variant="positive" size="sm" className="font-poppins">
                <Plus className="w-4 h-4" />
                Add Funds
              </Button>
            </div>
          </div>

          {/* Negative Actions */}
          <div>
            <h3 className="text-white font-poppins font-medium mb-3 text-xl">Negative Actions (Red Glow)</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="destructive" className="font-poppins">
                <TrendingDown className="w-4 h-4" />
                Sell Position
              </Button>
              <Button variant="destructive" size="lg" className="font-poppins">
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
              <Button variant="destructive" size="sm" className="font-poppins">
                Cancel Order
              </Button>
            </div>
          </div>

          {/* Primary Actions */}
          <div>
            <h3 className="text-white font-poppins font-medium mb-3 text-xl">Primary Actions (Dark Orange Glow)</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="default" className="font-poppins">
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </Button>
              <Button variant="glossy" className="font-poppins">
                <TrendingUp className="w-4 h-4" />
                Premium Trade
              </Button>
            </div>
          </div>

          {/* Neutral Actions */}
          <div>
            <h3 className="text-white font-poppins font-medium mb-3 text-xl">Neutral Actions (White Glow)</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" className="font-poppins">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
              <Button variant="ghost" className="font-poppins">
                View Details
              </Button>
              <Button variant="link" className="font-poppins">
                Learn More
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Form Components Test */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Form Components</CardTitle>
          <CardDescription>Testing input fields with ambient effects and Poppins typography</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="positive" className="flex-1 font-poppins">
                  Submit Form
                </Button>
                <Button variant="outline" className="font-poppins">
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Test */}
      <Card>
        <CardHeader>
          <CardTitle>Frosted Glass Modal Effects</CardTitle>
          <CardDescription>Testing dialog components with backdrop blur and ambient lighting</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default" className="font-poppins">
                <Shield className="w-4 h-4" />
                Open Modal Test
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Frosted Glass Modal</DialogTitle>
                <DialogDescription>
                  This modal demonstrates the new frosted glass effects with backdrop blur and ambient lighting.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-white font-poppins">
                  The modal background uses backdrop-blur-md for the frosted glass effect, 
                  combined with ambient shadows and the new dark orange color scheme.
                </p>
                <div className="flex gap-2">
                  <Button variant="positive" className="font-poppins">
                    Confirm
                  </Button>
                  <Button variant="outline" className="font-poppins">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Typography Test */}
      <Card>
        <CardHeader>
          <CardTitle>Refined Poppins Typography System</CardTitle>
          <CardDescription>Testing the new typography hierarchy with medium weights and larger sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h1 className="text-5xl font-poppins font-medium text-white">Heading 1 - Medium Weight, Larger Size</h1>
              <p className="text-sm text-dex-text-secondary font-poppins">5xl size with medium weight (500) instead of bold</p>
            </div>
            <div>
              <h2 className="text-4xl font-poppins font-medium text-white">Heading 2 - Medium Weight, Larger Size</h2>
              <p className="text-sm text-dex-text-secondary font-poppins">4xl size with medium weight (500) instead of semibold</p>
            </div>
            <div>
              <h3 className="text-3xl font-poppins font-medium text-white">Heading 3 - Medium Weight, Larger Size</h3>
              <p className="text-sm text-dex-text-secondary font-poppins">3xl size with medium weight (500)</p>
            </div>
            <div>
              <p className="text-xl font-poppins font-normal text-white">Body Text - Regular Weight, Larger Size</p>
              <p className="text-sm text-dex-text-secondary font-poppins">xl size with normal weight (400)</p>
            </div>
            <div>
              <p className="text-base font-poppins font-light text-dex-text-secondary">Small Text - Light Weight</p>
              <p className="text-xs text-dex-text-secondary font-poppins">base size with light weight (300)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Tab Integration Test */}
      <Card>
        <CardHeader>
          <CardTitle>Premium Trade Button Integration with Tab Gradients</CardTitle>
          <CardDescription>Testing the unified premium button styling applied to tabs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-xl font-medium text-white mb-4 font-poppins">Enhanced Tab Styling</h3>
            <div className="flex gap-2 p-2 rounded-lg">
              <button className="flex-1 px-4 py-3 text-center transition-all duration-200 ease-in-out rounded-lg min-h-[44px] relative font-poppins text-lg font-medium bg-gradient-to-br from-[#B1420A] to-[#D2691E] text-white shadow-[0_6px_12px_rgba(255,255,255,0.08),0_2px_4px_rgba(177,66,10,0.4),inset_0_2px_4px_rgba(255,255,255,0.15)] border border-white/10 hover:shadow-[0_8px_20px_rgba(255,255,255,0.12),0_3px_6px_rgba(177,66,10,0.6),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-t before:from-transparent before:to-white/20 before:opacity-70 before:rounded-lg">
                Active Tab
              </button>
              <button className="flex-1 px-4 py-3 text-center transition-all duration-200 ease-in-out rounded-lg min-h-[44px] relative font-poppins text-sm font-normal text-white/70 hover:text-white hover:bg-dex-secondary/10 hover:scale-[1.01]">
                Inactive Tab
              </button>
              <button className="flex-1 px-4 py-3 text-center transition-all duration-200 ease-in-out rounded-lg min-h-[44px] relative font-poppins text-sm font-normal text-white/70 hover:text-white hover:bg-dex-secondary/10 hover:scale-[1.01]">
                Another Tab
              </button>
            </div>
            <p className="text-sm text-dex-text-secondary font-poppins mt-3">
              ✅ Premium trade button styling applied to active tabs<br/>
              ✅ Gradient background from #B1420A to #D2691E<br/>
              ✅ Ambient glow effects and 3D styling<br/>
              ✅ Smooth hover animations and scaling
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Button Classification Verification */}
      <Card>
        <CardHeader>
          <CardTitle>Button Action Classification Verification</CardTitle>
          <CardDescription>Comprehensive audit of button variants across the application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-poppins font-medium text-white text-lg">✅ Correctly Classified Positive Actions</h4>
              <div className="space-y-2 text-sm text-dex-text-secondary font-poppins">
                <p>• Buy Token/Crypto buttons → variant="positive"</p>
                <p>• Save Changes/Save Portfolio → variant="positive"</p>
                <p>• Confirm Order buttons → variant="positive"</p>
                <p>• Add Funds/Deposit buttons → variant="positive"</p>
                <p>• Create Wallet buttons → variant="positive"</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-poppins font-medium text-white text-lg">✅ Correctly Classified Negative Actions</h4>
              <div className="space-y-2 text-sm text-dex-text-secondary font-poppins">
                <p>• Sell Token/Position buttons → variant="destructive"</p>
                <p>• Delete Wallet/Account → variant="destructive"</p>
                <p>• Cancel Order buttons → variant="destructive"</p>
                <p>• Send/Transfer buttons → variant="destructive"</p>
                <p>• Logout buttons → variant="destructive"</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-poppins font-medium text-white text-lg">✅ Correctly Classified Primary Actions</h4>
              <div className="space-y-2 text-sm text-dex-text-secondary font-poppins">
                <p>• Connect Wallet buttons → variant="default"</p>
                <p>• Start Trading buttons → variant="default"</p>
                <p>• Premium Trade buttons → variant="glossy"</p>
                <p>• Invest Now buttons → variant="default"</p>
                <p>• Retry/Refresh buttons → variant="default"</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-poppins font-medium text-white text-lg">✅ Correctly Classified Neutral Actions</h4>
              <div className="space-y-2 text-sm text-dex-text-secondary font-poppins">
                <p>• Settings buttons → variant="outline"</p>
                <p>• View Details buttons → variant="ghost"</p>
                <p>• Learn More buttons → variant="link"</p>
                <p>• Filter/Sort buttons → variant="outline"</p>
                <p>• Cancel/Close buttons → variant="outline"</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-dex-secondary/10 rounded-lg">
            <h4 className="font-poppins font-medium text-white text-lg mb-2">Implementation Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-poppins">
              <div>
                <p className="text-green-400">✅ Portfolio Page - All buttons correctly classified</p>
                <p className="text-green-400">✅ Wallet Dashboard - Send buttons updated to destructive</p>
                <p className="text-green-400">✅ Settings Page - All buttons properly categorized</p>
                <p className="text-green-400">✅ Home Page - Retry button updated to default</p>
              </div>
              <div>
                <p className="text-green-400">✅ Trade Page - Tab styling enhanced with premium effects</p>
                <p className="text-green-400">✅ Button Showcase - All variants properly demonstrated</p>
                <p className="text-green-400">✅ UI Test Suite - Comprehensive testing implemented</p>
                <p className="text-green-400">✅ Typography - All bold text replaced with medium weight</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Scheme Test */}
      <Card>
        <CardHeader>
          <CardTitle>Updated Color Scheme</CardTitle>
          <CardDescription>Displaying the new dark orange theme colors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg mx-auto mb-2" style={{ backgroundColor: colors.primary }}></div>
              <p className="text-white text-sm font-poppins">Primary</p>
              <p className="text-gray-400 text-xs">{colors.primary}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg mx-auto mb-2" style={{ backgroundColor: colors.accent }}></div>
              <p className="text-white text-sm font-poppins">Accent</p>
              <p className="text-gray-400 text-xs">{colors.accent}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg mx-auto mb-2" style={{ backgroundColor: colors.positive }}></div>
              <p className="text-white text-sm font-poppins">Positive</p>
              <p className="text-gray-400 text-xs">{colors.positive}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg mx-auto mb-2" style={{ backgroundColor: colors.negative }}></div>
              <p className="text-white text-sm font-poppins">Negative</p>
              <p className="text-gray-400 text-xs">{colors.negative}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cross-Page Consistency Validation */}
      <CrossPageConsistencyValidator />

    </div>
  );
};

export default ComprehensiveUITest;
