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
  securityLevel: 'high' | 'medium' | 'low';
  price: number;
  firmwareVersion?: string;
  supportedNetworks: string[];
  securityFeatures: string[];
}

export const HARDWARE_WALLET_OPTIONS: HardwareWalletOption[] = [
  {
    id: 'ledger',
    name: 'Ledger',
    icon: '/hardware-wallets/ledger.svg',
    description: 'Industry-leading hardware wallet with Nano S, Nano S Plus, Nano X models',
    connectionMethods: ['usb', 'bluetooth'],
    isPopular: true,
    website: 'https://www.ledger.com/',
    securityLevel: 'high',
    price: 79,
    firmwareVersion: '2.1.0',
    supportedNetworks: ['Ethereum', 'Bitcoin', 'Polygon', 'BSC', 'Arbitrum', 'Optimism', 'Avalanche'],
    securityFeatures: ['Secure Element (CC EAL5+)', 'PIN protection', 'Recovery phrase backup', 'Bluetooth encryption']
  },
  {
    id: 'trezor',
    name: 'Trezor',
    icon: '/hardware-wallets/trezor.svg',
    description: 'Original hardware wallet with Model One and Model T',
    connectionMethods: ['usb'],
    isPopular: true,
    website: 'https://trezor.io/',
    securityLevel: 'high',
    price: 69,
    firmwareVersion: '2.5.3',
    supportedNetworks: ['Ethereum', 'Bitcoin', 'Polygon', 'BSC', 'Arbitrum', 'Optimism'],
    securityFeatures: ['Open-source firmware', 'PIN protection', 'Passphrase support', 'Recovery seed backup']
  },
  {
    id: 'keepkey',
    name: 'KeepKey',
    icon: '/hardware-wallets/keepkey.svg',
    description: 'Large screen hardware wallet by ShapeShift',
    connectionMethods: ['usb'],
    website: 'https://shapeshift.com/keepkey',
    securityLevel: 'medium',
    price: 49,
    firmwareVersion: '7.7.0',
    supportedNetworks: ['Ethereum', 'Bitcoin', 'Polygon', 'BSC'],
    securityFeatures: ['Large display', 'PIN protection', 'Recovery phrase backup', 'Open-source software']
  },
  {
    id: 'safepal',
    name: 'SafePal',
    icon: '/hardware-wallets/safepal.svg',
    description: 'Air-gapped hardware wallet with QR code communication',
    connectionMethods: ['qr'],
    website: 'https://www.safepal.io/',
    securityLevel: 'high',
    price: 39,
    firmwareVersion: '1.0.5',
    supportedNetworks: ['Ethereum', 'BSC', 'Polygon', 'Solana', 'Avalanche', 'Fantom'],
    securityFeatures: ['Air-gapped design', 'QR code communication', 'Self-destruct mechanism', 'Tamper-proof']
  },
  {
    id: 'keystone',
    name: 'Keystone',
    icon: '/hardware-wallets/keystone.svg',
    description: 'Air-gapped hardware wallet with large touchscreen',
    connectionMethods: ['qr'],
    website: 'https://keyst.one/',
    securityLevel: 'high',
    price: 169,
    firmwareVersion: '3.0.1',
    supportedNetworks: ['Ethereum', 'Bitcoin', 'Polygon', 'BSC', 'Solana', 'Cosmos'],
    securityFeatures: ['Air-gapped design', 'Large touchscreen', 'Open-source firmware', 'Multi-signature support']
  },
  {
    id: 'ellipal',
    name: 'Ellipal',
    icon: '/hardware-wallets/ellipal.svg',
    description: 'Air-gapped metal hardware wallet with anti-tamper design',
    connectionMethods: ['qr'],
    website: 'https://www.ellipal.com/',
    securityLevel: 'high',
    price: 139,
    firmwareVersion: '4.1.2',
    supportedNetworks: ['Ethereum', 'BSC', 'Polygon', 'Solana', 'Avalanche', 'Fantom', 'Cosmos'],
    securityFeatures: ['Metal casing', 'Air-gapped design', 'Anti-tamper protection', 'Large color screen']
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
        throw new Error(`Unsupported hardware wallet: ${wallet.id}. Please use a supported hardware wallet.`);
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
  try {
    console.log(`🔗 Attempting to connect Ledger via ${method}...`);

    // Check if connection method is available
    const isAvailable = await isConnectionMethodAvailable(method);
    if (!isAvailable) {
      throw new Error(`${method.toUpperCase()} connection is not supported by your browser. Please use a compatible browser or connection method.`);
    }

    // Simulate connection delay for hardware wallet initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (method === 'usb') {
      // Enhanced USB connection guidance
      throw new Error(`Ledger USB Connection Setup Required:

1. Install Ledger Live desktop application from ledger.com
2. Connect your Ledger device via USB cable
3. Unlock your device with PIN
4. Open the Ethereum app on your Ledger device
5. Enable "Contract data" and "Blind signing" in Ethereum app settings
6. Ensure your browser supports WebUSB (Chrome, Edge, Opera)

Current Status: WebUSB API detected but Ledger SDK not installed.
Please install @ledgerhq/hw-transport-webusb package for full functionality.`);
    } else if (method === 'bluetooth') {
      // Enhanced Bluetooth connection guidance
      throw new Error(`Ledger Bluetooth Connection Setup Required:

1. Ensure you have a Bluetooth-enabled Ledger device (Nano X)
2. Enable Bluetooth on your computer/device
3. Install Ledger Live mobile app or desktop with Bluetooth support
4. Pair your Ledger device in system Bluetooth settings
5. Unlock your device and open the Ethereum app
6. Enable Bluetooth in Ledger device settings

Current Status: Web Bluetooth API detected but Ledger BLE SDK not installed.
Please install @ledgerhq/hw-transport-web-ble package for full functionality.`);
    } else if (method === 'qr') {
      throw new Error('Ledger devices do not support QR code connection. Please use USB or Bluetooth connection methods.');
    }

    throw new Error(`Unsupported Ledger connection method: ${method}`);
  } catch (error) {
    console.error('Ledger connection error:', error);
    throw error;
  }
};

