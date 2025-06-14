
import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { formatAddress } from '@/services/fallbackDataService';
import { WalletInfo } from '@/types';
import { Beaker } from 'lucide-react';
import SlidingNavigationPanel from '@/components/navigation/SlidingNavigationPanel';
import NavigationOverlay from '@/components/navigation/NavigationOverlay';

// Custom settings icon
const SettingsIcon = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

interface DexHeaderProps {
  wallet: WalletInfo | null;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
}

const DexHeader: React.FC<DexHeaderProps> = React.memo(({
  wallet,
  onConnectWallet,
  onDisconnectWallet
}) => {
  // State for sliding navigation panel
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);

  // Handle navigation panel toggle
  const handleNavigationToggle = useCallback(() => {
    setIsNavigationOpen(prev => !prev);
  }, []);

  const handleNavigationClose = useCallback(() => {
    setIsNavigationOpen(false);
  }, []);

  return (
    <>
      <header className="px-4 py-4 flex items-center justify-between bg-dex-dark sticky top-0 z-20 border-b border-dex-secondary/20 shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
        <div className="flex items-center">
          <button
            onClick={handleNavigationToggle}
            className="text-2xl font-medium text-white hover:opacity-80 transition-opacity duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-dex-primary/50 rounded-lg p-1 font-poppins"
            aria-label="Open navigation menu"
          >
            <span className="text-dex-primary">V</span>-DEX
          </button>
        </div>

      <div className="flex items-center gap-4">
        <Link to="/testnet-wallet">
          <Button
            variant="secondary"
            size="sm"
            className="font-poppins flex items-center"
          >
            <Beaker size={18} className="mr-2" />
            Testnet Wallet
          </Button>
        </Link>

        <Link to="/settings">
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 flex items-center justify-center"
          >
            <SettingsIcon size={26} className="text-white" />
          </Button>
        </Link>
      </div>
    </header>

    {/* Navigation Overlay */}
    <NavigationOverlay
      isOpen={isNavigationOpen}
      onClose={handleNavigationClose}
    />

    {/* Sliding Navigation Panel */}
    <SlidingNavigationPanel
      isOpen={isNavigationOpen}
      onClose={handleNavigationClose}
    />
  </>
  );
});

DexHeader.displayName = 'DexHeader';

export default DexHeader;
