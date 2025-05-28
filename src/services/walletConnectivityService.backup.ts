/**
 * Phase 2: Wallet Connectivity Service for Real Balance Integration
 * Replaces mock balances with actual cryptocurrency wallet balances
 */

import { Token } from '@/types';

// Blockchain API configurations
const BLOCKCHAIN_APIS = {
  ethereum: {
    mainnet: 'https://api.etherscan.io/api',
    apiKey: process.env.VITE_ETHERSCAN_API_KEY || 'YourEtherscanAPIKey'
  },
  bitcoin: {
    mainnet: 'https://blockstream.info/api',
    testnet: 'https://blockstream.info/testnet/api'
  },
  polygon: {
    mainnet: 'https://api.polygonscan.com/api',
    apiKey: process.env.VITE_POLYGONSCAN_API_KEY || 'YourPolygonscanAPIKey'
  },
  bsc: {
    mainnet: 'https://api.bscscan.com/api',
    apiKey: process.env.VITE_BSCSCAN_API_KEY || 'YourBscscanAPIKey'
  }
};

// Token contract addresses for different networks
const TOKEN_CONTRACTS = {
  ethereum: {
    'ethereum': 'native', // ETH is native
    'usd-coin': '0xA0b86a33E6441b8C4505E2c8c5E6e8b8C4505E2c8', // USDC
    'tether': '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    'binancecoin': '0xB8c77482e45F1F44dE1745F52C74426C631bDD52' // BNB
  },
  polygon: {
    'usd-coin': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
    'tether': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' // USDT on Polygon
  },
  bsc: {
    'binancecoin': 'native', // BNB is native on BSC
    'usd-coin': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC on BSC
    'tether': '0x55d398326f99059fF775485246999027B3197955' // USDT on BSC
  }
};

export interface WalletBalance {
  tokenId: string;
  symbol: string;
  balance: string;
  balanceUSD: number;
  network: string;
  address: string;
  lastUpdated: Date;
}

export interface WalletConnection {
  address: string;
  network: string;
  provider: string;
  isConnected: boolean;
  balances: WalletBalance[];
}

export interface RealTransaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  tokenId: string;
  timestamp: Date;
  blockNumber: number;
  gasUsed: string;
  gasPrice: string;
  status: 'confirmed' | 'pending' | 'failed';
  network: string;
  type: 'send' | 'receive' | 'swap' | 'stake' | 'unstake';
}

class WalletConnectivityService {
  private connectedWallets: Map<string, WalletConnection> = new Map();
  private balanceCache: Map<string, { balances: WalletBalance[], timestamp: number }> = new Map();
  private transactionCache: Map<string, { transactions: RealTransaction[], timestamp: number }> = new Map();
  
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for balance cache
  private readonly TRANSACTION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for transaction cache

