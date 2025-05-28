
import React, { useMemo, useEffect, useState } from 'react';
import PortfolioCard from '@/components/PortfolioCard';
import TokenListItem from '@/components/TokenListItem';
import { formatCurrency } from '@/services/realTimeData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useGlobalMarketData } from '@/contexts/MarketDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRealTimeTokens } from '@/hooks/useRealTimeTokens';
import EmptyStateCard from '@/components/EmptyStateCard';
import { RefreshCw, TrendingUp, Wallet, Clock } from 'lucide-react';
import { getUserTransactions } from '@/services/walletService';
import { getPortfolioHoldings } from '@/services/portfolioService';
import { Token, Transaction } from '@/types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Use real-time token data with automatic updates
  const {
    tokens: realTimeTokens,
    loading: realTimeLoading,
    error: realTimeError,
    lastUpdated,
    isStale,
    refreshData: refreshRealTimeData,
    status
  } = useRealTimeTokens({
    autoRefresh: true,
    refreshOnMount: true,
    sortBy: 'marketCap',
    sortOrder: 'desc'
  });

  // Fallback to global market data if needed
  const {
    tokens: fallbackTokens,
    sortedByMarketCap,
    sortedByPriceChange,
    loading: fallbackLoading,
    error: fallbackError,
    refreshData: refreshFallbackData
  } = useGlobalMarketData();

  const [userTokens, setUserTokens] = useState<Token[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<Error | null>(null);

  // Use real-time data if available, otherwise fallback
  const tokens = realTimeTokens.length > 0 ? realTimeTokens : fallbackTokens;
  const loading = realTimeLoading || fallbackLoading;
  const error = realTimeError || fallbackError;

  // Fetch user data from Supabase
  useEffect(() => {
    async function fetchUserData() {
      if (!user) {
        setUserTokens([]);
        setRecentTransactions([]);
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      try {
        // Get portfolio holdings
        const holdings = await getPortfolioHoldings(user.id);

        // If we have real-time token data, merge it with the holdings
        if (tokens.length > 0) {
          const updatedHoldings = holdings.map(holding => {
            const token = tokens.find(t => t.id === holding.id);
            if (token) {
              return {
                ...holding,
                price: token.price,
                priceChange24h: token.priceChange24h
              };
            }
            return holding;
          });
          setUserTokens(updatedHoldings);
        } else {
          setUserTokens(holdings);
        }

        // Get recent transactions
        const transactions = await getUserTransactions(user.id, 5);
        setRecentTransactions(transactions);

        setDataLoading(false);
        setDataError(null);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setDataError(err instanceof Error ? err : new Error('Failed to fetch user data'));
        setUserTokens([]);
        setRecentTransactions([]);
        setDataLoading(false);
      }
    }

    fetchUserData();
  }, [user, tokens]);

  // Get trending tokens (top gainers and losers)
  const trendingTokens = useMemo(() => {
    // Get top 2 gainers
    const topGainers = sortedByPriceChange
      .filter(token => (token.priceChange24h || 0) > 0)
      .slice(0, 2);

    // Get top 2 losers
    const topLosers = sortedByPriceChange
      .filter(token => (token.priceChange24h || 0) < 0)
      .slice(0, 2);

    // Combine and sort by absolute price change
    return [...topGainers, ...topLosers].sort((a, b) => {
      return Math.abs(b.priceChange24h || 0) - Math.abs(a.priceChange24h || 0);
    });
  }, [sortedByPriceChange]);

  const handleGoToMarket = () => {
    navigate('/trade');
  };

  const handleGoToWallet = () => {
    navigate('/wallet-dashboard');
  };

  const handleRefresh = async () => {
    try {
      await refreshRealTimeData();
      await refreshFallbackData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Format last updated time
  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Loading state
  if ((loading && !trendingTokens.length) || dataLoading) {
    return (
      <div className="pb-24">
        <div className="mb-6">
          <Card className="p-5 bg-gradient-to-br from-dex-dark to-black text-white border-none shadow-[0_4px_16px_rgba(0,0,0,0.3)] rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-gray-400 font-medium text-lg">Portfolio Value</h2>
              <div className="animate-pulse bg-dex-secondary/20 h-6 w-16 rounded-full"></div>
            </div>
            <div className="mb-6">
              <div className="animate-pulse bg-dex-secondary/20 h-10 w-32 rounded-md"></div>
            </div>
            <div className="h-24 w-full animate-pulse bg-dex-secondary/10 rounded-md"></div>
          </Card>
        </div>

        <div className="mb-8">
          <Button
            variant="primary"
            className="py-4 px-5 h-auto w-full flex items-center justify-center gap-4 rounded-lg text-lg shadow-lg shadow-dex-primary/20"
            onClick={handleGoToMarket}
            disabled={loading}
          >
            <TrendingUp size={26} />
            <span className="text-base font-medium">View Market Data</span>
          </Button>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Your Assets</h2>
          <Card className="p-0 bg-dex-dark text-white border-dex-secondary/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-dex-primary" />
              <p className="text-dex-text-secondary">Loading market data...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if ((error || dataError) && !trendingTokens.length) {
    const displayError = error || dataError;
    return (
      <div className="pb-24">
        <div className="mb-6">
          <PortfolioCard tokens={userTokens} />
        </div>

        <div className="mb-8">
          <Button
            variant="primary"
            className="py-4 px-5 h-auto w-full flex items-center justify-center gap-4 rounded-lg text-lg shadow-lg shadow-dex-primary/20"
            onClick={handleGoToMarket}
          >
            <TrendingUp size={26} />
            <span className="text-base font-medium">View Market Data</span>
          </Button>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Market Data</h2>
          <Card className="p-0 bg-dex-dark text-white border-dex-secondary/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
            <div className="p-8 text-center">
              <p className="text-dex-negative mb-2">Error loading market data</p>
              <p className="text-dex-text-secondary mb-4">{displayError.message}</p>
              <Button
                variant="primary"
                onClick={() => refreshData()}
              >
                Retry
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Portfolio section */}
      <div className="mb-6">
        <PortfolioCard tokens={userTokens} />
      </div>

      {/* Real-time status indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-dex-text-secondary">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isStale ? 'bg-yellow-500' : 'bg-green-500'} ${status.isRefreshing ? 'animate-pulse' : ''}`} />
            <span>
              {status.isRefreshing ? 'Updating...' : isStale ? 'Data may be stale' : 'Live data'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={12} />
            <span>Updated {formatLastUpdated(lastUpdated)}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={status.isRefreshing}
              className="h-6 w-6 p-0 hover:bg-dex-secondary/10"
            >
              <RefreshCw size={12} className={status.isRefreshing ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <Button
          variant="primary"
          className="py-4 px-5 h-auto w-full flex items-center justify-center gap-4 rounded-lg text-lg shadow-lg shadow-dex-primary/20"
          onClick={handleGoToMarket}
        >
          <TrendingUp size={26} />
          <span className="text-base font-medium">View Market Data</span>
        </Button>
      </div>

      {/* Top assets */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Your Assets</h2>
        {userTokens.length > 0 ? (
          <Card className="p-0 bg-dex-dark text-white border-dex-secondary/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
            {userTokens.slice(0, 4).map(token => (
              <TokenListItem
                key={token.id}
                token={token}
                onSelect={() => navigate('/wallet-dashboard', { state: { preSelectedToken: token } })}
              />
            ))}

            <div className="p-4 text-center">
              <Button
                variant="ghost"
                className="text-dex-primary hover:text-dex-primary/90 hover:bg-dex-primary/10 font-medium text-base py-3 px-6 rounded-lg"
                onClick={handleGoToWallet}
              >
                View All Assets
              </Button>
            </div>
          </Card>
        ) : (
          <EmptyStateCard
            title="No Assets Yet"
            description="You don't own any assets yet. Add funds to your wallet to get started."
            icon={<Wallet size={40} />}
            actionLabel="Add Funds"
            onAction={() => navigate('/wallet-dashboard')}
          />
        )}
      </div>

      {/* Trending tokens */}
      <div>
        <h2 className="text-xl font-bold mb-4">Trending</h2>
        <Card className="p-0 bg-dex-dark text-white border-dex-secondary/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
          {trendingTokens.map(token => (
            <TokenListItem
              key={token.id}
              token={token}
              showBalance={false}
              onSelect={() => {
                navigate('/trade', { state: { preSelectedToken: token } });
              }}
            />
          ))}
        </Card>
      </div>
    </div>
  );
};

export default HomePage;
