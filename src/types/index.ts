
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
  type: TransactionType;
  fromToken?: Token;
  toToken?: Token;
  fromAmount?: string;
  toAmount?: string;
  timestamp: number;
  hash: string;
  status: TransactionStatus;
  account: string;
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
