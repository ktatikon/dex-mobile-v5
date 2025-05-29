import { supabase } from '@/integrations/supabase/client';
import { saveHotWalletConnection } from '@/services/walletConnectionService';

export interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  isPopular?: boolean;
  downloadUrl?: string;
}

// Enhanced Hot Wallet Options with Risk Assessment
export interface EnhancedWalletOption extends WalletOption {
  riskLevel: 'low' | 'medium' | 'high';
  securityFeatures: string[];
  supportedNetworks: string[];
  permissions: string[];
  connectionMethod: 'extension' | 'mobile' | 'walletconnect' | 'qr';
  marketShare: number; // percentage
  lastAudit?: string;
}

export const HOT_WALLET_OPTIONS: EnhancedWalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '/wallet-icons/metamask.svg',
    description: 'Most popular Ethereum wallet with browser extension',
    isPopular: true,
    downloadUrl: 'https://metamask.io/download/',
    riskLevel: 'low',
    securityFeatures: ['Hardware wallet support', 'Phishing protection', 'Transaction simulation'],
    supportedNetworks: ['Ethereum', 'Polygon', 'BSC', 'Arbitrum', 'Optimism', 'Avalanche'],
    permissions: ['View account addresses', 'Request transaction approval', 'Suggest transactions'],
    connectionMethod: 'extension',
    marketShare: 65.2,
    lastAudit: '2024-01-15'
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: '/wallet-icons/trust.svg',
    description: 'Multi-chain mobile wallet with WalletConnect support',
    isPopular: true,
    downloadUrl: 'https://trustwallet.com/',
    riskLevel: 'low',
    securityFeatures: ['Biometric authentication', 'Secure enclave', 'DApp browser protection'],
    supportedNetworks: ['Ethereum', 'BSC', 'Polygon', 'Solana', 'Cosmos', 'Tron'],
    permissions: ['View account addresses', 'Request transaction approval', 'Access enabled networks'],
    connectionMethod: 'walletconnect',
    marketShare: 18.7,
    lastAudit: '2024-02-10'
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '/wallet-icons/coinbase.svg',
    description: 'Self-custody wallet by Coinbase with institutional security',
    isPopular: true,
    downloadUrl: 'https://wallet.coinbase.com/',
    riskLevel: 'low',
    securityFeatures: ['Cloud backup', 'Biometric unlock', 'Multi-factor authentication'],
    supportedNetworks: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Base'],
    permissions: ['View account addresses', 'Request transaction approval', 'Suggest transactions'],
    connectionMethod: 'extension',
    marketShare: 8.9,
    lastAudit: '2024-01-28'
  },
  {
    id: 'phantom',
    name: 'Phantom',
    icon: '/wallet-icons/phantom.svg',
    description: 'Leading Solana wallet with multi-chain support',
    isPopular: false,
    downloadUrl: 'https://phantom.app/',
    riskLevel: 'medium',
    securityFeatures: ['Hardware wallet support', 'Transaction simulation', 'Spam protection'],
    supportedNetworks: ['Solana', 'Ethereum', 'Polygon'],
    permissions: ['View account addresses', 'Request transaction approval', 'Access Solana programs'],
    connectionMethod: 'extension',
    marketShare: 4.1,
    lastAudit: '2024-02-05'
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    icon: '/wallet-icons/rainbow.svg',
    description: 'Ethereum wallet focused on DeFi and NFTs',
    isPopular: false,
    downloadUrl: 'https://rainbow.me/',
    riskLevel: 'medium',
    securityFeatures: ['Face ID/Touch ID', 'iCloud backup', 'Transaction previews'],
    supportedNetworks: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Base'],
    permissions: ['View account addresses', 'Request transaction approval', 'Access enabled networks'],
    connectionMethod: 'walletconnect',
    marketShare: 2.3,
    lastAudit: '2024-01-20'
  },
  {
    id: 'argent',
    name: 'Argent',
    icon: '/wallet-icons/argent.svg',
    description: 'Smart contract wallet with social recovery',
    isPopular: false,
    downloadUrl: 'https://argent.xyz/',
    riskLevel: 'medium',
    securityFeatures: ['Social recovery', 'Guardians system', 'Daily limits'],
    supportedNetworks: ['Ethereum', 'Arbitrum', 'Starknet'],
    permissions: ['View account addresses', 'Request transaction approval', 'Guardian management'],
    connectionMethod: 'walletconnect',
    marketShare: 0.8,
    lastAudit: '2024-02-01'
  }
];

