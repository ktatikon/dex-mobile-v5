import { supabase } from '@/integrations/supabase/client';
import { saveHardwareWalletConnection } from '@/services/walletConnectionService';

export interface HardwareWalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  connectionMethods: ('usb' | 'bluetooth' | 'qr')[];
  isPopular?: boolean;
  website?: string;
}

export const HARDWARE_WALLET_OPTIONS: HardwareWalletOption[] = [
  {
    id: 'ledger',
    name: 'Ledger',
    icon: '/hardware-wallets/ledger.svg',
    description: 'Nano S, Nano S Plus, Nano X',
    connectionMethods: ['usb', 'bluetooth'],
    isPopular: true,
    website: 'https://www.ledger.com/'
  },
  {
    id: 'trezor',
    name: 'Trezor',
    icon: '/hardware-wallets/trezor.svg',
    description: 'Model One, Model T',
    connectionMethods: ['usb'],
    isPopular: true,
    website: 'https://trezor.io/'
  },
  {
    id: 'keepkey',
    name: 'KeepKey',
    icon: '/hardware-wallets/keepkey.svg',
    description: 'KeepKey Hardware Wallet',
    connectionMethods: ['usb'],
    website: 'https://shapeshift.com/keepkey'
  },
  {
    id: 'safepal',
    name: 'SafePal',
    icon: '/hardware-wallets/safepal.svg',
    description: 'SafePal S1 Hardware Wallet',
    connectionMethods: ['qr'],
    website: 'https://www.safepal.io/'
  },
  {
    id: 'keystone',
    name: 'Keystone',
    icon: '/hardware-wallets/keystone.svg',
    description: 'Keystone Pro, Essential',
    connectionMethods: ['qr'],
    website: 'https://keyst.one/'
  },
  {
    id: 'ellipal',
    name: 'Ellipal',
    icon: '/hardware-wallets/ellipal.svg',
    description: 'Ellipal Titan, Joy',
    connectionMethods: ['qr'],
    website: 'https://www.ellipal.com/'
  }
];

export interface ConnectionMethod {
  id: 'usb' | 'bluetooth' | 'qr';
  name: string;
  description: string;
  icon: string;
  instructions: string[];
}

export const CONNECTION_METHODS: ConnectionMethod[] = [
  {
    id: 'usb',
    name: 'USB Connection',
    description: 'Connect via USB cable',
    icon: 'Usb',
    instructions: [
      'Connect your hardware wallet to your device using the USB cable',
      'Unlock your hardware wallet with your PIN',
      'Open the appropriate app on your hardware wallet',
      'Click "Connect" below to establish the connection'
    ]
  },
  {
    id: 'bluetooth',
    name: 'Bluetooth Connection',
    description: 'Connect wirelessly via Bluetooth',
    icon: 'Bluetooth',
    instructions: [
      'Enable Bluetooth on your device',
      'Turn on your hardware wallet',
      'Put your hardware wallet in pairing mode',
      'Click "Connect" below to pair and connect'
    ]
  },
  {
    id: 'qr',
    name: 'QR Code Connection',
    description: 'Connect by scanning QR codes',
    icon: 'QrCode',
    instructions: [
      'Open your hardware wallet app',
      'Navigate to the wallet connection section',
      'Generate a QR code for connection',
      'Scan the QR code with your device camera'
    ]
  }
];

/**
 * Connect a hardware wallet for a user
 * @param userId The user's ID
 * @param wallet The hardware wallet option to connect
 * @param connectionMethod The connection method to use
 * @returns Connection result
 */
