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

export const HOT_WALLET_OPTIONS: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '/wallet-icons/metamask.svg',
    description: 'Connect using browser extension',
    isPopular: true,
    downloadUrl: 'https://metamask.io/download/'
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: '/wallet-icons/trust.svg',
    description: 'Connect using WalletConnect',
    isPopular: true,
    downloadUrl: 'https://trustwallet.com/'
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '/wallet-icons/coinbase.svg',
    description: 'Connect using browser extension',
    isPopular: true,
    downloadUrl: 'https://wallet.coinbase.com/'
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '/wallet-icons/walletconnect.svg',
    description: 'Scan with WalletConnect to connect',
    downloadUrl: 'https://walletconnect.com/'
  },
  {
    id: 'phantom',
    name: 'Phantom',
    icon: '/wallet-icons/phantom.svg',
    description: 'Solana wallet extension',
    downloadUrl: 'https://phantom.app/'
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    icon: '/wallet-icons/rainbow.svg',
    description: 'Connect using mobile app',
    downloadUrl: 'https://rainbow.me/'
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
        // For demonstration, generate a random address
        address = `0x${Math.random().toString(16).substring(2, 42)}`;
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
 * Connect MetaMask wallet
 * @returns Wallet address
 */
const connectMetaMask = async (): Promise<string> => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      if (accounts && accounts.length > 0) {
        return accounts[0];
      }
    } catch (error) {
      console.error('MetaMask connection error:', error);
      throw new Error('Failed to connect to MetaMask');
    }
  }
  
  // Fallback for demo purposes
  throw new Error('MetaMask not detected. Please install MetaMask extension.');
};

/**
 * Connect Trust Wallet via WalletConnect
 * @returns Wallet address
 */
const connectTrustWallet = async (): Promise<string> => {
  // In a real implementation, this would use WalletConnect SDK
  // For demonstration, return a mock address
  return `0x${Math.random().toString(16).substring(2, 42)}`;
};

/**
 * Connect Coinbase Wallet
 * @returns Wallet address
 */
const connectCoinbaseWallet = async (): Promise<string> => {
  // In a real implementation, this would use Coinbase Wallet SDK
  // For demonstration, return a mock address
  return `0x${Math.random().toString(16).substring(2, 42)}`;
};

/**
 * Connect Phantom wallet (Solana)
 * @returns Wallet address
 */
const connectPhantom = async (): Promise<string> => {
  if (typeof window !== 'undefined' && window.solana && window.solana.isPhantom) {
    try {
      const response = await window.solana.connect();
      return response.publicKey.toString();
    } catch (error) {
      console.error('Phantom connection error:', error);
      throw new Error('Failed to connect to Phantom');
    }
  }
  
  throw new Error('Phantom wallet not detected. Please install Phantom extension.');
};

/**
 * Connect via WalletConnect
 * @returns Wallet address
 */
const connectWalletConnect = async (): Promise<string> => {
  // In a real implementation, this would use WalletConnect SDK
  // For demonstration, return a mock address
  return `0x${Math.random().toString(16).substring(2, 42)}`;
};

/**
 * Connect Rainbow wallet
 * @returns Wallet address
 */
const connectRainbow = async (): Promise<string> => {
  // In a real implementation, this would use Rainbow's connection method
  // For demonstration, return a mock address
  return `0x${Math.random().toString(16).substring(2, 42)}`;
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
    default:
      return true; // Assume other wallets are available via WalletConnect
  }
};

// Extend window interface for wallet detection
declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
  }
}