/**
 * Connect a hot wallet for a user
 * @param userId The user's ID
 * @param wallet The wallet option to connect
 * @returns Connection result
 */
export const connectHotWallet = async (
  userId: string,
  wallet: WalletOption
): Promise<{ success: boolean; address?: string; error?: string }> => {
  try {
    // Check if user is authenticated
    if (!userId) {
      return {
        success: false,
        error: 'User authentication required'
      };
    }

    let address: string;

    // Handle different wallet connection methods
    switch (wallet.id) {
      case 'metamask':
        address = await connectMetaMask();
        break;
      case 'trust':
        address = await connectTrustWallet();
        break;
      case 'coinbase':
        address = await connectCoinbaseWallet();
        break;
      case 'phantom':
        address = await connectPhantom();
        break;
      case 'walletconnect':
        address = await connectWalletConnect();
        break;
      case 'rainbow':
        address = await connectRainbow();
        break;
      default:
        throw new Error(`Unsupported wallet type: ${wallet.id}. Please use a supported wallet provider.`);
    }

    // Save the wallet connection to Supabase
    const connection = await saveHotWalletConnection(userId, wallet, address);

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
    console.error('Error connecting hot wallet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Connect MetaMask wallet with proper detection and redirect flow
 * @returns Wallet address
 */
const connectMetaMask = async (): Promise<string> => {
  // Check if MetaMask is installed
  if (typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask) {
    try {
      console.log('🦊 MetaMask detected, requesting account access...');

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts && accounts.length > 0) {
        console.log('✅ MetaMask connected successfully');
        return accounts[0];
      } else {
        throw new Error('No accounts found. Please unlock MetaMask and try again.');
      }
    } catch (error: any) {
      console.error('MetaMask connection error:', error);

      // Handle specific MetaMask errors
      if (error.code === 4001) {
        throw new Error('Connection rejected by user. Please approve the connection request in MetaMask.');
      } else if (error.code === -32002) {
        throw new Error('Connection request already pending. Please check MetaMask.');
      } else {
        throw new Error(`MetaMask connection failed: ${error.message}`);
      }
    }
  }

  // MetaMask not detected - redirect to download page
  console.log('🦊 MetaMask not detected, redirecting to download page...');
  const downloadUrl = 'https://metamask.io/download/';

  // Open download page in new tab
  if (typeof window !== 'undefined') {
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  }

  throw new Error('MetaMask extension not found. Please install MetaMask from the opened page and refresh this application.');
};

/**
 * Connect Trust Wallet with proper detection and redirect flow
 * @returns Wallet address
 */
const connectTrustWallet = async (): Promise<string> => {
  // Check if Trust Wallet is available
  if (typeof window !== 'undefined' && window.ethereum && (window.ethereum as any).isTrust) {
    try {
      console.log('🛡️ Trust Wallet detected, requesting account access...');

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts && accounts.length > 0) {
        console.log('✅ Trust Wallet connected successfully');
        return accounts[0];
      } else {
        throw new Error('No accounts found. Please unlock Trust Wallet and try again.');
      }
    } catch (error: any) {
      console.error('Trust Wallet connection error:', error);

      // Handle specific Trust Wallet errors
      if (error.code === 4001) {
        throw new Error('Connection rejected by user. Please approve the connection request in Trust Wallet.');
      } else {
        throw new Error(`Trust Wallet connection failed: ${error.message}`);
      }
    }
  }

  // Trust Wallet not detected - redirect to download page
  console.log('🛡️ Trust Wallet not detected, redirecting to download page...');
  const downloadUrl = 'https://trustwallet.com/download';

  // Open download page in new tab
  if (typeof window !== 'undefined') {
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  }

  throw new Error('Trust Wallet not found. Please install Trust Wallet from the opened page and refresh this application.');
};

/**
 * Connect Coinbase Wallet with proper detection and redirect flow
 * @returns Wallet address
 */
const connectCoinbaseWallet = async (): Promise<string> => {
  // Check if Coinbase Wallet is available
  if (typeof window !== 'undefined' && window.ethereum && (window.ethereum as any).isCoinbaseWallet) {
    try {
      console.log('🔵 Coinbase Wallet detected, requesting account access...');

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts && accounts.length > 0) {
        console.log('✅ Coinbase Wallet connected successfully');
        return accounts[0];
      } else {
        throw new Error('No accounts found. Please unlock Coinbase Wallet and try again.');
      }
    } catch (error: any) {
      console.error('Coinbase Wallet connection error:', error);

      // Handle specific Coinbase Wallet errors
      if (error.code === 4001) {
        throw new Error('Connection rejected by user. Please approve the connection request in Coinbase Wallet.');
      } else {
        throw new Error(`Coinbase Wallet connection failed: ${error.message}`);
      }
    }
  }

  // Coinbase Wallet not detected - redirect to download page
  console.log('🔵 Coinbase Wallet not detected, redirecting to download page...');
  const downloadUrl = 'https://www.coinbase.com/wallet/downloads';

  // Open download page in new tab
  if (typeof window !== 'undefined') {
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  }

  throw new Error('Coinbase Wallet not found. Please install Coinbase Wallet from the opened page and refresh this application.');
};