export const connectHardwareWallet = async (
  userId: string,
  wallet: HardwareWalletOption,
  connectionMethod: 'usb' | 'bluetooth' | 'qr'
): Promise<{ success: boolean; address?: string; error?: string }> => {
  try {
    // Check if user is authenticated
    if (!userId) {
      return {
        success: false,
        error: 'User authentication required'
      };
    }

    // Check if connection method is supported
    if (!wallet.connectionMethods.includes(connectionMethod)) {
      return {
        success: false,
        error: `${connectionMethod} connection not supported for ${wallet.name}`
      };
    }

    let address: string;

    // Handle different wallet and connection method combinations
    switch (wallet.id) {
      case 'ledger':
        address = await connectLedger(connectionMethod);
        break;
      case 'trezor':
        address = await connectTrezor(connectionMethod);
        break;
      case 'keepkey':
        address = await connectKeepKey(connectionMethod);
        break;
      case 'safepal':
        address = await connectSafePal(connectionMethod);
        break;
      case 'keystone':
        address = await connectKeystone(connectionMethod);
        break;
      case 'ellipal':
        address = await connectEllipal(connectionMethod);
        break;
      default:
        // For demonstration, generate a random address
        address = `0x${Math.random().toString(16).substring(2, 42)}`;
    }

    // Save the hardware wallet connection to Supabase
    const connection = await saveHardwareWalletConnection(userId, wallet, address);

    if (connection) {
      return {
        success: true,
        address
      };
    } else {
      return {
        success: false,
        error: 'Failed to save wallet connection'
      };
    }
  } catch (error) {
    console.error('Error connecting hardware wallet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Connect Ledger hardware wallet
 * @param method Connection method
 * @returns Wallet address
 */
const connectLedger = async (method: 'usb' | 'bluetooth' | 'qr'): Promise<string> => {
  // In a real implementation, this would use Ledger's SDK
  // For demonstration, return a mock address
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate connection delay
  return `0x${Math.random().toString(16).substring(2, 42)}`;
};

/**
 * Connect Trezor hardware wallet
 * @param method Connection method
 * @returns Wallet address
 */
const connectTrezor = async (method: 'usb' | 'bluetooth' | 'qr'): Promise<string> => {
  // In a real implementation, this would use Trezor Connect
  // For demonstration, return a mock address
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate connection delay
  return `0x${Math.random().toString(16).substring(2, 42)}`;
};

/**
 * Connect KeepKey hardware wallet
 * @param method Connection method
 * @returns Wallet address
 */
const connectKeepKey = async (method: 'usb' | 'bluetooth' | 'qr'): Promise<string> => {
  // In a real implementation, this would use KeepKey's SDK
  // For demonstration, return a mock address
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate connection delay
  return `0x${Math.random().toString(16).substring(2, 42)}`;
};

/**
 * Connect SafePal hardware wallet
 * @param method Connection method
 * @returns Wallet address
 */
const connectSafePal = async (method: 'usb' | 'bluetooth' | 'qr'): Promise<string> => {
  // In a real implementation, this would handle QR code scanning
  // For demonstration, return a mock address
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate connection delay
  return `0x${Math.random().toString(16).substring(2, 42)}`;
};

/**
 * Connect Keystone hardware wallet
 * @param method Connection method
 * @returns Wallet address
 */
const connectKeystone = async (method: 'usb' | 'bluetooth' | 'qr'): Promise<string> => {
  // In a real implementation, this would handle QR code scanning
  // For demonstration, return a mock address
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate connection delay
  return `0x${Math.random().toString(16).substring(2, 42)}`;
};

/**
 * Connect Ellipal hardware wallet
 * @param method Connection method
 * @returns Wallet address
 */
const connectEllipal = async (method: 'usb' | 'bluetooth' | 'qr'): Promise<string> => {
  // In a real implementation, this would handle QR code scanning
  // For demonstration, return a mock address
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate connection delay
  return `0x${Math.random().toString(16).substring(2, 42)}`;
};

/**
 * Get connected hardware wallets for a user
 * @param userId The user's ID
 * @returns Array of connected hardware wallets
 */
export const getConnectedHardwareWallets = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('wallet_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('wallet_type', 'hardware')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching hardware wallets:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getConnectedHardwareWallets:', error);
    return [];
  }
};

/**
 * Disconnect a hardware wallet
 * @param userId The user's ID
 * @param walletId The wallet connection ID
 * @returns Success status
 */
export const disconnectHardwareWallet = async (userId: string, walletId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('wallet_connections')
      .delete()
      .eq('id', walletId)
      .eq('user_id', userId)
      .eq('wallet_type', 'hardware');

    if (error) {
      console.error('Error disconnecting hardware wallet:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in disconnectHardwareWallet:', error);
    return false;
  }
};

/**
 * Check if hardware wallet connection is available
 * @param method Connection method to check
 * @returns Availability status
 */
export const isConnectionMethodAvailable = async (method: 'usb' | 'bluetooth' | 'qr'): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  switch (method) {
    case 'usb':
      // Check for WebUSB support
      return 'usb' in navigator;
    case 'bluetooth':
      // Check for Web Bluetooth support
      return 'bluetooth' in navigator;
    case 'qr':
      // Check for camera access (for QR scanning)
      return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
    default:
      return false;
  }
};
