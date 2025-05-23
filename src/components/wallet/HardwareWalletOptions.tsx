import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Define the hardware wallet option interface
export interface HardwareWalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  supportsUSB: boolean;
  supportsBluetooth: boolean;
  supportsQRCode: boolean;
}

// Define the hardware wallet options
export const hardwareWalletOptions: HardwareWalletOption[] = [
  {
    id: 'ledger',
    name: 'Ledger',
    icon: '/hardware-wallets/ledger.svg',
    description: 'Connect to Ledger hardware wallet',
    supportsUSB: true,
    supportsBluetooth: true,
    supportsQRCode: false
  },
  {
    id: 'trezor',
    name: 'Trezor',
    icon: '/hardware-wallets/trezor.svg',
    description: 'Connect to Trezor hardware wallet',
    supportsUSB: true,
    supportsBluetooth: false,
    supportsQRCode: false
  },
  {
    id: 'keepkey',
    name: 'KeepKey',
    icon: '/hardware-wallets/keepkey.svg',
    description: 'Connect to KeepKey hardware wallet',
    supportsUSB: true,
    supportsBluetooth: false,
    supportsQRCode: false
  },
  {
    id: 'safepal',
    name: 'SafePal',
    icon: '/hardware-wallets/safepal.svg',
    description: 'Connect to SafePal hardware wallet',
    supportsUSB: true,
    supportsBluetooth: false,
    supportsQRCode: true
  },
  {
    id: 'keystone',
    name: 'Keystone',
    icon: '/hardware-wallets/keystone.svg',
    description: 'Connect to Keystone hardware wallet',
    supportsUSB: false,
    supportsBluetooth: false,
    supportsQRCode: true
  },
  {
    id: 'ellipal',
    name: 'Ellipal',
    icon: '/hardware-wallets/ellipal.svg',
    description: 'Connect to Ellipal hardware wallet',
    supportsUSB: false,
    supportsBluetooth: false,
    supportsQRCode: true
  }
];

interface HardwareWalletOptionsProps {
  onWalletSelect: (wallet: HardwareWalletOption) => void;
}

const HardwareWalletOptions: React.FC<HardwareWalletOptionsProps> = ({ onWalletSelect }) => {
  const { toast } = useToast();

  const handleWalletClick = (wallet: HardwareWalletOption) => {
    // Call the onWalletSelect callback
    onWalletSelect(wallet);
  };

  return (
    <div className="grid grid-cols-3 gap-3 mt-4 mb-6">
      {hardwareWalletOptions.map((wallet) => (
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
          <div className="flex mt-1 gap-1">
            {wallet.supportsUSB && (
              <div className="w-2 h-2 rounded-full bg-dex-positive" title="USB Support"></div>
            )}
            {wallet.supportsBluetooth && (
              <div className="w-2 h-2 rounded-full bg-blue-500" title="Bluetooth Support"></div>
            )}
            {wallet.supportsQRCode && (
              <div className="w-2 h-2 rounded-full bg-yellow-500" title="QR Code Support"></div>
            )}
          </div>
        </Button>
      ))}
    </div>
  );
};

export default HardwareWalletOptions;