/**
 * Connect Phantom wallet (Solana) with proper detection and redirect flow
 * @returns Wallet address
 */
const connectPhantom = async (): Promise<string> => {
  // Check if Phantom is installed
  if (typeof window !== 'undefined' && window.solana && window.solana.isPhantom) {
    try {
      console.log('👻 Phantom detected, requesting connection...');

      const response = await window.solana.connect();

      if (response && response.publicKey) {
        console.log('✅ Phantom connected successfully');
        return response.publicKey.toString();
      } else {
        throw new Error('No public key received from Phantom wallet.');
      }
    } catch (error: any) {
      console.error('Phantom connection error:', error);

      // Handle specific Phantom errors
      if (error.code === 4001) {
        throw new Error('Connection rejected by user. Please approve the connection request in Phantom.');
      } else if (error.message?.includes('User rejected')) {
        throw new Error('Connection rejected by user. Please approve the connection request in Phantom.');
      } else {
        throw new Error(`Phantom connection failed: ${error.message}`);
      }
    }
  }

  // Phantom not detected - redirect to download page
  console.log('👻 Phantom not detected, redirecting to download page...');
  const downloadUrl = 'https://phantom.app/download';

  // Open download page in new tab
  if (typeof window !== 'undefined') {
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  }

  throw new Error('Phantom wallet not found. Please install Phantom from the opened page and refresh this application.');
};

/**
 * Connect via WalletConnect
 * @returns Wallet address
 */
const connectWalletConnect = async (): Promise<string> => {
  try {
    // Check if WalletConnect is available
    if (typeof window !== 'undefined' && window.ethereum) {
      // Try to connect using WalletConnect provider
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts && accounts.length > 0) {
        return accounts[0];
      }
    }

    throw new Error('WalletConnect not available. Please install a WalletConnect compatible wallet.');
  } catch (error) {
    console.error('WalletConnect connection error:', error);
    throw new Error('Failed to connect via WalletConnect');
  }
};

/**
 * Connect Rainbow wallet
 * @returns Wallet address
 */
const connectRainbow = async (): Promise<string> => {
  try {
    // Check if Rainbow wallet is available
    if (typeof window !== 'undefined' && window.ethereum && window.ethereum.isRainbow) {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts && accounts.length > 0) {
        return accounts[0];
      }
    }

    throw new Error('Rainbow wallet not detected. Please install Rainbow wallet extension.');
  } catch (error) {
    console.error('Rainbow wallet connection error:', error);
    throw new Error('Failed to connect to Rainbow wallet');
  }
};