/**
 * Connect Trezor hardware wallet
 * @param method Connection method
 * @returns Wallet address
 */
const connectTrezor = async (method: 'usb' | 'bluetooth' | 'qr'): Promise<string> => {
  try {
    console.log(`🔗 Attempting to connect Trezor via ${method}...`);

    // Check if connection method is available
    const isAvailable = await isConnectionMethodAvailable(method);
    if (!isAvailable) {
      throw new Error(`${method.toUpperCase()} connection is not supported by your browser. Please use a compatible browser or connection method.`);
    }

    // Simulate connection delay for hardware wallet initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (method === 'usb') {
      // Enhanced USB connection guidance for Trezor
      throw new Error(`Trezor USB Connection Setup Required:

1. Install Trezor Suite desktop application from trezor.io
2. Connect your Trezor device via USB cable
3. Unlock your device with PIN
4. Ensure Trezor Bridge is installed and running
5. Allow browser access to your Trezor device
6. Use a compatible browser (Chrome, Firefox, Edge)

Current Status: WebUSB API detected but Trezor Connect SDK not installed.
Please install @trezor/connect package for full functionality.

Note: Trezor devices require Trezor Bridge for secure communication.`);
    } else if (method === 'bluetooth') {
      throw new Error(`Trezor Bluetooth Connection Not Supported:

Trezor devices (Model One, Model T) do not support Bluetooth connectivity.
Please use USB connection method instead.

Available connection methods for Trezor:
- USB connection via Trezor Bridge
- Web interface through Trezor Suite`);
    } else if (method === 'qr') {
      throw new Error(`Trezor QR Code Connection Not Supported:

Trezor devices do not support QR code communication.
Please use USB connection method instead.

For air-gapped transactions, consider:
- Using Trezor's offline transaction signing
- Exporting unsigned transactions for manual signing`);
    }

    throw new Error(`Unsupported Trezor connection method: ${method}`);
  } catch (error) {
    console.error('Trezor connection error:', error);
    throw error;
  }
};

