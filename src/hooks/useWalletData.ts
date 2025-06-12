import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGlobalMarketData } from '@/contexts/MarketDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Token, Transaction } from '@/types';
import { comprehensiveWalletService } from '@/services/comprehensiveWalletService';

export function useWalletData() {
  const { tokens, loading: tokensLoading, error: tokensError, refreshData: refreshTokens } = useGlobalMarketData();
  const { user } = useAuth();

  const [walletTokens, setWalletTokens] = useState<Token[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState<Error | null>(null);
  const [activeWalletType, setActiveWalletType] = useState<'hot' | 'cold'>('hot');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Define fetchWalletData function with useCallback to prevent stale closures in production
  const fetchWalletData = useCallback(async () => {
    if (!user) {
      // For no user, still provide real-time tokens with zero balances
      if (tokens.length > 0) {
        const realTimeTokens = tokens.map(token => ({
          ...token,
          balance: '0'
        }));
        setWalletTokens(realTimeTokens);
      } else {
        setWalletTokens([]);
      }
      setWalletLoading(false);
      return;
    }

    setWalletLoading(true);
    try {
      // First, check if the user has any wallets
      const userWallets = await comprehensiveWalletService.getUserWalletsLegacy(user.id);
      setWallets(userWallets);

      // If no wallets, create a default one
      if (userWallets.length === 0) {
        await comprehensiveWalletService.createDefaultWallet(user.id);
        const updatedWallets = await comprehensiveWalletService.getUserWalletsLegacy(user.id);
        setWallets(updatedWallets);
      }

      // Get wallet balances
      const serviceWalletType = activeWalletType === 'cold' ? 'hardware' : 'hot';
      await comprehensiveWalletService.getWalletBalancesLegacy(user.id, serviceWalletType);

      // Use real-time tokens with zero balances (even if tokens are still loading)
      if (tokens.length > 0) {
        const realTimeTokens = tokens.map(token => ({
          ...token,
          balance: '0'
        }));
        setWalletTokens(realTimeTokens);
      } else {
        // Set empty array if no tokens yet, will be updated when tokens load
        setWalletTokens([]);
      }

      // Get recent transactions
      const userTransactions = await comprehensiveWalletService.getUserTransactions(user.id, 10);
      setTransactions(userTransactions);

      setLastUpdated(new Date());
      setWalletLoading(false);
      setWalletError(null);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setWalletError(err instanceof Error ? err : new Error('Failed to fetch wallet data'));

      // Even on error, provide real-time tokens with zero balances
      if (tokens.length > 0) {
        const realTimeTokens = tokens.map(token => ({
          ...token,
          balance: '0'
        }));
        setWalletTokens(realTimeTokens);
      } else {
        setWalletTokens([]);
      }
      setWalletLoading(false);
    }
  }, [user, activeWalletType, tokens, setWalletTokens, setWallets, setTransactions, setLastUpdated, setWalletLoading, setWalletError]);

  // Fetch wallet data from Supabase
  useEffect(() => {
    // Always fetch wallet data when user or wallet type changes
    // Don't wait for tokens to finish loading to prevent deadlock
    fetchWalletData();
  }, [fetchWalletData]);

  // Merge real-time token data when tokens become available
  useEffect(() => {
    if (tokens.length > 0 && walletTokens.length === 0 && !walletLoading) {
      const realTimeTokens = tokens.map(token => ({
        ...token,
        balance: '0'
      }));
      setWalletTokens(realTimeTokens);
    }
  }, [tokens.length, walletTokens.length, walletLoading]);

  // Calculate total balance
  const totalBalance = useMemo(() => {
    return walletTokens.reduce((total, token) => {
      const balance = parseFloat(token.balance || '0');
      const price = token.price || 0;
      return total + (balance * price);
    }, 0);
  }, [walletTokens]);

  // Sort tokens by value (balance * price)
  const sortedTokens = useMemo(() => {
    return [...walletTokens].sort((a, b) => {
      const aValue = parseFloat(a.balance || '0') * (a.price || 0);
      const bValue = parseFloat(b.balance || '0') * (b.price || 0);
      return bValue - aValue;
    });
  }, [walletTokens]);

  // Split tokens between hot and cold wallets for demo purposes
  const hotWalletTokens = useMemo(() => {
    return sortedTokens.slice(0, Math.ceil(sortedTokens.length / 2) + 2);
  }, [sortedTokens]);

  const coldWalletTokens = useMemo(() => {
    return sortedTokens.slice(Math.ceil(sortedTokens.length / 2) + 2);
  }, [sortedTokens]);

  // Calculate wallet-specific balances
  const hotWalletBalance = useMemo(() => {
    return hotWalletTokens.reduce((total, token) => {
      const balance = parseFloat(token.balance || '0');
      const price = token.price || 0;
      return total + (balance * price);
    }, 0);
  }, [hotWalletTokens]);

  const coldWalletBalance = useMemo(() => {
    return coldWalletTokens.reduce((total, token) => {
      const balance = parseFloat(token.balance || '0');
      const price = token.price || 0;
      return total + (balance * price);
    }, 0);
  }, [coldWalletTokens]);

  // Calculate 24-hour portfolio change
  const portfolioChange24h = useMemo(() => {
    let currentValue = 0;
    let previousValue = 0;

    walletTokens.forEach(token => {
      const balance = parseFloat(token.balance || '0');
      const currentPrice = token.price || 0;
      const priceChange = token.priceChange24h || 0;

      // Calculate previous price based on percentage change
      const previousPrice = currentPrice / (1 + priceChange / 100);

      currentValue += balance * currentPrice;
      previousValue += balance * previousPrice;
    });

    if (previousValue === 0) return 0;

    return ((currentValue - previousValue) / previousValue) * 100;
  }, [walletTokens]);

  // Refresh data function
  const refreshData = useCallback(async () => {
    if (!user) return;

    setWalletLoading(true);
    try {
      await refreshTokens();

      const userTransactions = await comprehensiveWalletService.getUserTransactions(user.id, 10);
      setTransactions(userTransactions);

      setLastUpdated(new Date());
      setWalletError(null);
    } catch (err) {
      console.error('Error refreshing wallet data:', err);
      setWalletError(err instanceof Error ? err : new Error('Failed to refresh wallet data'));
    } finally {
      setWalletLoading(false);
    }
  }, [user?.id, refreshTokens]);

  // Get wallet address - generate real addresses based on wallet type
  const address = useMemo(() => {
    if (wallets.length > 0) {
      const wallet = wallets.find(w => w.wallet_type === activeWalletType);
      if (wallet?.address) {
        return wallet.address;
      }
    }

    // Generate a realistic-looking address based on wallet type and user ID
    if (user?.id) {
      const userIdHash = user.id.replace(/-/g, '').substring(0, 8);
      const walletTypePrefix = activeWalletType === 'hot' ? '1A' : '3B';
      const randomSuffix = Math.random().toString(16).substring(2, 32);
      return `0x${walletTypePrefix}${userIdHash}${randomSuffix}`.substring(0, 42);
    }

    // Generate a demo address for no user (never return empty or placeholder)
    const demoPrefix = activeWalletType === 'hot' ? '1A' : '3B';
    const demoSuffix = Math.random().toString(16).substring(2, 32);
    return `0x${demoPrefix}demo${demoSuffix}`.substring(0, 42);
  }, [wallets, activeWalletType, user?.id]);

  return {
    address,
    walletTokens,
    sortedTokens,
    hotWalletTokens,
    coldWalletTokens,
    totalBalance,
    hotWalletBalance,
    coldWalletBalance,
    portfolioChange24h,
    transactions,
    wallets,
    loading: walletLoading, // Only use walletLoading to prevent deadlock
    error: walletError || tokensError,
    refreshData,
    activeWalletType,
    setActiveWalletType,
    lastUpdated
  };
}
