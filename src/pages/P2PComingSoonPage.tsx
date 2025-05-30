import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Shield, Zap, Clock } from 'lucide-react';

/**
 * P2P Coming Soon Page
 * 
 * Displays a professional coming soon page for P2P trading functionality
 * with feature preview and navigation back to home.
 * 
 * Features:
 * - Professional coming soon design
 * - Feature preview for P2P trading
 * - Maintains established UI design patterns
 * - Clear navigation back to home
 */
const P2PComingSoonPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/');
  };

  const handleNotifyMe = () => {
    // TODO: Implement notification signup when P2P is ready
    navigate('/notifications');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dex-dark via-dex-primary/10 to-dex-secondary/10 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-16">
        <Button
          onClick={handleGoBack}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-dex-primary/10"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <Card className="max-w-md w-full bg-dex-dark/80 border-dex-secondary/30 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            {/* Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-dex-primary/10 rounded-full flex items-center justify-center">
                <Users size={40} className="text-dex-primary" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-white mb-2">
              P2P Trading
            </h1>
            <p className="text-gray-400 mb-6">
              Peer-to-peer trading is coming soon! Trade directly with other users in a secure, decentralized environment.
            </p>

            {/* Feature Preview */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center text-left">
                <Shield size={20} className="text-dex-positive mr-3 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">Secure Escrow</p>
                  <p className="text-gray-400 text-xs">Smart contract protection</p>
                </div>
              </div>
              
              <div className="flex items-center text-left">
                <Zap size={20} className="text-dex-positive mr-3 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">Instant Settlement</p>
                  <p className="text-gray-400 text-xs">Fast peer-to-peer transactions</p>
                </div>
              </div>
              
              <div className="flex items-center text-left">
                <Clock size={20} className="text-dex-positive mr-3 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">24/7 Trading</p>
                  <p className="text-gray-400 text-xs">Trade anytime, anywhere</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleNotifyMe}
                className="w-full bg-dex-primary text-white hover:bg-dex-primary/80 h-12"
              >
                Notify Me When Ready
              </Button>
              
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="w-full border-dex-secondary/30 text-white hover:bg-dex-secondary/20 h-12"
              >
                Explore Other Features
              </Button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-dex-secondary/20">
              <p className="text-gray-400 text-xs">
                In the meantime, explore our trading and wallet features to get started with crypto.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default P2PComingSoonPage;