/**
 * Connect KeepKey hardware wallet
 * @param method Connection method
 * @returns Wallet address
 */
const connectKeepKey = async (method: 'usb' | 'bluetooth' | 'qr'): Promise<string> => {
  try {
    console.log(`🔗 Attempting to connect KeepKey via ${method}...`);

    // Simulate connection delay for hardware wallet initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (method === 'usb') {
      // In a real implementation, this would use KeepKey's SDK
      throw new Error('KeepKey USB connection requires KeepKey SDK. Please install KeepKey Client and connect your device.');
    } else if (method === 'bluetooth') {
      throw new Error('KeepKey does not support Bluetooth connection. Please use USB connection.');
    } else if (method === 'qr') {
      throw new Error('KeepKey QR connection not supported. Please use USB connection.');
    }

    throw new Error(`Unsupported KeepKey connection method: ${method}`);
  } catch (error) {
    console.error('KeepKey connection error:', error);
    throw error;
  }
};

/**
 * Connect SafePal hardware wallet
 * @param method Connection method
 * @returns Wallet address
 */
const connectSafePal = async (method: 'usb' | 'bluetooth' | 'qr'): Promise<string> => {
  try {
    console.log(`🔗 Attempting to connect SafePal via ${method}...`);

    // Check if connection method is available
    const isAvailable = await isConnectionMethodAvailable(method);
    if (!isAvailable) {
      throw new Error(`${method.toUpperCase()} connection is not supported by your browser. Please use a compatible browser or connection method.`);
    }

    // Simulate connection delay for hardware wallet initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (method === 'qr') {
      // Enhanced QR connection guidance for SafePal
      throw new Error(`SafePal QR Code Connection Setup Required:

1. Install SafePal mobile app from App Store/Google Play
2. Ensure your SafePal S1 device is powered on and unlocked
3. Grant camera permissions to this web application
4. Navigate to "Connect Wallet" in SafePal app
5. Select "Scan QR Code" option
6. Point your device camera at the QR code displayed

Current Status: Camera API detected but QR scanning library not installed.
Please install @zxing/library package for QR code functionality.

Note: SafePal S1 is completely air-gapped for maximum security.`);
    } else if (method === 'usb') {
      throw new Error(`SafePal USB Connection Not Supported:

SafePal S1 is designed as an air-gapped hardware wallet and does not support USB data connections.
This design ensures maximum security by preventing any digital communication.

Please use QR code connection method instead:
- More secure (air-gapped)
- No risk of malware or hacking
- Supported by SafePal mobile app`);
    } else if (method === 'bluetooth') {
      throw new Error(`SafePal Bluetooth Connection Not Supported:

SafePal S1 does not support Bluetooth connectivity to maintain air-gapped security.
This design prevents wireless attacks and ensures maximum protection.

Please use QR code connection method instead:
- Air-gapped security design
- No wireless vulnerabilities
- Supported by SafePal mobile app`);
    }

    throw new Error(`Unsupported SafePal connection method: ${method}`);
  } catch (error) {
    console.error('SafePal connection error:', error);
    throw error;
  }
};

/**
 * Connect Keystone hardware wallet
 * @param method Connection method
 * @returns Wallet address
 */
const connectKeystone = async (method: 'usb' | 'bluetooth' | 'qr'): Promise<string> => {
  try {
    console.log(`🔗 Attempting to connect Keystone via ${method}...`);

    // Simulate connection delay for hardware wallet initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (method === 'qr') {
      // Keystone uses QR code for air-gapped transactions
      throw new Error('Keystone QR connection requires camera access and QR scanning implementation. Please ensure camera permissions are granted.');
    } else if (method === 'usb') {
      throw new Error('Keystone is air-gapped and does not support USB connection. Please use QR code method.');
    } else if (method === 'bluetooth') {
      throw new Error('Keystone does not support Bluetooth connection. Please use QR code method.');
    }

    throw new Error(`Unsupported Keystone connection method: ${method}`);
  } catch (error) {
    console.error('Keystone connection error:', error);
    throw error;
  }
};

