export type AMLRiskLevel = 'low' | 'medium' | 'high';
export type AMLCheckStatus = 'pending' | 'completed' | 'failed';
export type BlockchainNetwork = 'ethereum' | 'bitcoin' | 'polygon' | 'bsc' | 'arbitrum' | 'optimism' | 'avalanche' | 'fantom';

export interface AMLCheckRequest {
  id: string;
  user_id: string;
  chain: BlockchainNetwork;
  address: string;
  risk_level?: AMLRiskLevel;
  status: AMLCheckStatus;
  result?: AMLCheckResult;
  created_at: string;
  updated_at?: string;
}

export interface AMLCheckResult {
  address: string;
  chain: BlockchainNetwork;
  risk_level: AMLRiskLevel;
  risk_score: number; // 0-100
  flags: AMLFlag[];
  analysis: {
    total_transactions: number;
    total_volume: number;
    first_seen: string;
    last_seen: string;
    associated_addresses: number;
    suspicious_patterns: string[];
  };
  sources: AMLSource[];
  recommendations: string[];
}

export interface AMLFlag {
  type: 'sanctions' | 'darknet' | 'mixer' | 'exchange' | 'gambling' | 'scam' | 'phishing' | 'ransomware';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number; // 0-100
  source: string;
}

export interface AMLSource {
  name: string;
  type: 'government' | 'commercial' | 'community' | 'blockchain';
  last_updated: string;
  reliability: number; // 0-100
}

export interface AMLFormData {
  chain: BlockchainNetwork;
  address: string;
}

export interface AMLHistoryFilters {
  chain?: BlockchainNetwork;
  risk_level?: AMLRiskLevel;
  status?: AMLCheckStatus;
  date_from?: string;
  date_to?: string;
}

// Network configuration for address validation
export const NETWORK_CONFIG: Record<BlockchainNetwork, {
  name: string;
  addressPattern: RegExp;
  addressLength: number[];
  examples: string[];
}> = {
  ethereum: {
    name: 'Ethereum',
    addressPattern: /^0x[a-fA-F0-9]{40}$/,
    addressLength: [42],
    examples: ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45']
  },
  bitcoin: {
    name: 'Bitcoin',
    addressPattern: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
    addressLength: [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 42, 62],
    examples: ['1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4']
  },
  polygon: {
    name: 'Polygon',
    addressPattern: /^0x[a-fA-F0-9]{40}$/,
    addressLength: [42],
    examples: ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45']
  },
  bsc: {
    name: 'Binance Smart Chain',
    addressPattern: /^0x[a-fA-F0-9]{40}$/,
    addressLength: [42],
    examples: ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45']
  },
  arbitrum: {
    name: 'Arbitrum',
    addressPattern: /^0x[a-fA-F0-9]{40}$/,
    addressLength: [42],
    examples: ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45']
  },
  optimism: {
    name: 'Optimism',
    addressPattern: /^0x[a-fA-F0-9]{40}$/,
    addressLength: [42],
    examples: ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45']
  },
  avalanche: {
    name: 'Avalanche',
    addressPattern: /^0x[a-fA-F0-9]{40}$/,
    addressLength: [42],
    examples: ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45']
  },
  fantom: {
    name: 'Fantom',
    addressPattern: /^0x[a-fA-F0-9]{40}$/,
    addressLength: [42],
    examples: ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45']
  }
};

// Risk level configuration
export const RISK_LEVEL_CONFIG: Record<AMLRiskLevel, {
  color: string;
  bgColor: string;
  label: string;
  description: string;
}> = {
  low: {
    color: 'text-green-400',
    bgColor: 'bg-green-600',
    label: 'Low Risk',
    description: 'Address appears to be legitimate with no suspicious activity detected'
  },
  medium: {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-600',
    label: 'Medium Risk',
    description: 'Some suspicious patterns detected, proceed with caution'
  },
  high: {
    color: 'text-red-400',
    bgColor: 'bg-red-600',
    label: 'High Risk',
    description: 'Significant suspicious activity detected, high risk of fraud'
  }
};
