import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet, ChevronRight, BarChart3, Flame, RefreshCw, ArrowUpDown, Clock, Plus,
  TrendingUp, TrendingDown, History, Building, PieChart, Shield, AlertTriangle,
  HelpCircle, ArrowRight, Landmark, AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/services/realTimeData';
import TokenIcon from '@/components/TokenIcon';
import { Token } from '@/types';
import { Button } from '@/components/ui/button';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import EmptyStateCard from '@/components/EmptyStateCard';
import { useGlobalMarketData } from '@/contexts/MarketDataContext';

// Interface for futures contracts
interface FuturesContract {
  id: string;
  symbol: string;
  name: string;
  logo: string;
  price: number;
  priceChange24h: number;
  fundingRate: number;
  maxLeverage: number;
  volume24h: number;
}

// Interface for futures contracts
interface FuturesContract {
  id: string;
  symbol: string;
  name: string;
  logo: string;
  price: number;
  priceChange24h: number;
  fundingRate: number;
  maxLeverage: number;
  volume24h: number;
}

// Function to generate futures contracts from real-time token data
const generateFuturesContracts = (tokens: Token[]): FuturesContract[] => {
  const futuresMap: Record<string, FuturesContract> = {
    "bitcoin": {
      id: "btc-perp",
      symbol: "BTC-PERP",
      name: "Bitcoin Perpetual",
      logo: "/assets/icons/btc.svg",
      price: 0,
      priceChange24h: 0,
      fundingRate: 0.0012,
      maxLeverage: 100,
      volume24h: 1250000000
    },
    "ethereum": {
      id: "eth-perp",
      symbol: "ETH-PERP",
      name: "Ethereum Perpetual",
      logo: "/assets/icons/eth.svg",
      price: 0,
      priceChange24h: 0,
      fundingRate: -0.0008,
      maxLeverage: 100,
      volume24h: 750000000
    },
    "solana": {
      id: "sol-perp",
      symbol: "SOL-PERP",
      name: "Solana Perpetual",
      logo: "/assets/icons/sol.svg",
      price: 0,
      priceChange24h: 0,
      fundingRate: 0.0025,
      maxLeverage: 50,
      volume24h: 320000000
    }
  };

  // Update futures contracts with real-time data
  tokens.forEach(token => {
    if (futuresMap[token.id]) {
      futuresMap[token.id].price = token.price || 0;
      futuresMap[token.id].priceChange24h = token.priceChange24h || 0;

      // Adjust funding rate based on price change (for demonstration)
      if (token.priceChange24h && Math.abs(token.priceChange24h) > 5) {
        const direction = token.priceChange24h > 0 ? 1 : -1;
        futuresMap[token.id].fundingRate = direction * 0.0025;
      }

      // Adjust volume based on price (for demonstration)
      if (token.price) {
        futuresMap[token.id].volume24h = token.price * 25000;
      }
    }
  });

  return Object.values(futuresMap);
};

// Mock data for popular coins
const bluechipCoins: Token[] = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    logo: "/crypto-icons/btc.svg",
    decimals: 8,
    balance: "0.0358",
    price: 56231.42,
    priceChange24h: 0.30,
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    logo: "/crypto-icons/eth.svg",
    decimals: 18,
    balance: "1.5263",
    price: 2845.23,
    priceChange24h: 1.00,
  }
];

// Mock data for meme coins
const memeCoins: Token[] = [
  {
    id: "dogecoin",
    symbol: "DOGE",
    name: "Dogecoin",
    logo: "/crypto-icons/doge.svg",
    decimals: 8,
    balance: "1250.75",
    price: 0.12,
    priceChange24h: 5.55,
  },
  {
    id: "pepe",
    symbol: "PEPE",
    name: "Pepe",
    logo: "/crypto-icons/pepe.svg",
    decimals: 18,
    balance: "12500000",
    price: 0.000001,
    priceChange24h: 1.82,
  }
];

// Interface for investment funds
interface InvestmentFund {
  id: string;
  name: string;
  category: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  returns: {
    oneMonth: number;
    threeMonths: number;
    oneYear: number;
    threeYears?: number;
  };
  minInvestment: number;
  aum: number; // Assets Under Management in crores
  expenseRatio: number;
  description: string;
}

