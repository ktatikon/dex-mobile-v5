import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/contexts/ThemeContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Settings, 
  Wallet, 
  ShoppingCart,
  Trash2,
  Save,
  Edit
} from 'lucide-react';

const ButtonShowcase: React.FC = () => {
  return (
    <div className="p-6 space-y-8 bg-dex-dark min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-medium text-white font-poppins">
          New UI Design System Showcase
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-white text-sm">Theme Toggle:</span>
          <ThemeToggle />
        </div>
      </div>

      {/* Color Scheme Display */}
      <Card className="bg-dex-card border-dex-secondary/20">
        <CardHeader>
          <CardTitle className="text-white font-poppins">New Color Scheme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg mx-auto mb-2" style={{ backgroundColor: '#B1420A' }}></div>
              <p className="text-white text-sm font-poppins">Primary</p>
              <p className="text-gray-400 text-xs">#B1420A</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg mx-auto mb-2" style={{ backgroundColor: '#D2691E' }}></div>
              <p className="text-white text-sm font-poppins">Accent</p>
              <p className="text-gray-400 text-xs">#D2691E</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg mx-auto mb-2" style={{ backgroundColor: '#34C759' }}></div>
              <p className="text-white text-sm font-poppins">Positive</p>
              <p className="text-gray-400 text-xs">#34C759</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg mx-auto mb-2" style={{ backgroundColor: '#FF3B30' }}></div>
              <p className="text-white text-sm font-poppins">Negative</p>
              <p className="text-gray-400 text-xs">#FF3B30</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Variants Showcase */}
      <Card className="bg-dex-card border-dex-secondary/20">
        <CardHeader>
          <CardTitle className="text-white font-poppins">3D Button Effects with Ambient Glow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Primary Actions */}
          <div>
            <h3 className="text-white font-poppins font-semibold mb-3">Primary Actions (Dark Orange Glow)</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="default" className="font-poppins">
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </Button>
              <Button variant="default" size="lg" className="font-poppins">
                Start Trading
              </Button>
              <Button variant="glossy" className="font-poppins">
                <TrendingUp className="w-4 h-4" />
                Premium Trade
              </Button>
            </div>
          </div>

          {/* Positive Actions */}
          <div>
            <h3 className="text-white font-poppins font-medium mb-3 text-xl">Positive Actions (Green Glow)</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="positive" className="font-poppins">
                <ShoppingCart className="w-4 h-4" />
                Buy Token
              </Button>
              <Button variant="positive" size="lg" className="font-poppins">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
              <Button variant="positive" className="font-poppins">
                Confirm Order
              </Button>
            </div>
          </div>

          {/* Negative Actions */}
          <div>
            <h3 className="text-white font-poppins font-medium mb-3 text-xl">Negative Actions (Red Glow)</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="destructive" className="font-poppins">
                <TrendingDown className="w-4 h-4" />
                Sell Token
              </Button>
              <Button variant="destructive" size="lg" className="font-poppins">
                <Trash2 className="w-4 h-4" />
                Delete Wallet
              </Button>
              <Button variant="destructive" className="font-poppins">
                Cancel Order
              </Button>
            </div>
          </div>

          {/* Secondary Actions */}
          <div>
            <h3 className="text-white font-poppins font-medium mb-3 text-xl">Secondary Actions (Peru Glow)</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" className="font-poppins">
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
              <Button variant="secondary" size="lg" className="font-poppins">
                View Details
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
                View More
              </Button>
              <Button variant="link" className="font-poppins">
                Learn More
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Typography Showcase */}
      <Card className="bg-dex-card border-dex-secondary/20">
        <CardHeader>
          <CardTitle className="text-white font-poppins">Poppins Typography</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-poppins font-bold text-white">Heading 1 - Bold</h1>
            <h2 className="text-3xl font-poppins font-semibold text-white">Heading 2 - Semibold</h2>
            <h3 className="text-2xl font-poppins font-medium text-white">Heading 3 - Medium</h3>
            <p className="text-lg font-poppins font-normal text-white">Body Text - Regular</p>
            <p className="text-sm font-poppins font-light text-gray-400">Small Text - Light</p>
          </div>
        </CardContent>
      </Card>

      {/* Gradient Showcase */}
      <Card className="bg-dex-card border-dex-secondary/20">
        <CardHeader>
          <CardTitle className="text-white font-poppins">New Gradient Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-16 rounded-lg bg-gradient-to-r from-[#B1420A] to-[#D2691E] flex items-center justify-center">
              <span className="text-white font-poppins font-semibold">Trade Page Tab Gradient</span>
            </div>
            <p className="text-gray-400 text-sm font-poppins">
              Updated from #F66F13 → #E5E7E8 to #B1420A → #D2691E
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default ButtonShowcase;
