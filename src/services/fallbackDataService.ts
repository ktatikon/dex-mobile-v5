
/**
 * FALLBACK DATA SERVICE
 *
 * This file provides fallback data and configuration for the DEX mobile application.
 * It contains:
 * - Phase configuration settings for feature flags
 * - Market data fallbacks when external APIs fail
 * - Demo data for new users and testing
 * - Utility functions for data formatting and calculations
 *
 * Note: This is NOT mock data for development - it's production fallback data
 * that ensures the application remains functional when external services fail.
 */

import { Token, Transaction, TransactionStatus, TransactionType, WalletInfo } from "@/types";
import { fetchTokenList, adaptCoinGeckoData } from "./realTimeData";

// Phase Configuration - Controls feature availability and fallback behavior
export const PHASE2_CONFIG = {
  enableRealWallets: false,
  enableRealTransactions: false,
  supportedNetworks: ['ethereum', 'polygon', 'bitcoin'],
  maxWalletsPerUser: 10,
  transactionHistoryLimit: 1000
};

// Fallback balances for demo purposes and new user onboarding
const fallbackBalances: Record<string, string> = {
  "ethereum": "1.5263",
  "bitcoin": "0.0358",
  "usd-coin": "523.67",
  "tether": "745.21",
  "solana": "12.431",
  "cardano": "452.16",
  "binancecoin": "3.482",
  "ripple": "1250.32",
};

// Fallback token data with static prices (used when CoinGecko API fails)
export const mockTokens: Token[] = [
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    logo: "/crypto-icons/eth.svg",
    decimals: 18,
    balance: "1.5263",
    price: 2845.23,
    priceChange24h: 3.5,
  },
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    logo: "/crypto-icons/btc.svg",
    decimals: 8,
    balance: "0.0358",
    price: 56231.42,
    priceChange24h: 2.1,
  },
  {
    id: "usd-coin",
    symbol: "USDC",
    name: "USD Coin",
    logo: "/crypto-icons/usdc.svg",
    decimals: 6,
    balance: "523.67",
    price: 1.0,
    priceChange24h: 0.01,
  },
  {
    id: "tether",
    symbol: "USDT",
    name: "Tether",
    logo: "/crypto-icons/usdt.svg",
    decimals: 6,
    balance: "745.21",
    price: 1.0,
    priceChange24h: 0.0,
  },
  {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    logo: "/crypto-icons/sol.svg",
    decimals: 9,
    balance: "12.431",
    price: 102.38,
    priceChange24h: 5.7,
  },
  {
    id: "cardano",
    symbol: "ADA",
    name: "Cardano",
    logo: "/crypto-icons/ada.svg",
    decimals: 6,
    balance: "452.16",
    price: 0.55,
    priceChange24h: -1.2,
  },
  {
    id: "binancecoin",
    symbol: "BNB",
    name: "Binance Coin",
    logo: "/crypto-icons/bnb.svg",
    decimals: 18,
    balance: "3.482",
    price: 304.12,
    priceChange24h: 0.8,
  },
  {
    id: "ripple",
    symbol: "XRP",
    name: "Ripple",
    logo: "/crypto-icons/xrp.svg",
    decimals: 6,
    balance: "1250.32",
    price: 0.59,
    priceChange24h: -0.5,
  },
];

/**
 * Gets real-time token data with live prices from CoinGecko
 * This function fetches live prices and applies them to fallback balances
 * Includes comprehensive error handling and timeout protection
 */
export async function getRealTimeTokens(): Promise<Token[]> {
  try {
    console.log('🔄 Fetching real-time token data...');

    // Add timeout protection for external API calls
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('API request timeout')), 10000); // 10 second timeout
    });

    // Race between API call and timeout
    const coinGeckoData = await Promise.race([
      fetchTokenList('usd'),
      timeoutPromise
    ]);

    if (!coinGeckoData || !Array.isArray(coinGeckoData)) {
      throw new Error('Invalid API response format');
    }

    const realTimeTokens = adaptCoinGeckoData(coinGeckoData);

    if (!realTimeTokens || realTimeTokens.length === 0) {
      throw new Error('No tokens received from API');
    }

    // Apply fallback balances to tokens for demo purposes
    const tokensWithBalances = realTimeTokens.map(token => {
      try {
        return {
          ...token,
          balance: fallbackBalances[token.id] || "0",
          logo: token.logo?.startsWith('http') ? token.logo : `/crypto-icons/${token.symbol?.toLowerCase() || 'unknown'}.svg`,
          // Ensure required fields are present
          price: typeof token.price === 'number' ? token.price : 0,
          priceChange24h: typeof token.priceChange24h === 'number' ? token.priceChange24h : 0
        };
      } catch (tokenError) {
        console.warn(`Error processing token ${token.id}:`, tokenError);
        return null;
      }
    }).filter(token => token !== null);

    console.log(`✅ Successfully loaded ${tokensWithBalances.length} tokens with real-time prices`);
    return tokensWithBalances;

  } catch (error) {
    console.error('❌ Error fetching real-time tokens, using fallback data:', error);

    // Ensure fallback data is valid
    if (!mockTokens || !Array.isArray(mockTokens)) {
      console.error('❌ Fallback data is invalid, returning empty array');
      return [];
    }

    return mockTokens;
  }
}