// Mock data for investment funds
const investmentFunds: InvestmentFund[] = [
  {
    id: "equity-growth",
    name: "Equity Growth Fund",
    category: "Equity",
    riskLevel: "High",
    returns: {
      oneMonth: 2.3,
      threeMonths: 5.8,
      oneYear: 18.5,
      threeYears: 42.7
    },
    minInvestment: 1000,
    aum: 12500,
    expenseRatio: 1.2,
    description: "A diversified equity fund focusing on long-term capital appreciation through investments in large-cap stocks."
  },
  {
    id: "balanced-advantage",
    name: "Balanced Advantage Fund",
    category: "Hybrid",
    riskLevel: "Medium",
    returns: {
      oneMonth: 1.2,
      threeMonths: 3.5,
      oneYear: 12.8,
      threeYears: 28.4
    },
    minInvestment: 500,
    aum: 8750,
    expenseRatio: 1.0,
    description: "A hybrid fund that dynamically manages allocation between equity and debt based on market conditions."
  },
  {
    id: "liquid-fund",
    name: "Liquid Fund",
    category: "Debt",
    riskLevel: "Low",
    returns: {
      oneMonth: 0.4,
      threeMonths: 1.2,
      oneYear: 4.8,
      threeYears: 15.2
    },
    minInvestment: 100,
    aum: 22000,
    expenseRatio: 0.5,
    description: "A low-risk fund investing in short-term money market instruments with high liquidity."
  },
  {
    id: "tax-saver",
    name: "Tax Saver ELSS Fund",
    category: "Equity",
    riskLevel: "High",
    returns: {
      oneMonth: 1.8,
      threeMonths: 4.9,
      oneYear: 16.2,
      threeYears: 38.5
    },
    minInvestment: 500,
    aum: 5600,
    expenseRatio: 1.5,
    description: "An equity-linked savings scheme offering tax benefits under Section 80C with a 3-year lock-in period."
  }
];

// Interface for staking tokens
interface StakingToken {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  apy: number;
  balance: string;
  status?: 'NEW' | 'UNAVAILABLE' | 'FULLY SUBSCRIBED';
}

// Function to generate staking tokens with updated APY rates
const generateStakingTokens = (tokens: Token[]): StakingToken[] => {
  // Base staking tokens with default APY rates
  const baseStakingTokens: StakingToken[] = [
    {
      id: "bitcoin",
      name: "Bitcoin",
      symbol: "BTC",
      logo: "/assets/icons/btc.svg",
      apy: 3.8,
      balance: "0"
    },
    {
      id: "ethereum",
      name: "Ethereum",
      symbol: "ETH",
      logo: "/assets/icons/eth.svg",
      apy: 4.2,
      balance: "0"
    },
    {
      id: "tether",
      name: "Tether",
      symbol: "USDT",
      logo: "/assets/icons/usdt.svg",
      apy: 5.5,
      balance: "0"
    },
    {
      id: "solana",
      name: "Solana",
      symbol: "SOL",
      logo: "/assets/icons/sol.svg",
      apy: 6.2,
      balance: "0"
    },
    {
      id: "polkadot",
      name: "Polkadot",
      symbol: "DOT",
      logo: "/assets/icons/dot.svg",
      apy: 9.5,
      balance: "0"
    },
    {
      id: "dogecoin",
      name: "Dogecoin",
      symbol: "DOGE",
      logo: "/assets/icons/doge.svg",
      apy: 2.5,
      balance: "0",
      status: 'NEW'
    },
    {
      id: "shiba-inu",
      name: "Shiba Inu",
      symbol: "SHIB",
      logo: "/assets/icons/shib.svg",
      apy: 3.0,
      balance: "0",
      status: 'NEW'
    }
  ];

  // Create a map for quick lookup
  const stakingMap = new Map<string, StakingToken>();
  baseStakingTokens.forEach(token => stakingMap.set(token.id, token));

  // Update APY rates based on price changes (for demonstration)
  tokens.forEach(token => {
    if (stakingMap.has(token.id)) {
      const stakingToken = stakingMap.get(token.id)!;

      // Adjust APY based on price change (for demonstration)
      if (token.priceChange24h) {
        // Higher volatility = higher APY (simplified model)
        const volatilityFactor = Math.abs(token.priceChange24h) / 10;
        const baseApy = stakingToken.apy;

        // Adjust APY within reasonable bounds
        stakingToken.apy = Math.max(1.0, Math.min(12.0, baseApy + volatilityFactor));
        stakingToken.apy = parseFloat(stakingToken.apy.toFixed(1));
      }
    }
  });

  return Array.from(stakingMap.values());
};