/**
 * Connect Ellipal hardware wallet
 * @param method Connection method
 * @returns Wallet address
 */
const connectEllipal = async (method: 'usb' | 'bluetooth' | 'qr'): Promise<string> => {
  try {
    console.log(`🔗 Attempting to connect Ellipal via ${method}...`);

    // Simulate connection delay for hardware wallet initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (method === 'qr') {
      // Ellipal uses QR code for air-gapped transactions
      throw new Error('Ellipal QR connection requires camera access and QR scanning implementation. Please ensure camera permissions are granted.');
    } else if (method === 'usb') {
      throw new Error('Ellipal is air-gapped and does not support USB connection. Please use QR code method.');
    } else if (method === 'bluetooth') {
      throw new Error('Ellipal does not support Bluetooth connection. Please use QR code method.');
    }

    throw new Error(`Unsupported Ellipal connection method: ${method}`);
  } catch (error) {
    console.error('Ellipal connection error:', error);
    throw error;
  }
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

/**
 * Check if a hardware wallet is available
 * @param walletId The wallet ID to check
 * @returns Availability status
 */
export const isHardwareWalletAvailable = (walletId: string): boolean => {
  // In a real implementation, this would check for specific hardware wallet availability
  // For now, return true for all supported wallets
  const supportedWallets = ['ledger', 'trezor', 'keepkey', 'safepal', 'keystone', 'ellipal'];
  return supportedWallets.includes(walletId);
};

/**
 * Get hardware wallet security recommendations
 * @param walletId The wallet ID
 * @returns Security recommendations
 */
export const getHardwareWalletSecurityInfo = (walletId: string) => {
  const wallet = HARDWARE_WALLET_OPTIONS.find(w => w.id === walletId);
  if (!wallet) return null;

  return {
    securityLevel: wallet.securityLevel,
    securityFeatures: wallet.securityFeatures,
    price: wallet.price,
    supportedNetworks: wallet.supportedNetworks,
    connectionMethods: wallet.connectionMethods,
    recommendations: getSecurityRecommendations(wallet.securityLevel),
    setupGuide: getSetupGuide(walletId)
  };
};

/**
 * Get security recommendations based on security level
 * @param securityLevel The security level
 * @returns Array of recommendations
 */
const getSecurityRecommendations = (securityLevel: 'high' | 'medium' | 'low'): string[] => {
  switch (securityLevel) {
    case 'high':
      return [
        'Ideal for storing large amounts of cryptocurrency',
        'Keep firmware updated regularly',
        'Store recovery phrase in multiple secure locations',
        'Use strong PIN and enable additional security features'
      ];
    case 'medium':
      return [
        'Suitable for moderate amounts of cryptocurrency',
        'Consider upgrading for larger holdings',
        'Enable all available security features',
        'Regular security audits recommended'
      ];
    case 'low':
      return [
        'Use only for small amounts or testing',
        'Consider upgrading to higher security wallet',
        'Enable maximum security settings',
        'Regular monitoring required'
      ];
    default:
      return [];
  }
};

/**
 * Get setup guide for specific hardware wallet
 * @param walletId The wallet ID
 * @returns Setup guide steps
 */
const getSetupGuide = (walletId: string): string[] => {
  switch (walletId) {
    case 'ledger':
      return [
        'Download Ledger Live from ledger.com',
        'Connect device via USB or Bluetooth',
        'Set up PIN and recovery phrase',
        'Install Ethereum app on device',
        'Enable contract data and blind signing'
      ];
    case 'trezor':
      return [
        'Download Trezor Suite from trezor.io',
        'Connect device via USB',
        'Install Trezor Bridge',
        'Set up PIN and recovery phrase',
        'Enable Ethereum support'
      ];
    case 'safepal':
      return [
        'Download SafePal mobile app',
        'Power on SafePal S1 device',
        'Set up PIN and recovery phrase',
        'Enable QR code communication',
        'Test with small transaction first'
      ];
    default:
      return [
        'Follow manufacturer setup instructions',
        'Set up PIN and recovery phrase',
        'Test connection with small amount',
        'Enable all security features'
      ];
  }
};
