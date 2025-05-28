import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGlobalMarketData } from '@/contexts/MarketDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Token, Transaction } from '@/types';
import { getWalletBalances, getUserTransactions, getUserWallets, createDefaultWallet } from '@/services/walletService';
import { mockWallet } from '@/services/fallbackDataService';

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

  // Fetch wallet data from Supabase
  useEffect(() => {
    async function fetchWalletData() {
      if (!user) {
        setWalletTokens([]);
        setWalletLoading(false);
        return;
      }

      setWalletLoading(true);
      try {
        // First, check if the user has any wallets
        const userWallets = await getUserWallets(user.id);
        setWallets(userWallets);

        // If no wallets, create a default one
        if (userWallets.length === 0) {
          await createDefaultWallet(user.id);
          const updatedWallets = await getUserWallets(user.id);
          setWallets(updatedWallets);
        }

        // Get wallet balances
        const balances = await getWalletBalances(user.id, activeWalletType);

        // If we have real-time token data, merge it with the balances
        if (tokens.length > 0) {
          const updatedBalances = balances.map(balance => {
            const token = tokens.find(t => t.id === balance.id);
            if (token) {
              return {
                ...balance,
                price: token.price,
                priceChange24h: token.priceChange24h
              };
            }
            return balance;
          });
          setWalletTokens(updatedBalances);
        } else {
          setWalletTokens(balances);
        }

        // Get recent transactions
        const userTransactions = await getUserTransactions(user.id, 10);
        setTransactions(userTransactions);

        setLastUpdated(new Date());
        setWalletLoading(false);
        setWalletError(null);
      } catch (err) {
        console.error('Error fetching wallet data:', err);
        setWalletError(err instanceof Error ? err : new Error('Failed to fetch wallet data'));

        // If there's an error or no data, use mock data for demo purposes
        if (tokensLoading || tokens.length === 0) {
          setWalletTokens([]);
        } else {
          // Use mock data as fallback
          const { tokens: mockTokens } = mockWallet;

          // Create a map of token IDs to balances from mock data
          const balanceMap = new Map<string, string>();
          mockTokens.forEach(token => {
            balanceMap.set(token.id, token.balance || '0');
          });

          // Merge real-time token data with mock balances
          const mergedTokens = tokens.map(token => {
            const balance = balanceMap.get(token.id) || '0';
            return {
              ...token,
              balance
            };
          });

          setWalletTokens(mergedTokens);
        }

        setWalletLoading(false);
      }
    }

    fetchWalletData();
  }, [user, tokens, tokensLoading, activeWalletType]);

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

  // Refresh data
  const refreshData = useCallback(async () => {
    if (!user) return;

    setWalletLoading(true);
    try {
      // Refresh tokens first
      await refreshTokens();

      // Then refresh wallet data
      const balances = await getWalletBalances(user.id, activeWalletType);

      // Merge with real-time token data
      const updatedBalances = balances.map(balance => {
        const token = tokens.find(t => t.id === balance.id);
        if (token) {
          return {
            ...balance,
            price: token.price,
            priceChange24h: token.priceChange24h
          };
        }
        return balance;
      });

      setWalletTokens(updatedBalances);

      // Refresh transactions
      const userTransactions = await getUserTransactions(user.id, 10);
      setTransactions(userTransactions);

      setLastUpdated(new Date());
      setWalletError(null);
    } catch (err) {
      console.error('Error refreshing wallet data:', err);
      setWalletError(err instanceof Error ? err : new Error('Failed to refresh wallet data'));
    } finally {
      setWalletLoading(false);
    }
  }, [user, refreshTokens, tokens, activeWalletType]);

  // Get wallet address
  const address = useMemo(() => {
    if (wallets.length > 0) {
      const wallet = wallets.find(w => w.wallet_type === activeWalletType);
      return wallet?.address || mockWallet.address;
    }
    return mockWallet.address;
  }, [wallets, activeWalletType]);

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
    loading: walletLoading,
    error: walletError,
    refreshData,
    activeWalletType,
    setActiveWalletType,
    lastUpdated
  };
}
