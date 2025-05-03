
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { formatAddress } from '@/services/mockData';
import { WalletInfo } from '@/types';
import { Settings } from 'lucide-react';

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
    <header className="px-4 py-3 flex items-center justify-between bg-dex-dark/90 backdrop-blur-md sticky top-0 z-10 border-b border-dex-secondary/10 shadow-md shadow-dex-secondary/5">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-white">
          <span className="text-dex-primary">V</span>-DEX Logo
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {wallet ? (
          <Button
            variant="outline"
            size="sm"
            className="border-dex-primary text-dex-primary hover:bg-dex-primary/10"
            onClick={onDisconnectWallet}
          >
            {formatAddress(wallet.address)}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="border-dex-primary text-dex-primary hover:bg-dex-primary/10"
            onClick={onConnectWallet}
          >
            Connect Wallet
          </Button>
        )}

        <Link to="/settings">
          <Button
            variant="glossy"
            size="icon"
            className="rounded-full h-10 w-10 flex items-center justify-center shadow-lg shadow-dex-secondary/30 border border-dex-secondary/40"
          >
            <Settings size={20} className="text-black" />
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default DexHeader;