  /**
   * Connect to a wallet and fetch initial balances
   */
  async connectWallet(address: string, network: string = 'ethereum', provider: string = 'metamask'): Promise<WalletConnection> {
    try {
      console.log(`Connecting to wallet: ${address} on ${network}`);
      
      // Validate address format
      if (!this.isValidAddress(address, network)) {
        throw new Error(`Invalid ${network} address format`);
      }

      // Fetch initial balances
      const balances = await this.fetchWalletBalances(address, network);
      
      const walletConnection: WalletConnection = {
        address,
        network,
        provider,
        isConnected: true,
        balances
      };

      // Store the connection
      const walletKey = `${address}_${network}`;
      this.connectedWallets.set(walletKey, walletConnection);
      
      console.log(`Successfully connected wallet with ${balances.length} token balances`);
      return walletConnection;
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw new Error(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch real balances for a wallet address
   */
  async fetchWalletBalances(address: string, network: string = 'ethereum'): Promise<WalletBalance[]> {
    const cacheKey = `${address}_${network}`;
    
    // Check cache first
    const cached = this.balanceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('Returning cached wallet balances');
      return cached.balances;
    }

    try {
      const balances: WalletBalance[] = [];
      
      switch (network) {
        case 'ethereum':
          const ethBalances = await this.fetchEthereumBalances(address);
          balances.push(...ethBalances);
          break;
          
        case 'bitcoin':
          const btcBalance = await this.fetchBitcoinBalance(address);
          if (btcBalance) balances.push(btcBalance);
          break;
          
        case 'polygon':
          const polygonBalances = await this.fetchPolygonBalances(address);
          balances.push(...polygonBalances);
          break;
          
        case 'bsc':
          const bscBalances = await this.fetchBSCBalances(address);
          balances.push(...bscBalances);
          break;
          
        default:
          throw new Error(`Unsupported network: ${network}`);
      }

      // Cache the results
      this.balanceCache.set(cacheKey, {
        balances,
        timestamp: Date.now()
      });

      console.log(`Fetched ${balances.length} real balances for ${network} wallet`);
      return balances;
      
    } catch (error) {
      console.error(`Error fetching ${network} balances:`, error);
      
      // Return cached data if available, otherwise empty array
      const cached = this.balanceCache.get(cacheKey);
      if (cached) {
        console.log('Returning stale cached balances due to API error');
        return cached.balances;
      }
      
      return [];
    }
  }

  /**
   * Fetch Ethereum and ERC-20 token balances
   */
  private async fetchEthereumBalances(address: string): Promise<WalletBalance[]> {
    const balances: WalletBalance[] = [];
    const api = BLOCKCHAIN_APIS.ethereum;

    try {
      // Fetch ETH balance
      const ethResponse = await fetch(
        `${api.mainnet}?module=account&action=balance&address=${address}&tag=latest&apikey=${api.apiKey}`
      );
      const ethData = await ethResponse.json();
      
      if (ethData.status === '1') {
        const ethBalance = (parseInt(ethData.result) / 1e18).toString();
        balances.push({
          tokenId: 'ethereum',
          symbol: 'ETH',
          balance: ethBalance,
          balanceUSD: 0, // Will be calculated with current price
          network: 'ethereum',
          address,
          lastUpdated: new Date()
        });
      }

      // Fetch ERC-20 token balances
      const tokenListResponse = await fetch(
        `${api.mainnet}?module=account&action=tokentx&address=${address}&startblock=0&endblock=999999999&sort=desc&apikey=${api.apiKey}`
      );
      const tokenData = await tokenListResponse.json();
      
      if (tokenData.status === '1' && tokenData.result) {
        // Get unique tokens from transaction history
        const uniqueTokens = new Map();
        tokenData.result.forEach((tx: any) => {
          if (!uniqueTokens.has(tx.contractAddress)) {
            uniqueTokens.set(tx.contractAddress, {
              symbol: tx.tokenSymbol,
              decimals: parseInt(tx.tokenDecimal)
            });
          }
        });

        // Fetch balance for each token
        for (const [contractAddress, tokenInfo] of uniqueTokens) {
          try {
            const balanceResponse = await fetch(
              `${api.mainnet}?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest&apikey=${api.apiKey}`
            );
            const balanceData = await balanceResponse.json();
            
            if (balanceData.status === '1' && parseInt(balanceData.result) > 0) {
              const balance = (parseInt(balanceData.result) / Math.pow(10, tokenInfo.decimals)).toString();
              balances.push({
                tokenId: this.getTokenIdFromSymbol(tokenInfo.symbol),
                symbol: tokenInfo.symbol,
                balance,
                balanceUSD: 0,
                network: 'ethereum',
                address,
                lastUpdated: new Date()
              });
            }
          } catch (error) {
            console.warn(`Error fetching balance for token ${tokenInfo.symbol}:`, error);
          }
        }
      }

    } catch (error) {
      console.error('Error fetching Ethereum balances:', error);
    }

    return balances;
  }

  /**
   * Fetch Bitcoin balance
   */
  private async fetchBitcoinBalance(address: string): Promise<WalletBalance | null> {
    try {
      const response = await fetch(`${BLOCKCHAIN_APIS.bitcoin.mainnet}/address/${address}`);
      const data = await response.json();
      
      if (data.chain_stats) {
        const balance = (data.chain_stats.funded_txo_sum / 1e8).toString();
        return {
          tokenId: 'bitcoin',
          symbol: 'BTC',
          balance,
          balanceUSD: 0,
          network: 'bitcoin',
          address,
          lastUpdated: new Date()
        };
      }
    } catch (error) {
      console.error('Error fetching Bitcoin balance:', error);
    }
    
    return null;
  }

  /**
   * Fetch Polygon balances (similar to Ethereum)
   */
  private async fetchPolygonBalances(address: string): Promise<WalletBalance[]> {
    // Implementation similar to Ethereum but using Polygon API
    // For brevity, returning empty array - full implementation would be similar to fetchEthereumBalances
    console.log('Polygon balance fetching not fully implemented yet');
    return [];
  }

  /**
   * Fetch BSC balances (similar to Ethereum)
   */
  private async fetchBSCBalances(address: string): Promise<WalletBalance[]> {
    // Implementation similar to Ethereum but using BSC API
    // For brevity, returning empty array - full implementation would be similar to fetchEthereumBalances
    console.log('BSC balance fetching not fully implemented yet');
    return [];
  }

  /**
   * Validate address format for different networks
   */
  private isValidAddress(address: string, network: string): boolean {
    switch (network) {
      case 'ethereum':
      case 'polygon':
      case 'bsc':
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      case 'bitcoin':
        return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || /^bc1[a-z0-9]{39,59}$/.test(address);
      default:
        return false;
    }
  }

  /**
   * Map token symbol to our internal token ID
   */
  private getTokenIdFromSymbol(symbol: string): string {
    const symbolMap: Record<string, string> = {
      'ETH': 'ethereum',
      'BTC': 'bitcoin',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'BNB': 'binancecoin',
      'MATIC': 'matic-network',
      'SOL': 'solana',
      'ADA': 'cardano',
      'XRP': 'ripple'
    };
    
    return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  /**
   * Get connected wallets
   */
  getConnectedWallets(): WalletConnection[] {
    return Array.from(this.connectedWallets.values());
  }

  /**
   * Disconnect a wallet
   */
  disconnectWallet(address: string, network: string): boolean {
    const walletKey = `${address}_${network}`;
    return this.connectedWallets.delete(walletKey);
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.balanceCache.clear();
    this.transactionCache.clear();
  }
}

// Export singleton instance
export const walletConnectivityService = new WalletConnectivityService();
export default walletConnectivityService;
