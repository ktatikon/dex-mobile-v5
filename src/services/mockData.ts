
import { Token, Transaction, TransactionStatus, TransactionType, WalletInfo } from "@/types";
import { fetchTokenList, adaptCoinGeckoData } from "./realTimeData";

// Mock balances for demo purposes (these would come from user's actual wallet in production)
const MOCK_BALANCES: Record<string, string> = {
  "ethereum": "1.5263",
  "bitcoin": "0.0358",
  "usd-coin": "523.67",
  "tether": "745.21",
  "solana": "12.431",
  "cardano": "452.16",
  "binancecoin": "3.482",
  "ripple": "1250.32",
};

// Fallback mock tokens (used when API fails)
const FALLBACK_MOCK_TOKENS: Token[] = [
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
 * Gets real-time token data with mock balances
 * This function fetches live prices from CoinGecko but uses mock balances for demo
 */
export async function getRealTimeTokens(): Promise<Token[]> {
  try {
    console.log('Fetching real-time token data...');

    // Fetch real-time data from CoinGecko
    const coinGeckoData = await fetchTokenList('usd');
    const realTimeTokens = adaptCoinGeckoData(coinGeckoData);

    // Add mock balances to the real-time data
    const tokensWithBalances = realTimeTokens.map(token => ({
      ...token,
      balance: MOCK_BALANCES[token.id] || "0",
      // Ensure we have proper logo paths
      logo: token.logo.startsWith('http') ? token.logo : `/crypto-icons/${token.symbol.toLowerCase()}.svg`
    }));

    console.log(`Successfully loaded ${tokensWithBalances.length} tokens with real-time prices`);
    return tokensWithBalances;

  } catch (error) {
    console.error('Error fetching real-time tokens, using fallback data:', error);
    return FALLBACK_MOCK_TOKENS;
  }
}

// Export the real-time tokens as mockTokens for backward compatibility
export let mockTokens: Token[] = FALLBACK_MOCK_TOKENS;

// Initialize real-time data
getRealTimeTokens().then(tokens => {
  mockTokens = tokens;
  console.log('Mock tokens updated with real-time data');
}).catch(error => {
  console.error('Failed to initialize real-time data:', error);
});

// Mock transactions
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

// Mock wallet data
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

// Generate mock chart data (simple random values)
export const generateChartData = (days = 7, startPrice = 100): number[][] => {
  const data: number[][] = [];
  let currentPrice = startPrice;

  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);

    // Random price change percentage between -5% and +5%
    const changePercent = (Math.random() * 10) - 5;
    currentPrice = currentPrice * (1 + (changePercent / 100));

    data.push([date.getTime(), currentPrice]);
  }

  return data;
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

// Generate mock order book data
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

// Generate mock recent trades
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
