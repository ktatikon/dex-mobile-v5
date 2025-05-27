import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

// Define the wallet option interface
export interface WalletOption {
  id: string;
  name: string;
  icon: string;
  deepLink: string;
  universalLink: string;
  description: string;
}

// Define the hot wallet options
export const hotWalletOptions: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '/wallet-icons/metamask.svg',
    deepLink: 'metamask://dapp/',
    universalLink: 'https://metamask.app.link/',
    description: 'Connect to MetaMask wallet'
  },
  {
    id: 'trustwallet',
    name: 'Trust Wallet',
    icon: '/wallet-icons/trustwallet.svg',
    deepLink: 'trust://',
    universalLink: 'https://link.trustwallet.com/',
    description: 'Connect to Trust Wallet'
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '/wallet-icons/coinbase.svg',
    deepLink: 'cbwallet://dapp/',
    universalLink: 'https://go.cb-w.com/',
    description: 'Connect to Coinbase Wallet'
  },
  {
    id: 'phantom',
    name: 'Phantom',
    icon: '/wallet-icons/phantom.svg',
    deepLink: 'phantom://',
    universalLink: 'https://phantom.app/ul/',
    description: 'Connect to Phantom Wallet'
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    icon: '/wallet-icons/rainbow.svg',
    deepLink: 'rainbow://',
    universalLink: 'https://rnbwapp.com/',
    description: 'Connect to Rainbow Wallet'
  },
  {
    id: 'argent',
    name: 'Argent',
    icon: '/wallet-icons/argent.svg',
    deepLink: 'argent://',
    universalLink: 'https://argent.link/',
    description: 'Connect to Argent Wallet'
  }
];

interface HotWalletOptionsProps {
  onWalletSelect: (wallet: WalletOption) => void;
}

const HotWalletOptions: React.FC<HotWalletOptionsProps> = ({ onWalletSelect }) => {
  const { toast } = useToast();

  const handleWalletClick = (wallet: WalletOption) => {
    // Try to open the wallet app
    const openWallet = async () => {
      try {
        // Check if running on a mobile device
        if (Capacitor.isNativePlatform()) {
          // Try to open the wallet using deep linking
          const url = wallet.deepLink;
          window.open(url, '_blank');
        } else {
          // On web, open the universal link
          window.open(wallet.universalLink, '_blank');
        }
        
        // Call the onWalletSelect callback
        onWalletSelect(wallet);
      } catch (error) {
        console.error('Error opening wallet:', error);
        toast({
          title: 'Wallet Connection Error',
          description: `Could not open ${wallet.name}. Please make sure it's installed.`,
          variant: 'destructive',
        });
      }
    };

    openWallet();
  };

  return (
    <div className="grid grid-cols-3 gap-3 mt-4 mb-6">
      {hotWalletOptions.map((wallet) => (
        <Button
          key={wallet.id}
          variant="outline"
          className="flex flex-col items-center justify-center h-24 p-2 bg-dex-secondary/10 border-dex-secondary/20 text-white hover:bg-dex-secondary/20"
          onClick={() => handleWalletClick(wallet)}
        >
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2">
            {wallet.icon ? (
              <img 
                src={wallet.icon} 
                alt={wallet.name} 
                className="w-6 h-6" 
                onError={(e) => {
                  // If image fails to load, show the first letter of the wallet name
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerText = wallet.name.charAt(0);
                }}
              />
            ) : (
              <span>{wallet.name.charAt(0)}</span>
            )}
          </div>
          <span className="text-xs font-medium text-center">{wallet.name}</span>
        </Button>
      ))}
    </div>
  );
};

export default HotWalletOptions;
