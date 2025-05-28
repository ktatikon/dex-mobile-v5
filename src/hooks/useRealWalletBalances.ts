/**
 * Phase 2: React Hook for Real Wallet Balance Management
 * Replaces mock balances with actual cryptocurrency wallet balances
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Token } from '@/types';
import { 
  walletConnectivityService, 
  WalletBalance, 
  WalletConnection 
} from '@/services/walletConnectivityService';
import { useRealTimeTokens } from './useRealTimeTokens';

interface UseRealWalletBalancesOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  enableMultiWallet?: boolean;
}

interface UseRealWalletBalancesReturn {
  tokens: Token[];
  connectedWallets: WalletConnection[];
  loading: boolean;
  error: Error | null;
  totalPortfolioValue: number;
  connectWallet: (address: string, network?: string, provider?: string) => Promise<void>;
  disconnectWallet: (address: string, network: string) => void;
  refreshBalances: () => Promise<void>;
  isWalletConnected: boolean;
  balanceStatus: {
    lastUpdated: Date | null;
    isRefreshing: boolean;
    failedWallets: string[];
  };
}

/**
 * Hook for managing real wallet balances with automatic price updates
 */
export function useRealWalletBalances(
  options: UseRealWalletBalancesOptions = {}
): UseRealWalletBalancesReturn {
  const {
    autoRefresh = true,
    refreshInterval = 2 * 60 * 1000, // 2 minutes
    enableMultiWallet = true
  } = options;

  // Get real-time price data
  const { 
    tokens: priceTokens, 
    loading: priceLoading, 
    error: priceError 
  } = useRealTimeTokens({
    autoRefresh: true,
    refreshOnMount: true
  });

  // State management
  const [connectedWallets, setConnectedWallets] = useState<WalletConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [failedWallets, setFailedWallets] = useState<string[]>([]);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  /**
   * Merge wallet balances with real-time price data
   */
  const mergeBalancesWithPrices = useCallback((
    walletBalances: WalletBalance[], 
    priceData: Token[]
  ): Token[] => {
    const tokenMap = new Map<string, Token>();

    // Initialize with price data
    priceData.forEach(token => {
      tokenMap.set(token.id, {
        ...token,
        balance: '0' // Default to 0 balance
      });
    });

    // Update with actual wallet balances
    walletBalances.forEach(walletBalance => {
      const existingToken = tokenMap.get(walletBalance.tokenId);
      if (existingToken) {
        // Update existing token with real balance
        const currentPrice = existingToken.price || 0;
        tokenMap.set(walletBalance.tokenId, {
          ...existingToken,
          balance: walletBalance.balance,
          // Update USD value based on current price
          balanceUSD: parseFloat(walletBalance.balance) * currentPrice
        });
      } else {
        // Add new token if not in price data
        tokenMap.set(walletBalance.tokenId, {
          id: walletBalance.tokenId,
          symbol: walletBalance.symbol,
          name: walletBalance.symbol, // Fallback to symbol
          logo: `/crypto-icons/${walletBalance.symbol.toLowerCase()}.svg`,
          decimals: 18, // Default decimals
          balance: walletBalance.balance,
          price: 0, // Will be updated when price data is available
          priceChange24h: 0,
          balanceUSD: walletBalance.balanceUSD
        });
      }
    });

    return Array.from(tokenMap.values()).filter(token => 
      parseFloat(token.balance || '0') > 0
    );
  }, []);

  /**
   * Calculate total portfolio value
   */
  const calculatePortfolioValue = useCallback((tokens: Token[]): number => {
    return tokens.reduce((total, token) => {
      const balance = parseFloat(token.balance || '0');
      const price = token.price || 0;
      return total + (balance * price);
    }, 0);
  }, []);

  /**
   * Connect to a wallet
   */
  const connectWallet = useCallback(async (
    address: string, 
    network: string = 'ethereum', 
    provider: string = 'metamask'
  ) => {
    if (!isMounted.current) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`Connecting wallet: ${address} on ${network}`);
      
      // Check if wallet is already connected
      const existingWallet = connectedWallets.find(
        w => w.address === address && w.network === network
      );
      
      if (existingWallet) {
        console.log('Wallet already connected');
        setLoading(false);
        return;
      }

      // Connect to the wallet
      const walletConnection = await walletConnectivityService.connectWallet(
        address, 
        network, 
        provider
      );

      // Update connected wallets
      setConnectedWallets(prev => {
        if (enableMultiWallet) {
          return [...prev, walletConnection];
        } else {
          return [walletConnection]; // Replace existing wallet
        }
      });

      setLastUpdated(new Date());
      console.log(`Successfully connected wallet with ${walletConnection.balances.length} balances`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(new Error(errorMessage));
      console.error('Error connecting wallet:', err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [connectedWallets, enableMultiWallet]);

  /**
   * Disconnect a wallet
   */
  const disconnectWallet = useCallback((address: string, network: string) => {
    console.log(`Disconnecting wallet: ${address} on ${network}`);
    
    // Remove from connected wallets
    setConnectedWallets(prev => 
      prev.filter(w => !(w.address === address && w.network === network))
    );

    // Disconnect from service
    walletConnectivityService.disconnectWallet(address, network);

    // Remove from failed wallets if present
    setFailedWallets(prev => 
      prev.filter(w => w !== `${address}_${network}`)
    );
  }, []);

  /**
   * Refresh balances for all connected wallets
   */
  const refreshBalances = useCallback(async () => {
    if (!isMounted.current || connectedWallets.length === 0) return;

    setIsRefreshing(true);
    setError(null);
    const newFailedWallets: string[] = [];

    try {
      const updatedWallets: WalletConnection[] = [];

      for (const wallet of connectedWallets) {
        try {
          console.log(`Refreshing balances for ${wallet.address} on ${wallet.network}`);
          
          const balances = await walletConnectivityService.fetchWalletBalances(
            wallet.address, 
            wallet.network
          );

          updatedWallets.push({
            ...wallet,
            balances
          });

        } catch (error) {
          console.error(`Failed to refresh balances for ${wallet.address}:`, error);
          newFailedWallets.push(`${wallet.address}_${wallet.network}`);
          
          // Keep the old wallet data
          updatedWallets.push(wallet);
        }
      }

      setConnectedWallets(updatedWallets);
      setFailedWallets(newFailedWallets);
      setLastUpdated(new Date());

      console.log(`Refreshed balances for ${updatedWallets.length} wallets`);
      
    } catch (error) {
      console.error('Error refreshing wallet balances:', error);
      setError(error instanceof Error ? error : new Error('Failed to refresh balances'));
    } finally {
      if (isMounted.current) {
        setIsRefreshing(false);
      }
    }
  }, [connectedWallets]);

  /**
   * Setup automatic refresh
   */
  useEffect(() => {
    if (!autoRefresh || connectedWallets.length === 0) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    console.log(`Setting up auto-refresh every ${refreshInterval / 1000} seconds`);
    
    refreshIntervalRef.current = setInterval(() => {
      refreshBalances();
    }, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, connectedWallets.length, refreshBalances]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Merge wallet balances with price data
  const tokens = mergeBalancesWithPrices(
    connectedWallets.flatMap(wallet => wallet.balances),
    priceTokens
  );

  // Calculate total portfolio value
  const totalPortfolioValue = calculatePortfolioValue(tokens);

  // Determine if any wallet is connected
  const isWalletConnected = connectedWallets.length > 0;

  // Combine loading states
  const combinedLoading = loading || priceLoading;

  // Combine errors
  const combinedError = error || priceError;

  return {
    tokens,
    connectedWallets,
    loading: combinedLoading,
    error: combinedError,
    totalPortfolioValue,
    connectWallet,
    disconnectWallet,
    refreshBalances,
    isWalletConnected,
    balanceStatus: {
      lastUpdated,
      isRefreshing,
      failedWallets
    }
  };
}

/**
 * Hook for getting balances for a specific wallet
 */
export function useWalletBalance(address: string, network: string = 'ethereum') {
  const { connectedWallets, loading, error } = useRealWalletBalances();
  
  const wallet = connectedWallets.find(
    w => w.address === address && w.network === network
  );

  return {
    wallet,
    balances: wallet?.balances || [],
    isConnected: !!wallet,
    loading,
    error
  };
}

export default useRealWalletBalances;
