import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGlobalMarketData } from '@/contexts/MarketDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Token } from '@/types';

import { getPortfolioHoldings, getLiquidityPositions, getPortfolioChange24h } from '@/services/portfolioService';

// Mock portfolio data for different tabs
const mockPortfolioData = {
  coins: [
    {
      id: "tether",
      symbol: "USDT",
      name: "Tether USD",
      logo: "/assets/icons/usdt.svg",
      decimals: 6,
      balance: "0",
      price: 1.00,
      priceChange24h: 0.00,
      note: "Stablecoin"
    },
    {
      id: "bitcoin",
      symbol: "BTC",
      name: "Bitcoin",
      logo: "/assets/icons/btc.svg",
      decimals: 8,
      balance: "0",
      price: 0,
      priceChange24h: 0,
      note: "+266.98% in the last 3 years"
    },
    {
      id: "ripple",
      symbol: "XRP",
      name: "XRP",
      logo: "/assets/icons/xrp.svg",
      decimals: 6,
      balance: "0",
      price: 0,
      priceChange24h: 0,
      note: "+369.78% in the last three years"
    }
  ],
  futures: [
    {
      id: "btc-perp",
      symbol: "BTC-PERP",
      name: "Bitcoin Perpetual",
      logo: "/assets/icons/btc.svg",
      position: "long",
      entryPrice: 56000,
      currentPrice: 57200,
      leverage: 5,
      size: 0.5,
      pnl: 600,
      pnlPercentage: 2.14,
      liquidationPrice: 48000
    },
    {
      id: "eth-perp",
      symbol: "ETH-PERP",
      name: "Ethereum Perpetual",
      logo: "/assets/icons/eth.svg",
      position: "short",
      entryPrice: 2900,
      currentPrice: 2850,
      leverage: 10,
      size: 2,
      pnl: 100,
      pnlPercentage: 1.72,
      liquidationPrice: 3200
    }
  ],
  funds: [
    {
      id: "crypto-index",
      symbol: "CRYPTO10",
      name: "Crypto Top 10 Index",
      logo: "/crypto-icons/index.svg",
      balance: "5.25",
      price: 1250,
      priceChange24h: 3.2,
      allocation: 35
    },
    {
      id: "defi-index",
      symbol: "DEFI+",
      name: "DeFi Index Fund",
      logo: "/crypto-icons/defi.svg",
      balance: "12.5",
      price: 420,
      priceChange24h: -1.8,
      allocation: 25
    },
    {
      id: "metaverse-index",
      symbol: "META",
      name: "Metaverse Index",
      logo: "/crypto-icons/meta.svg",
      balance: "8.75",
      price: 180,
      priceChange24h: 5.4,
      allocation: 20
    },
    {
      id: "nft-index",
      symbol: "NFT+",
      name: "NFT Index Fund",
      logo: "/crypto-icons/nft.svg",
      balance: "3.5",
      price: 320,
      priceChange24h: 2.1,
      allocation: 20
    }
  ],
  earn: [
    {
      id: "btc-stake",
      symbol: "BTC",
      name: "Bitcoin",
      logo: "/crypto-icons/btc.svg",
      balance: "0.25",
      price: 57000,
      apy: 4.5,
      lockPeriod: 0,
      rewards: 0.0028
    },
    {
      id: "eth-stake",
      symbol: "ETH",
      name: "Ethereum",
      logo: "/crypto-icons/eth.svg",
      balance: "2.5",
      price: 2850,
      apy: 6.2,
      lockPeriod: 30,
      rewards: 0.038
    },
    {
      id: "usdt-stake",
      symbol: "USDT",
      name: "Tether",
      logo: "/crypto-icons/usdt.svg",
      balance: "1000",
      price: 1,
      apy: 12.5,
      lockPeriod: 90,
      rewards: 30.82
    }
  ],
  web3: [
    {
      id: "nft-1",
      name: "CryptoPunk #3100",
      collection: "CryptoPunks",
      image: "/nfts/cryptopunk.jpg",
      floorPrice: 68.5,
      lastPrice: 72.3,
      priceChange24h: 5.5,
      currency: "ETH"
    },
    {
      id: "nft-2",
      name: "Bored Ape #7329",
      collection: "Bored Ape Yacht Club",
      image: "/nfts/bayc.jpg",
      floorPrice: 42.2,
      lastPrice: 45.8,
      priceChange24h: -2.3,
      currency: "ETH"
    },
    {
      id: "domain-1",
      name: "crypto.eth",
      collection: "ENS Domains",
      image: "/nfts/ens.jpg",
      floorPrice: 0.5,
      lastPrice: 0.8,
      priceChange24h: 10.2,
      currency: "ETH"
    }
  ]
};