/**
 * Get connected hot wallets for a user
 * @param userId The user's ID
 * @returns Array of connected hot wallets
 */
export const getConnectedHotWallets = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('wallet_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('wallet_type', 'hot')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching hot wallets:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getConnectedHotWallets:', error);
    return [];
  }
};

/**
 * Disconnect a hot wallet
 * @param userId The user's ID
 * @param walletId The wallet connection ID
 * @returns Success status
 */
export const disconnectHotWallet = async (userId: string, walletId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('wallet_connections')
      .delete()
      .eq('id', walletId)
      .eq('user_id', userId)
      .eq('wallet_type', 'hot');

    if (error) {
      console.error('Error disconnecting hot wallet:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in disconnectHotWallet:', error);
    return false;
  }
};

/**
 * Check if a specific wallet type is available
 * @param walletId The wallet ID to check
 * @returns Availability status
 */
export const isWalletAvailable = (walletId: string): boolean => {
  if (typeof window === 'undefined') return false;

  switch (walletId) {
    case 'metamask':
      return !!(window.ethereum && window.ethereum.isMetaMask);
    case 'phantom':
      return !!(window.solana && window.solana.isPhantom);
    case 'coinbase':
      return !!(window.ethereum && window.ethereum.isCoinbaseWallet);
    case 'trust':
      return !!(window.ethereum && window.ethereum.isTrust);
    case 'rainbow':
      return !!(window.ethereum && window.ethereum.isRainbow);
    default:
      return true; // Assume other wallets are available via WalletConnect
  }
};

/**
 * Get risk assessment for a wallet
 * @param walletId The wallet ID
 * @returns Risk assessment information
 */
export const getWalletRiskAssessment = (walletId: string) => {
  const wallet = HOT_WALLET_OPTIONS.find(w => w.id === walletId);
  if (!wallet) return null;

  return {
    riskLevel: wallet.riskLevel,
    securityFeatures: wallet.securityFeatures,
    marketShare: wallet.marketShare,
    lastAudit: wallet.lastAudit,
    recommendations: getRiskRecommendations(wallet.riskLevel),
    supportedNetworks: wallet.supportedNetworks
  };
};

/**
 * Get risk recommendations based on risk level
 * @param riskLevel The risk level
 * @returns Array of recommendations
 */
const getRiskRecommendations = (riskLevel: 'low' | 'medium' | 'high'): string[] => {
  switch (riskLevel) {
    case 'low':
      return [
        'Enable hardware wallet integration if available',
        'Keep browser and wallet extension updated',
        'Use strong, unique passwords'
      ];
    case 'medium':
      return [
        'Consider using for smaller amounts only',
        'Enable all available security features',
        'Regularly review connected dApps',
        'Use hardware wallet for large amounts'
      ];
    case 'high':
      return [
        'Use only for testing or small amounts',
        'Never store large amounts',
        'Consider alternative wallet solutions',
        'Enable maximum security settings'
      ];
    default:
      return [];
  }
};

/**
 * Import wallet addresses and balances
 * @param userId The user ID
 * @param walletId The wallet ID
 * @param addresses Array of addresses to import
 * @returns Import result
 */
export const importWalletAddresses = async (
  userId: string,
  walletId: string,
  addresses: string[]
): Promise<{ success: boolean; imported: number; error?: string }> => {
  try {
    let imported = 0;

    for (const address of addresses) {
      // Save each address as a separate wallet connection
      const wallet = HOT_WALLET_OPTIONS.find(w => w.id === walletId);
      if (wallet) {
        const connection = await saveHotWalletConnection(userId, wallet, address);
        if (connection) {
          imported++;
        }
      }
    }

    return {
      success: true,
      imported
    };
  } catch (error) {
    console.error('Error importing wallet addresses:', error);
    return {
      success: false,
      imported: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Extend window interface for wallet detection
declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
  }
}
