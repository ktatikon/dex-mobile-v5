
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { formatAddress } from '@/services/mockData';
import { WalletInfo } from '@/types';
import { Beaker } from 'lucide-react';

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

const DexHeader: React.FC<DexHeaderProps> = ({
  wallet,
  onConnectWallet,
  onDisconnectWallet
}) => {
  return (
    <header className="px-4 py-4 flex items-center justify-between bg-dex-dark sticky top-0 z-10 border-b border-dex-secondary/20 shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-white">
          <span className="text-dex-primary">V</span>-DEX
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/testnet-wallet">
          <Button
            variant="primary"
            size="sm"
            className="text-white font-medium rounded-lg px-4 py-2 h-11 flex items-center"
          >
            <Beaker size={18} className="mr-2" />
            Testnet Wallet
          </Button>
        </Link>

        <Link to="/settings">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg h-11 w-11 flex items-center justify-center border border-dex-secondary/20 bg-dex-secondary/5"
          >
            <SettingsIcon size={26} className="text-white" />
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default DexHeader;