export function usePortfolioData(activeTab: string = 'overview') {
  const { tokens, loading: tokensLoading, error: tokensError, refreshData: refreshTokens } = useGlobalMarketData();
  const { user } = useAuth();
  const [portfolioTokens, setPortfolioTokens] = useState<Token[]>([]);
  const [liquidityPositions, setLiquidityPositions] = useState<any[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch portfolio data from Supabase
  useEffect(() => {
    async function fetchPortfolioData() {
      if (!user) {
        setPortfolioTokens([]);
        setPortfolioLoading(false);
        return;
      }

      setPortfolioLoading(true);
      try {
        if (activeTab === 'overview' || activeTab === 'coins') {
          // Get portfolio holdings from Supabase
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
            setPortfolioTokens(updatedHoldings);
          } else {
            setPortfolioTokens(holdings);
          }
        }

        if (activeTab === 'overview' || activeTab === 'liquidity') {
          // Get liquidity positions from Supabase
          const positions = await getLiquidityPositions(user.id);
          setLiquidityPositions(positions);
        }

        setLastUpdated(new Date());
        setPortfolioLoading(false);
        setPortfolioError(null);
      } catch (err) {
        console.error('Error fetching portfolio data:', err);
        setPortfolioError(err instanceof Error ? err : new Error('Failed to fetch portfolio data'));

        // Use only real-time data from CoinGecko API
        if (tokensLoading || tokens.length === 0) {
          setPortfolioTokens([]);
        } else if (activeTab === 'overview' || activeTab === 'coins') {
          // Use real-time token data with zero balances for new users
          const realTimeTokens = tokens.map(token => ({
            ...token,
            balance: '0' // Start with zero balance, will be updated by portfolio service
          }));

          setPortfolioTokens(realTimeTokens);
        }

        setPortfolioLoading(false);
      }
    }

    fetchPortfolioData();
  }, [user, tokens, tokensLoading, activeTab]);

  // Calculate total portfolio value
  const totalPortfolioValue = useMemo(() => {
    let total = 0;

    // Add coins value
    portfolioTokens.forEach(token => {
      const balance = parseFloat(token.balance || '0');
      const price = token.price || 0;
      total += balance * price;
    });

    // Add futures value (notional value)
    if (activeTab === 'overview' || activeTab === 'futures') {
      mockPortfolioData.futures.forEach(future => {
        total += future.size * future.currentPrice;
      });
    }

    // Add funds value
    if (activeTab === 'overview' || activeTab === 'funds') {
      mockPortfolioData.funds.forEach(fund => {
        const balance = parseFloat(fund.balance || '0');
        const price = fund.price || 0;
        total += balance * price;
      });
    }

    // Add earn value
    if (activeTab === 'overview' || activeTab === 'earn') {
      mockPortfolioData.earn.forEach(stake => {
        const balance = parseFloat(stake.balance || '0');
        const price = stake.price || 0;
        total += balance * price;
      });
    }

    // Add web3 value (NFTs, domains, etc.)
    if (activeTab === 'overview' || activeTab === 'web3') {
      mockPortfolioData.web3.forEach(item => {
        // Convert ETH to USD using a mock ETH price of $2850
        const ethPrice = 2850;
        total += item.lastPrice * ethPrice;
      });
    }

    return total;
  }, [portfolioTokens, activeTab]);

  // Calculate 24-hour portfolio change
  const portfolioChange24h = useMemo(() => {
    let currentValue = 0;
    let previousValue = 0;

    // Calculate for coins
    portfolioTokens.forEach(token => {
      const balance = parseFloat(token.balance || '0');
      const currentPrice = token.price || 0;
      const priceChange = token.priceChange24h || 0;

      // Calculate previous price based on percentage change
      const previousPrice = currentPrice / (1 + priceChange / 100);

      currentValue += balance * currentPrice;
      previousValue += balance * previousPrice;
    });

    // For simplicity, we'll use a fixed 2.5% change for other assets
    const otherAssetsValue = totalPortfolioValue - currentValue;
    currentValue += otherAssetsValue;
    previousValue += otherAssetsValue / 1.025;

    if (previousValue === 0) return 0;

    return ((currentValue - previousValue) / previousValue) * 100;
  }, [portfolioTokens, totalPortfolioValue]);

  // Refresh data
  const refreshData = useCallback(async () => {
    if (!user) return;

    setPortfolioLoading(true);
    try {
      // Refresh tokens first
      await refreshTokens();

      // Then refresh portfolio data
      if (activeTab === 'overview' || activeTab === 'coins') {
        const holdings = await getPortfolioHoldings(user.id);

        // Merge with real-time token data
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

        setPortfolioTokens(updatedHoldings);
      }

      if (activeTab === 'overview' || activeTab === 'liquidity') {
        const positions = await getLiquidityPositions(user.id);
        setLiquidityPositions(positions);
      }

      setLastUpdated(new Date());
      setPortfolioError(null);
    } catch (err) {
      console.error('Error refreshing portfolio data:', err);
      setPortfolioError(err instanceof Error ? err : new Error('Failed to refresh portfolio data'));
    } finally {
      setPortfolioLoading(false);
    }
  }, [user, refreshTokens, tokens, activeTab]);

  return {
    portfolioTokens,
    liquidityPositions,
    mockPortfolioData,
    totalPortfolioValue,
    portfolioChange24h,
    loading: portfolioLoading,
    error: portfolioError,
    refreshData,
    lastUpdated
  };
}