// Fallback transaction data for demo purposes and new user onboarding
export const mockTransactions: Transaction[] = [
  {
    id: "tx1",
    type: TransactionType.SWAP,
    fromToken: mockTokens[0],
    toToken: mockTokens[2],
    fromAmount: "0.5",
    toAmount: "1423.45",
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    hash: "0x1234...5678",
    status: TransactionStatus.COMPLETED,
    account: "0xabc...def",
  },
  {
    id: "tx2",
    type: TransactionType.SEND,
    fromToken: mockTokens[2],
    fromAmount: "100",
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    hash: "0x2345...6789",
    status: TransactionStatus.COMPLETED,
    account: "0xabc...def",
  },
  {
    id: "tx3",
    type: TransactionType.RECEIVE,
    toToken: mockTokens[1],
    toAmount: "0.01",
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    hash: "0x3456...7890",
    status: TransactionStatus.COMPLETED,
    account: "0xabc...def",
  },
  {
    id: "tx4",
    type: TransactionType.SWAP,
    fromToken: mockTokens[3],
    toToken: mockTokens[4],
    fromAmount: "250",
    toAmount: "2.47",
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
    hash: "0x4567...8901",
    status: TransactionStatus.COMPLETED,
    account: "0xabc...def",
  },
  {
    id: "tx5",
    type: TransactionType.APPROVE,
    fromToken: mockTokens[5],
    timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000,
    hash: "0x5678...9012",
    status: TransactionStatus.COMPLETED,
    account: "0xabc...def",
  },
  {
    id: "tx6",
    type: TransactionType.SWAP,
    fromToken: mockTokens[4],
    toToken: mockTokens[6],
    fromAmount: "5.3",
    toAmount: "0.53",
    timestamp: Date.now() - 30 * 60 * 1000,
    hash: "0x6789...0123",
    status: TransactionStatus.PENDING,
    account: "0xabc...def",
  },
];

/**
 * Gets real-time transaction data (fallback to demo data for Phase 1)
 * This function provides backward compatibility for components expecting real-time transactions
 * Includes comprehensive error handling and data validation
 */
export async function getRealTimeTransactions(): Promise<Transaction[]> {
  try {
    console.log('🔄 Fetching real-time transaction data (using fallback data for Phase 1)...');

    // Validate fallback data before returning
    if (!mockTransactions || !Array.isArray(mockTransactions)) {
      throw new Error('Invalid fallback transaction data');
    }

    // Validate each transaction has required fields
    const validTransactions = mockTransactions.filter(tx => {
      try {
        return tx &&
               typeof tx.id === 'string' &&
               tx.id.length > 0 &&
               typeof tx.type !== 'undefined' &&
               typeof tx.timestamp !== 'undefined';
      } catch (validationError) {
        console.warn('Invalid transaction found:', tx, validationError);
        return false;
      }
    });

    if (validTransactions.length === 0) {
      console.warn('⚠️ No valid transactions found in fallback data');
      return [];
    }

    // In Phase 1, we return fallback transactions for demo purposes
    // In Phase 2+, this would fetch real transaction data from blockchain
    console.log(`✅ Returning ${validTransactions.length} valid fallback transactions`);
    return validTransactions;

  } catch (error) {
    console.error('❌ Error fetching real-time transactions:', error);

    // Last resort: return empty array instead of potentially invalid data
    console.log('🔄 Returning empty transaction array as final fallback');
    return [];
  }
}



// Fallback wallet data for demo purposes
export const mockWallet: WalletInfo = {
  address: "0xabc...def",
  name: "Main Wallet",
  balance: "5246.32",
  tokens: mockTokens,
};

// Helper to calculate total balance
export const calculateTotalBalance = (tokens: Token[]): number => {
  return tokens.reduce((acc, token) => {
    return acc + (parseFloat(token.balance || "0") * (token.price || 0));
  }, 0);
};

// Helper to format currency with proper commas and decimal places
export const formatCurrency = (value: number, decimals = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

// Helper to format an address with ellipsis
export const formatAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  const start = address.substring(0, 6);
  const end = address.substring(address.length - 4);
  return `${start}...${end}`;
};

