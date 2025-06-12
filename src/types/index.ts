
// Token data structure
export interface Token {
  id: string;
  symbol: string;
  name: string;
  logo: string;
  decimals: number;
  balance?: string;
  price?: number;
  priceChange24h?: number;
  isApproved?: boolean;
  // Real-time market data from CoinGecko API
  market_cap?: number;
  circulating_supply?: number;
  total_supply?: number;
  market_cap_rank?: number;
}

// Transaction types
export enum TransactionType {
  SWAP = 'swap',
  SEND = 'send',
  RECEIVE = 'receive',
  APPROVE = 'approve',
  ADD_LIQUIDITY = 'add_liquidity',
  REMOVE_LIQUIDITY = 'remove_liquidity'
}

// Transaction status
export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Transaction data structure
export interface Transaction {
  id: string;
  type: TransactionType | string;
  fromToken?: Token;
  toToken?: Token;
  token?: Token;  // For simplified transactions (send/receive)
  fromAmount?: string;
  toAmount?: string;
  amount?: string; // For simplified transactions (send/receive)
  timestamp: string | number;
  hash: string;
  status: TransactionStatus | string;
  account: string;
  from?: string;   // Sender address
  to?: string;     // Recipient address
  fee?: string;    // Transaction fee
  chain?: string;  // Blockchain network (ethereum, solana, etc.)
  memo?: string;   // Optional transaction memo/note
  blockNumber?: number; // Block number where transaction was included
  confirmations?: number; // Number of confirmations
}

// User/Wallet information
export interface WalletInfo {
  address: string;
  name?: string;
  balance: string;
  tokens: Token[];
}

// Price info with chart data
export interface PriceData {
  currentPrice: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  chartData?: number[][];
}

// Swap parameters
export interface SwapParams {
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
  toAmount: string;
  slippage: number;
  deadline: number;
  priceImpact: number;
  minimumReceived: string;
  fee: string;
}
