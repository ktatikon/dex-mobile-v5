/**
 * Sliding Navigation Panel Component
 * 
 * Main sliding panel triggered by V-DEX logo click with smooth animations
 * and mobile-optimized touch interactions for 50,000+ concurrent users
 */

import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  X, 
  Coins, 
  Network, 
  Brain, 
  Users, 
  Shield,
  ChevronRight 
} from 'lucide-react';

interface SlidingNavigationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface NavigationMenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
}

const SlidingNavigationPanel: React.FC<SlidingNavigationPanelProps> = React.memo(({
  isOpen,
  onClose,
  className = ''
}) => {
  const navigate = useNavigate();

  // Navigation menu items configuration
  const navigationItems: NavigationMenuItem[] = React.useMemo(() => [
    {
      id: 'defi',
      label: 'DeFi',
      path: '/defi',
      icon: Coins,
      description: 'Staking, yield farming, and liquidity provision'
    },
    {
      id: 'multi-network-portfolio',
      label: 'Multi-Network Portfolio',
      path: '/multi-network-portfolio',
      icon: Network,
      description: 'Cross-chain bridge and portfolio management'
    },
    {
      id: 'ai-analytics',
      label: 'AI Analytics',
      path: '/ai-analytics',
      icon: Brain,
      description: 'AI-powered portfolio optimization and insights'
    },
    {
      id: 'social',
      label: 'Social',
      path: '/social',
      icon: Users,
      description: 'Social trading and community features'
    },
    {
      id: 'kyc-aml',
      label: 'KYC/AML Verification',
      path: '/kyc-aml',
      icon: Shield,
      description: 'Identity verification and compliance'
    }
  ], []);

  // Handle navigation item click
  const handleNavigationClick = useCallback((path: string) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  // Handle escape key press
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  // Setup keyboard event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when panel is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="navigation-panel-title"
    >
      {/* Panel Container */}
      <div 
        className="fixed left-0 top-0 h-full w-4/5 bg-[#2C2C2E] shadow-[2px_0_10px_rgba(0,0,0,0.3)] transform transition-transform duration-300 ease-in-out rounded-r-xl"
        style={{ 
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          fontFamily: 'Inter, sans-serif'
        }}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2
            id="navigation-panel-title"
            className="text-2xl font-medium text-white font-poppins"
          >
            <span className="text-[#B1420A]">V</span>-DEX Navigation
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 rounded-lg hover:bg-white/10 text-white font-poppins"
            aria-label="Close navigation panel"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Navigation Menu */}
        <div className="p-4 space-y-3">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Card
                key={item.id}
                className="bg-transparent border-dex-secondary/30 hover:bg-dex-secondary/10 transition-all duration-200 cursor-pointer hover:border-dex-primary/30 hover:shadow-[0_2px_8px_rgba(177,66,10,0.1)] rounded-xl"
                onClick={() => handleNavigationClick(item.path)}
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B1420A]/20 to-[#D2691E]/20 flex items-center justify-center shadow-[0_2px_4px_rgba(177,66,10,0.2)]">
                      <IconComponent size={22} className="text-[#B1420A]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white text-base font-poppins">
                        {item.label}
                      </h3>
                      <p className="text-sm text-white/70 mt-1 font-poppins font-light">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-dex-primary/60" />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Panel Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="text-center">
            <p className="text-sm text-white/70 font-poppins font-medium">
              V-DEX Mobile v5.0
            </p>
            <p className="text-xs text-white/50 mt-1 font-poppins font-light">
              Decentralized Exchange Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

SlidingNavigationPanel.displayName = 'SlidingNavigationPanel';

export default SlidingNavigationPanel;