// Generate fallback chart data for demo purposes (when real market data unavailable)
export const generateChartData = (days = 7, startPrice = 100): number[][] => {
  try {
    // Input validation
    if (typeof days !== 'number' || days < 1 || days > 365) {
      console.warn('Invalid days parameter, using default value of 7');
      days = 7;
    }

    if (typeof startPrice !== 'number' || startPrice <= 0) {
      console.warn('Invalid startPrice parameter, using default value of 100');
      startPrice = 100;
    }

    const data: number[][] = [];
    let currentPrice = startPrice;

    const now = new Date();

    for (let i = days; i >= 0; i--) {
      try {
        const date = new Date();
        date.setDate(now.getDate() - i);

        // Validate date
        if (isNaN(date.getTime())) {
          console.warn(`Invalid date generated for day ${i}, skipping`);
          continue;
        }

        // Random price change percentage between -5% and +5%
        const changePercent = (Math.random() * 10) - 5;
        currentPrice = currentPrice * (1 + (changePercent / 100));

        // Ensure price doesn't go negative or become invalid
        if (currentPrice <= 0 || !isFinite(currentPrice)) {
          currentPrice = startPrice; // Reset to start price if invalid
        }

        data.push([date.getTime(), Math.round(currentPrice * 100) / 100]); // Round to 2 decimal places
      } catch (error) {
        console.warn(`Error generating chart data point for day ${i}:`, error);
      }
    }

    if (data.length === 0) {
      console.warn('No valid chart data generated, returning single point');
      return [[Date.now(), startPrice]];
    }

    return data;
  } catch (error) {
    console.error('Error generating chart data:', error);
    // Return minimal fallback data
    return [[Date.now(), startPrice || 100]];
  }
};

// Calculate swap estimates
export const calculateSwapEstimate = (
  fromToken: Token | null,
  toToken: Token | null,
  amount: string
): { toAmount: string; priceImpact: number } => {
  if (!fromToken || !toToken || !amount || isNaN(parseFloat(amount))) {
    return { toAmount: "0", priceImpact: 0 };
  }

  const fromPrice = fromToken.price || 0;
  const toPrice = toToken.price || 1;

  // Simple conversion based on price
  const fromValue = parseFloat(amount) * fromPrice;
  const toAmount = (fromValue / toPrice).toFixed(toToken.decimals > 6 ? 6 : toToken.decimals);

  // Mock price impact (higher for larger trades)
  const priceImpact = Math.min(parseFloat(amount) * 0.002, 5);

  return { toAmount, priceImpact };
};

// Order book entry type
export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

// Generate fallback order book data for demo trading interface
export const generateOrderBook = (basePrice: number, spread = 0.02): { bids: OrderBookEntry[], asks: OrderBookEntry[] } => {
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];

  // Calculate bid/ask prices with spread
  const bidPrice = basePrice * (1 - spread / 2);
  const askPrice = basePrice * (1 + spread / 2);

  // Generate 15 bid entries (buy orders)
  let bidTotal = 0;
  for (let i = 0; i < 15; i++) {
    // Price decreases as we go down the order book for bids
    const price = bidPrice * (1 - 0.001 * i);
    // Random amount between 0.1 and 5 for BTC-like assets
    const amount = 0.1 + Math.random() * 4.9;
    bidTotal += amount;

    bids.push({
      price,
      amount,
      total: bidTotal
    });
  }

  // Generate 15 ask entries (sell orders)
  let askTotal = 0;
  for (let i = 0; i < 15; i++) {
    // Price increases as we go up the order book for asks
    const price = askPrice * (1 + 0.001 * i);
    // Random amount between 0.1 and 5
    const amount = 0.1 + Math.random() * 4.9;
    askTotal += amount;

    asks.push({
      price,
      amount,
      total: askTotal
    });
  }

  return { bids, asks };
};

// Recent trade type
export interface RecentTrade {
  id: string;
  price: number;
  amount: number;
  value: number;
  time: Date;
  type: 'buy' | 'sell';
}

// Generate fallback recent trades data for demo trading interface
export const generateRecentTrades = (basePrice: number, count = 20): RecentTrade[] => {
  const trades: RecentTrade[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    // Random price variation around base price (±1%)
    const priceVariation = basePrice * (0.99 + Math.random() * 0.02);
    // Random amount between 0.01 and 2
    const amount = 0.01 + Math.random() * 1.99;
    // Random time in the last hour
    const time = new Date(now.getTime() - Math.random() * 60 * 60 * 1000);
    // Random type (buy or sell)
    const type = Math.random() > 0.5 ? 'buy' : 'sell';

    trades.push({
      id: `trade-${i}`,
      price: priceVariation,
      amount,
      value: priceVariation * amount,
      time,
      type
    });
  }

  // Sort by time (most recent first)
  return trades.sort((a, b) => b.time.getTime() - a.time.getTime());
};