// Mock data for staking tokens (fallback)
const stakingTokens: StakingToken[] = [
  {
    id: "the-graph",
    name: "The Graph",
    symbol: "GRT",
    logo: "/crypto-icons/grt.svg",
    apy: 3.0,
    balance: "0",
    status: 'NEW'
  },
  {
    id: "moonbeam",
    name: "Moonbeam",
    symbol: "GLMR",
    logo: "/crypto-icons/glmr.svg",
    apy: 3.0,
    balance: "0",
    status: 'NEW'
  },
  {
    id: "avalanche",
    name: "Avalanche",
    symbol: "AVAX",
    logo: "/crypto-icons/avax.svg",
    apy: 2.6,
    balance: "0"
  },
  {
    id: "eigenlayer",
    name: "EigenLayer",
    symbol: "EIGEN",
    logo: "/crypto-icons/eigen.svg",
    apy: 2.5,
    balance: "0",
    status: 'NEW'
  },
  {
    id: "polygon",
    name: "Polygon Ecosystem Token",
    symbol: "POL",
    logo: "/crypto-icons/matic.svg",
    apy: 2.5,
    balance: "0"
  },
  {
    id: "sei",
    name: "SEI",
    symbol: "SEI",
    logo: "/crypto-icons/sei.svg",
    apy: 2.3,
    balance: "0",
    status: 'NEW'
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    logo: "/crypto-icons/eth.svg",
    apy: 2.0,
    balance: "0"
  },
  {
    id: "tezos",
    name: "Tezos",
    symbol: "XTZ",
    logo: "/crypto-icons/xtz.svg",
    apy: 2.0,
    balance: "0"
  },
  {
    id: "sui",
    name: "Sui",
    symbol: "SUI",
    logo: "/crypto-icons/sui.svg",
    apy: 2.0,
    balance: "0"
  },
  {
    id: "cardano",
    name: "Cardano",
    symbol: "ADA",
    logo: "/crypto-icons/ada.svg",
    apy: 1.72,
    balance: "0"
  },
  {
    id: "moonriver",
    name: "Moonriver",
    symbol: "MOVR",
    logo: "/crypto-icons/movr.svg",
    apy: 1.25,
    balance: "0",
    status: 'NEW'
  },
  {
    id: "fantom",
    name: "Fantom",
    symbol: "FTM",
    logo: "/crypto-icons/ftm.svg",
    apy: 0.75,
    balance: "0",
    status: 'UNAVAILABLE'
  },
  {
    id: "binancecoin",
    name: "Binance Coin",
    symbol: "BNB",
    logo: "/crypto-icons/bnb.svg",
    apy: 1.5,
    balance: "0",
    status: 'UNAVAILABLE'
  },
  {
    id: "dash",
    name: "Dash",
    symbol: "DASH",
    logo: "/crypto-icons/dash.svg",
    apy: 2.0,
    balance: "0",
    status: 'UNAVAILABLE'
  },
  {
    id: "iostoken",
    name: "IOSToken",
    symbol: "IOST",
    logo: "/crypto-icons/iost.svg",
    apy: 5.0,
    balance: "0",
    status: 'UNAVAILABLE'
  },
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    logo: "/crypto-icons/btc.svg",
    apy: 0.75,
    balance: "0",
    status: 'UNAVAILABLE'
  },
  {
    id: "osmosis",
    name: "Osmosis",
    symbol: "OSMO",
    logo: "/crypto-icons/osmo.svg",
    apy: 7.0,
    balance: "0",
    status: 'FULLY SUBSCRIBED'
  }
];

const PortfolioPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const {
    portfolioTokens,
    mockPortfolioData,
    totalPortfolioValue,
    portfolioChange24h,
    loading,
    error,
    refreshData,
    lastUpdated
  } = usePortfolioData(activeTab);

  // Get tokens from the global market data context
  const { tokens } = useGlobalMarketData();

  // Format portfolio change for display
  const formattedPortfolioChange = portfolioChange24h.toFixed(2);
  const isPositiveChange = portfolioChange24h >= 0;

  // Format last updated time
  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Loading state
  if (loading && activeTab === 'overview') {
    return (
      <div className="container mx-auto px-4 pt-6 pb-24">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Portfolio</h2>
          <div className="flex items-center gap-2 text-gray-400">
            <RefreshCw size={16} className="animate-spin text-dex-primary" />
            <span className="text-xs">Loading...</span>
          </div>
        </div>

        <div className="grid grid-cols-6 mb-6 bg-dex-dark/50 p-1 rounded-lg border border-dex-secondary/20 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
          {['Overview', 'Coins', 'Futures', 'Funds', 'Earn', 'Web 3.0'].map((tab, index) => (
            <div key={index} className="flex items-center justify-center py-1.5 px-1 h-11 min-h-[44px] rounded-lg text-center text-white bg-dex-secondary/50 animate-pulse">
              {tab}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-24 h-24 bg-dex-secondary/20 rounded-full animate-pulse mb-6"></div>
          <div className="h-6 w-48 bg-dex-secondary/20 rounded-md animate-pulse mb-2"></div>
          <div className="h-4 w-32 bg-dex-secondary/10 rounded-md animate-pulse mb-8"></div>

          <div className="w-full space-y-4">
            <div className="h-20 bg-dex-secondary/10 rounded-lg animate-pulse"></div>
            <div className="h-20 bg-dex-secondary/10 rounded-lg animate-pulse"></div>
            <div className="h-20 bg-dex-secondary/10 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 pt-6 pb-24">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Portfolio</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshData()}
            className="h-8 px-2 bg-dex-tertiary border-dex-secondary"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <EmptyStateCard
          title="Error Loading Portfolio Data"
          description={error.message || "Failed to load portfolio data. Please try again."}
          icon={<AlertCircle size={40} className="text-dex-negative" />}
          actionLabel="Retry"
          onAction={() => refreshData()}
          className="mb-6"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Portfolio</h2>
        {lastUpdated && (
          <div className="flex items-center gap-2 text-gray-400">
            <RefreshCw size={16} onClick={() => refreshData()} className="cursor-pointer hover:text-dex-primary transition-colors" />
            <span className="text-xs">Updated {formattedLastUpdated}</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-6 mb-6 bg-dex-dark/50 p-1 rounded-lg border border-dex-secondary/20 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
          <TabsTrigger
            value="overview"
            className="flex items-center justify-center py-1.5 px-1 h-11 min-h-[44px] rounded-lg text-center text-white transition-all duration-200
            bg-dex-secondary text-dex-text-primary
            data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
            data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
            data-[state=active]:border data-[state=active]:border-white/10"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="coins"
            className="flex items-center justify-center py-1.5 px-1 h-11 min-h-[44px] rounded-lg text-center text-white transition-all duration-200
            bg-dex-secondary text-dex-text-primary
            data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
            data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
            data-[state=active]:border data-[state=active]:border-white/10"
          >
            Coins
          </TabsTrigger>
          <TabsTrigger
            value="futures"
            className="flex items-center justify-center py-1.5 px-1 h-11 min-h-[44px] rounded-lg text-center text-white transition-all duration-200
            bg-dex-secondary text-dex-text-primary
            data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
            data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
            data-[state=active]:border data-[state=active]:border-white/10"
          >
            Futures
          </TabsTrigger>
          <TabsTrigger
            value="funds"
            className="flex items-center justify-center py-1.5 px-1 h-11 min-h-[44px] rounded-lg text-center text-white transition-all duration-200
            bg-dex-secondary text-dex-text-primary
            data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
            data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
            data-[state=active]:border data-[state=active]:border-white/10"
          >
            Funds
          </TabsTrigger>
          <TabsTrigger
            value="earn"
            className="flex items-center justify-center py-1.5 px-1 h-11 min-h-[44px] rounded-lg text-center text-white transition-all duration-200
            bg-dex-secondary text-dex-text-primary
            data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
            data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
            data-[state=active]:border data-[state=active]:border-white/10"
          >
            Earn
          </TabsTrigger>
          <TabsTrigger
            value="web3"
            className="flex items-center justify-center py-1.5 px-1 h-11 min-h-[44px] rounded-lg text-center text-white transition-all duration-200
            bg-dex-secondary text-dex-text-primary
            data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
            data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
            data-[state=active]:border data-[state=active]:border-white/10"
          >
            Web 3.0
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {portfolioTokens.length === 0 && mockPortfolioData.futures.length === 0 && mockPortfolioData.funds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-24 h-24 bg-dex-primary/10 rounded-full flex items-center justify-center mb-6">
                <Wallet size={48} className="text-dex-primary" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Your account has no assets</h2>

              <div className="flex items-center gap-2 mb-8">
                <span className="text-dex-text-secondary">Portfolio Value:</span>
                <span className="text-white font-medium">$0</span>
                {portfolioChange24h !== 0 && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isPositiveChange ? 'bg-dex-positive/10 text-dex-positive' : 'bg-dex-negative/10 text-dex-negative'}`}>
                    {isPositiveChange ? '+' : ''}{formattedPortfolioChange}%
                  </span>
                )}
              </div>

              <Card className="w-full bg-dex-dark/80 border-dex-secondary/30 mb-4 mt-8">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                        <span className="text-dex-primary font-bold">₹</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-white">Deposit INR</h3>
                        <p className="text-sm text-gray-400">via UPI or bank transfer</p>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <ChevronRight size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full bg-dex-dark/80 border-dex-secondary/30 mb-8">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dex-primary">
                          <path d="M12 12v6"/>
                          <path d="M12 6v2"/>
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-white">Deposit Coins</h3>
                        <p className="text-sm text-gray-400">from a Coins wallet or exchange</p>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <ChevronRight size={24} />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-dex-positive">Crypto withdrawals available</div>
                </CardContent>
              </Card>

              <h3 className="text-lg font-semibold text-white self-start mb-4">Products</h3>

              <Card className="w-full bg-dex-dark/80 border-dex-secondary/30 mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dex-secondary/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 6v12"/>
                          <path d="M6 12h12"/>
                        </svg>
                      </div>
                      <div className="font-medium text-white">Coins</div>
                    </div>
                    <div className="text-white font-medium">₹0</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full bg-dex-dark/80 border-dex-secondary/30 mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dex-secondary/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <rect width="18" height="18" x="3" y="3" rx="2"/>
                          <path d="M7 7h10"/>
                          <path d="M7 12h10"/>
                          <path d="M7 17h10"/>
                        </svg>
                      </div>
                      <div className="font-medium text-white">Futures</div>
                    </div>
                    <div className="text-white font-medium">₹0</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full bg-dex-dark/80 border-dex-secondary/30 mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dex-secondary/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1"/>
                          <path d="M17 3h1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1"/>
                          <path d="M12 12v9"/>
                          <path d="M8 21h8"/>
                          <path d="M4 8h16"/>
                        </svg>
                      </div>
                      <div className="font-medium text-white">Funds</div>
                    </div>
                    <div className="text-white font-medium">₹0</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full bg-dex-dark/80 border-dex-secondary/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dex-secondary/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <path d="M18 6 7 17l-5-5"/>
                          <path d="m22 10-7.5 7.5L13 16"/>
                        </svg>
                      </div>
                      <div className="font-medium text-white">Earn</div>
                    </div>
                    <div className="text-gray-400">
                      <ChevronRight size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col py-4">
              {/* Portfolio Summary */}
              <Card className="w-full bg-dex-dark/80 border-dex-secondary/30 mb-6">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Portfolio Summary</h3>
                    <div className={`text-sm font-medium px-2 py-1 rounded-full ${isPositiveChange ? 'bg-dex-positive/10 text-dex-positive' : 'bg-dex-negative/10 text-dex-negative'}`}>
                      {isPositiveChange ? '+' : ''}{formattedPortfolioChange}%
                    </div>
                  </div>

                  <div className="text-3xl font-bold text-white mb-6">$0</div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Coins</div>
                      <div className="text-base font-medium text-white">$0</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-400 mb-1">Futures</div>
                      <div className="text-base font-medium text-white">$0</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-400 mb-1">Funds</div>
                      <div className="text-base font-medium text-white">$0</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-400 mb-1">Earn</div>
                      <div className="text-base font-medium text-white">$0</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Assets */}
              <h3 className="text-lg font-semibold text-white mb-4">Top Assets</h3>

              <div className="space-y-4 mb-6">
                {/* Tether USD (USDT) */}
                <Card className="w-full bg-dex-dark/80 border-dex-secondary/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TokenIcon token={mockPortfolioData.coins[0]} size="md" />
                        <div>
                          <div className="font-medium text-white">TetherUS</div>
                          <div className="text-xs text-gray-400">Stablecoin</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div>
                        <div className="font-medium text-white">Last Price</div>
                        <div className="text-xl font-bold text-white">$1</div>
                      </div>
                      <div className="text-amber-500 font-medium text-right">
                        <Button variant="link" className="h-auto p-0 text-amber-500 font-medium">Buy Now</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bitcoin (BTC) */}
                <Card className="w-full bg-dex-dark/80 border-dex-secondary/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TokenIcon token={mockPortfolioData.coins[1]} size="md" />
                        <div>
                          <div className="font-medium text-white">Bitcoin</div>
                          <div className="text-xs text-gray-400"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-right text-2xl font-bold">+266.98%</div>
                        <div className="text-xs text-gray-400 text-right">in the last 3 years</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div>
                        <div className="font-medium text-white">Last Price</div>
                        <div className="text-xl font-bold text-white">${tokens.find(t => t.id === 'bitcoin')?.price?.toLocaleString() || '11,054.57'}</div>
                      </div>
                      <div className="text-amber-500 font-medium text-right">
                        <Button variant="link" className="h-auto p-0 text-amber-500 font-medium">Buy Now</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* XRP */}
                <Card className="w-full bg-dex-dark/80 border-dex-secondary/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TokenIcon token={mockPortfolioData.coins[2]} size="md" />
                        <div>
                          <div className="font-medium text-white">XRP</div>
                          <div className="text-xs text-gray-400"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-right text-2xl font-bold">+369.78%</div>
                        <div className="text-xs text-gray-400 text-right">in the last three years</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div>
                        <div className="font-medium text-white">Last Price</div>
                        <div className="text-xl font-bold text-white">${tokens.find(t => t.id === 'ripple')?.price?.toLocaleString() || '680.91'}</div>
                      </div>
                      <div className="text-amber-500 font-medium text-right">
                        <Button variant="link" className="h-auto p-0 text-amber-500 font-medium">Buy Now</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="bg-dex-dark/80 border-dex-secondary/30">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-dex-primary/20 flex items-center justify-center mb-3">
                        <Plus size={24} className="text-dex-primary" />
                      </div>
                      <h3 className="text-sm font-medium text-white mb-2">Deposit Funds</h3>
                      <p className="text-xs text-gray-400 mb-3">Add money to your account</p>
                      <Button className="w-full h-9 bg-dex-primary hover:bg-dex-primary/90 text-white rounded-lg text-xs">
                        Deposit
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-dex-dark/80 border-dex-secondary/30">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-dex-secondary/20 flex items-center justify-center mb-3">
                        <ArrowUpDown size={24} className="text-white" />
                      </div>
                      <h3 className="text-sm font-medium text-white mb-2">Trade Assets</h3>
                      <p className="text-xs text-gray-400 mb-3">Buy or sell cryptocurrencies</p>
                      <Button className="w-full h-9 bg-dex-secondary hover:bg-dex-secondary/90 text-white rounded-lg text-xs">
                        Trade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="coins">
          {loading ? (
            <div className="flex flex-col py-4">
              <div className="h-20 bg-dex-secondary/10 rounded-lg animate-pulse mb-4"></div>
              <div className="h-20 bg-dex-secondary/10 rounded-lg animate-pulse mb-6"></div>

              <div className="h-6 w-48 bg-dex-secondary/20 rounded-md animate-pulse mb-4"></div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="h-16 bg-dex-secondary/10 rounded-lg animate-pulse"></div>
                <div className="h-16 bg-dex-secondary/10 rounded-lg animate-pulse"></div>
              </div>

              <div className="h-6 w-48 bg-dex-secondary/20 rounded-md animate-pulse mb-4"></div>

              <div className="grid grid-cols-2 gap-3">
                <div className="h-16 bg-dex-secondary/10 rounded-lg animate-pulse"></div>
                <div className="h-16 bg-dex-secondary/10 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col py-4">
              {/* Deposit Cards */}
              <Card className="w-full bg-dex-dark/80 border-dex-secondary/30 mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                        <span className="text-dex-primary font-bold">₹</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-white">Deposit INR</h3>
                        <p className="text-sm text-gray-400">via UPI or bank transfer</p>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <ChevronRight size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full bg-dex-dark/80 border-dex-secondary/30 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dex-primary">
                          <path d="M12 12v6"/>
                          <path d="M12 6v2"/>
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-white">Deposit Coins</h3>
                        <p className="text-sm text-gray-400">from a Coins wallet or exchange</p>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <ChevronRight size={24} />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-dex-positive">Crypto withdrawals available</div>
                </CardContent>
              </Card>

              {portfolioTokens.length > 0 ? (
                <>
                  {/* Your Coins section */}
                  <h3 className="text-lg font-semibold text-white mb-4">Your Coins</h3>

                  <div className="space-y-4 mb-6">
                    {portfolioTokens.map(token => (
                      <Card key={token.id} className="w-full bg-dex-dark/80 border-dex-secondary/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <TokenIcon token={token} size="md" />
                              <div>
                                <div className="font-medium text-white">{token.name}</div>
                                <div className="text-xs text-gray-400">{token.balance} {token.symbol}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-white">${formatCurrency(parseFloat(token.balance || '0') * (token.price || 0))}</div>
                              <div className={`text-xs ${token.priceChange24h >= 0 ? 'text-dex-positive' : 'text-dex-negative'}`}>
                                {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h?.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : null}

              {/* Coins for you section */}
              <h3 className="text-lg font-semibold text-white mb-4">Coins for you</h3>

              {/* Bluechip tokens section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={18} className="text-dex-primary" />
                  <span className="text-sm font-medium text-white">Bluechip tokens</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* USDT and BTC with real-time data */}
                  {tokens
                    .filter(token => token.id === 'tether' || token.id === 'bitcoin')
                    .map(token => (
                      <Card key={token.id} className="bg-dex-dark/80 border-dex-secondary/30">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <TokenIcon token={token} size="sm" />
                            <span className="font-medium text-white">{token.symbol}</span>
                          </div>
                          <div className={`text-sm ${token.priceChange24h >= 0 ? 'text-dex-positive' : 'text-dex-negative'}`}>
                            {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h?.toFixed(2)}%
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>

              {/* Meme coins section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Flame size={18} className="text-dex-primary" />
                  <span className="text-sm font-medium text-white">Popular Meme Coins</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* DOGE and SHIB with real-time data */}
                  {tokens
                    .filter(token => token.id === 'dogecoin' || token.id === 'shiba-inu')
                    .map(token => (
                      <Card key={token.id} className="bg-dex-dark/80 border-dex-secondary/30">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <TokenIcon token={token} size="sm" />
                            <span className="font-medium text-white">{token.symbol}</span>
                          </div>
                          <div className={`text-sm ${token.priceChange24h >= 0 ? 'text-dex-positive' : 'text-dex-negative'}`}>
                            {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h?.toFixed(2)}%
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="futures">
          <div className="flex flex-col py-4">
            {/* Current Value Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Current value</span>
                  <div className="flex items-center bg-dex-secondary/50 rounded-md px-2 py-1">
                    <span className="text-xs text-white mr-1">INR</span>
                    <ChevronRight size={12} className="text-gray-400" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RefreshCw size={18} className="text-gray-400" />
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dex-positive">
                    <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/>
                    <path d="M3 12h.01"/>
                    <path d="M7 12h.01"/>
                    <path d="M11 12h.01"/>
                    <path d="M15 12h.01"/>
                    <path d="M19 12h.01"/>
                  </svg>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold text-white">₹0</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <path d="M3 22V8l9-6 9 6v14"/>
                  <path d="M3 14h18"/>
                </svg>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Wallet balance</div>
                  <div className="text-base font-medium text-white">₹0</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Active PNL</div>
                  <div className="text-base font-medium text-white">₹0 (0.0%)</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button className="h-12 min-h-[48px] bg-dex-primary hover:bg-dex-primary/90 text-white rounded-lg flex items-center justify-center gap-2">
                  <Plus size={18} />
                  <span>Add INR</span>
                </Button>
                <Button className="h-12 min-h-[48px] bg-dex-secondary hover:bg-dex-secondary/90 text-white rounded-lg flex items-center justify-center gap-2">
                  <ArrowUpDown size={18} />
                  <span>Transfer</span>
                </Button>
              </div>
            </div>

            {/* Assets Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Assets</h3>

              <Card className="w-full bg-dex-dark/80 border-dex-secondary/30 mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-dex-primary/20 flex items-center justify-center">
                      <span className="text-dex-primary font-bold">₹</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">Indian Rupee</h3>
                        <span className="text-xs text-gray-400">INR</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Current</div>
                      <div className="text-base font-medium text-white">₹0</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Active PNL</div>
                      <div className="text-base font-medium text-white">₹0 (0.0%)</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Wallet balance</div>
                      <div className="text-base font-medium text-white">₹0</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Available/ Locked</div>
                      <div className="text-base font-medium text-white">₹0 / ₹0</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Markets Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Markets</h3>
                <div className="flex items-center gap-2 text-gray-400">
                  <History size={16} />
                  <span className="text-xs">History</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Generate futures contracts from real-time token data */}
                {generateFuturesContracts(tokens).map(contract => (
                  <Card key={contract.id} className="w-full bg-dex-dark/80 border-dex-secondary/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <TokenIcon token={{ ...contract, decimals: 8 }} size="sm" />
                          <div>
                            <div className="font-medium text-white">{contract.symbol}</div>
                            <div className="text-xs text-gray-400">{contract.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-white">${contract.price.toLocaleString()}</div>
                          <div className={`text-xs ${contract.priceChange24h >= 0 ? 'text-dex-positive' : 'text-dex-negative'}`}>
                            {contract.priceChange24h >= 0 ? '+' : ''}{contract.priceChange24h.toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Funding</div>
                          <div className={`text-xs ${contract.fundingRate >= 0 ? 'text-dex-positive' : 'text-dex-negative'}`}>
                            {contract.fundingRate >= 0 ? '+' : ''}{(contract.fundingRate * 100).toFixed(4)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Max Leverage</div>
                          <div className="text-xs text-white">{contract.maxLeverage}x</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">24h Volume</div>
                          <div className="text-xs text-white">${(contract.volume24h / 1000000).toFixed(1)}M</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button className="h-9 bg-dex-positive hover:bg-dex-positive/90 text-white rounded-lg text-xs">
                          <TrendingUp size={14} className="mr-1" />
                          Long
                        </Button>
                        <Button className="h-9 bg-dex-negative hover:bg-dex-negative/90 text-white rounded-lg text-xs">
                          <TrendingDown size={14} className="mr-1" />
                          Short
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="funds">
          <div className="flex flex-col py-4">
            {/* Currency Tabs */}
            <div className="flex mb-4 bg-dex-secondary/30 rounded-lg p-1">
              <div className="flex-1 bg-dex-primary text-white rounded-md py-2 text-center font-medium">
                INR
              </div>
              <div className="flex-1 text-gray-400 py-2 text-center font-medium">
                Coins
              </div>
            </div>

            {/* Empty State with Wallet Icon */}
            <div className="flex flex-col items-center justify-center py-8 mb-6">
              <div className="w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center mb-4 relative">
                <Wallet size={32} className="text-white" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">₹</span>
                </div>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Your account has no assets</h2>
            </div>

            {/* Deposit Card */}
            <Card className="w-full bg-dex-dark/80 border-dex-secondary/30 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white font-bold">₹</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-white">Deposit INR</h3>
                      <p className="text-sm text-gray-400">via bank transfer</p>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How to do Bank Transfer */}
            <Card className="w-full bg-dex-dark/80 border-dex-secondary/30 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                      <HelpCircle size={20} className="text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">How to do Bank Transfer?</h3>
                    </div>
                  </div>
                  <div className="text-blue-500">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="bg-dex-dark/80 border-dex-secondary/30">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 mb-3 flex items-center justify-center">
                      <Landmark size={32} className="text-blue-500" />
                    </div>
                    <h3 className="text-sm font-medium text-white mb-2">How to do a bank transfer funds?</h3>
                    <Button className="w-full h-9 bg-blue-100/10 hover:bg-blue-100/20 text-blue-500 rounded-lg text-xs">
                      Learn
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-dex-dark/80 border-dex-secondary/30">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 mb-3 flex items-center justify-center">
                      <Landmark size={32} className="text-blue-500" />
                    </div>
                    <h3 className="text-sm font-medium text-white mb-2">How to deposit INR?</h3>
                    <Button className="w-full h-9 bg-blue-100/10 hover:bg-blue-100/20 text-blue-500 rounded-lg text-xs">
                      Learn
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Investment Opportunities */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Investment Opportunities</h3>

              <div className="space-y-4">
                {investmentFunds.map(fund => (
                  <Card key={fund.id} className="w-full bg-dex-dark/80 border-dex-secondary/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center
                            ${fund.riskLevel === 'Low' ? 'bg-green-600/20' :
                              fund.riskLevel === 'Medium' ? 'bg-yellow-600/20' : 'bg-red-600/20'}`}>
                            {fund.riskLevel === 'Low' ? (
                              <Shield size={20} className="text-green-500" />
                            ) : fund.riskLevel === 'Medium' ? (
                              <PieChart size={20} className="text-yellow-500" />
                            ) : (
                              <AlertTriangle size={20} className="text-red-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-white">{fund.name}</div>
                            <div className="text-xs text-gray-400">{fund.category} • {fund.riskLevel} Risk</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">1Y Returns</div>
                          <div className="text-xs text-dex-positive">+{fund.returns.oneYear.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Min. Investment</div>
                          <div className="text-xs text-white">₹{fund.minInvestment}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Expense Ratio</div>
                          <div className="text-xs text-white">{fund.expenseRatio.toFixed(2)}%</div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-400 mb-3 line-clamp-2">
                        {fund.description}
                      </div>

                      <Button className="w-full h-9 bg-dex-primary hover:bg-dex-primary/90 text-white rounded-lg text-xs">
                        Invest Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="earn">
          <div className="flex flex-col py-4">
            {/* Assured Returns Banner */}
            <Card className="w-full bg-gradient-to-r from-dex-primary/80 to-dex-primary mb-6 border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Claim assured returns with no lock-in</h3>
                    <p className="text-sm text-white/80 mb-3">Earn up to 7% APY on your crypto assets</p>
                    <Button className="h-10 min-h-[44px] bg-white text-dex-primary hover:bg-white/90 rounded-lg text-sm font-medium">
                      Start Earning
                    </Button>
                  </div>
                  <div className="w-16 h-16 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M18 6 7 17l-5-5"/>
                      <path d="m22 10-7.5 7.5L13 16"/>
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Simple Staking Section */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">Simple</h3>

              <div className="space-y-4">
                {/* Use real-time data for staking tokens */}
                {generateStakingTokens(tokens).map(token => (
                  <div key={token.id} className="flex items-center justify-between py-4 border-b border-dex-secondary/30">
                    <div className="flex items-center gap-3">
                      <TokenIcon token={{ id: token.id, symbol: token.symbol, name: token.name, logo: token.logo, decimals: 8 }} size="sm" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{token.name}</span>
                          {token.status && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              token.status === 'NEW' ? 'bg-green-500/20 text-green-500' :
                              token.status === 'UNAVAILABLE' ? 'bg-gray-500/20 text-gray-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {token.status}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">{token.balance} {token.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-500 font-medium">{token.apy.toFixed(2)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="web3">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-24 h-24 bg-dex-primary/10 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dex-primary">
                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
                <path d="M8.5 8.5v.01"/>
                <path d="M16 15.5v.01"/>
                <path d="M12 12v.01"/>
                <path d="M11 17v.01"/>
                <path d="M7 14v.01"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Explore Web 3.0</h2>
            <p className="text-gray-400 text-center mb-6">Discover decentralized applications</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PortfolioPage;
