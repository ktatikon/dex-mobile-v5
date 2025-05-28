/**
 * Phase 2: Real Transaction History Service
 * Replaces mockTransactions with actual blockchain transaction data
 */

import { Transaction, TransactionStatus, TransactionType } from '@/types';
import { RealTransaction, walletConnectivityService } from './walletConnectivityService';

// Blockchain API configurations for transaction fetching
const TRANSACTION_APIS = {
  ethereum: {
    mainnet: 'https://api.etherscan.io/api',
    apiKey: process.env.VITE_ETHERSCAN_API_KEY || 'YourEtherscanAPIKey'
  },
  bitcoin: {
    mainnet: 'https://blockstream.info/api'
  },
  polygon: {
    mainnet: 'https://api.polygonscan.com/api',
    apiKey: process.env.VITE_POLYGONSCAN_API_KEY || 'YourPolygonscanAPIKey'
  }
};

class RealTransactionService {
  private transactionCache: Map<string, { transactions: RealTransaction[], timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch real transaction history for a wallet address
   */
  async fetchTransactionHistory(
    address: string,
    network: string = 'ethereum',
    limit: number = 50
  ): Promise<RealTransaction[]> {
    const cacheKey = `${address}_${network}_${limit}`;

    // Check cache first
    const cached = this.transactionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('Returning cached transaction history');
      return cached.transactions;
    }

    try {
      let transactions: RealTransaction[] = [];

      switch (network) {
        case 'ethereum':
          transactions = await this.fetchEthereumTransactions(address, limit);
          break;
        case 'bitcoin':
          transactions = await this.fetchBitcoinTransactions(address, limit);
          break;
        case 'polygon':
          transactions = await this.fetchPolygonTransactions(address, limit);
          break;
        default:
          console.warn(`Transaction fetching not implemented for network: ${network}`);
          return [];
      }

      // Cache the results
      this.transactionCache.set(cacheKey, {
        transactions,
        timestamp: Date.now()
      });

      console.log(`Fetched ${transactions.length} real transactions for ${network}`);
      return transactions;

    } catch (error) {
      console.error(`Error fetching transaction history for ${network}:`, error);

      // Return cached data if available
      const cached = this.transactionCache.get(cacheKey);
      if (cached) {
        console.log('Returning stale cached transactions due to API error');
        return cached.transactions;
      }

      return [];
    }
  }

  /**
   * Fetch Ethereum transaction history
   */
  private async fetchEthereumTransactions(address: string, limit: number): Promise<RealTransaction[]> {
    const transactions: RealTransaction[] = [];
    const api = TRANSACTION_APIS.ethereum;

    try {
      // Fetch normal ETH transactions
      const normalTxResponse = await fetch(
        `${api.mainnet}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${api.apiKey}`
      );
      const normalTxData = await normalTxResponse.json();

      if (normalTxData.status === '1' && normalTxData.result) {
        for (const tx of normalTxData.result) {
          transactions.push({
            id: tx.hash,
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: (parseInt(tx.value) / 1e18).toString(),
            tokenSymbol: 'ETH',
            tokenId: 'ethereum',
            timestamp: new Date(parseInt(tx.timeStamp) * 1000),
            blockNumber: parseInt(tx.blockNumber),
            gasUsed: tx.gasUsed,
            gasPrice: tx.gasPrice,
            status: tx.txreceipt_status === '1' ? 'confirmed' : 'failed',
            network: 'ethereum',
            type: tx.from.toLowerCase() === address.toLowerCase() ? 'send' : 'receive'
          });
        }
      }

      // Fetch ERC-20 token transactions
      const tokenTxResponse = await fetch(
        `${api.mainnet}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${api.apiKey}`
      );
      const tokenTxData = await tokenTxResponse.json();

      if (tokenTxData.status === '1' && tokenTxData.result) {
        for (const tx of tokenTxData.result) {
          const decimals = parseInt(tx.tokenDecimal);
          const value = (parseInt(tx.value) / Math.pow(10, decimals)).toString();

          transactions.push({
            id: `${tx.hash}_${tx.tokenSymbol}`,
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value,
            tokenSymbol: tx.tokenSymbol,
            tokenId: this.getTokenIdFromSymbol(tx.tokenSymbol),
            timestamp: new Date(parseInt(tx.timeStamp) * 1000),
            blockNumber: parseInt(tx.blockNumber),
            gasUsed: tx.gasUsed,
            gasPrice: tx.gasPrice,
            status: 'confirmed',
            network: 'ethereum',
            type: tx.from.toLowerCase() === address.toLowerCase() ? 'send' : 'receive'
          });
        }
      }

    } catch (error) {
      console.error('Error fetching Ethereum transactions:', error);
    }

    // Sort by timestamp (most recent first) and limit results
    return transactions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Fetch Bitcoin transaction history
   */
  private async fetchBitcoinTransactions(address: string, limit: number): Promise<RealTransaction[]> {
    const transactions: RealTransaction[] = [];

    try {
      const response = await fetch(`${TRANSACTION_APIS.bitcoin.mainnet}/address/${address}/txs`);
      const txData = await response.json();

      if (Array.isArray(txData)) {
        for (const tx of txData.slice(0, limit)) {
          // Determine if this is a send or receive transaction
          const isReceive = tx.vout.some((output: any) =>
            output.scriptpubkey_address === address
          );
          const isSend = tx.vin.some((input: any) =>
            input.prevout && input.prevout.scriptpubkey_address === address
          );

          let value = '0';
          let type: 'send' | 'receive' = 'receive';

          if (isReceive && !isSend) {
            // Pure receive transaction
            const receiveOutput = tx.vout.find((output: any) =>
              output.scriptpubkey_address === address
            );
            value = (receiveOutput.value / 1e8).toString();
            type = 'receive';
          } else if (isSend) {
            // Send transaction (calculate sent amount)
            const sentAmount = tx.vin
              .filter((input: any) => input.prevout && input.prevout.scriptpubkey_address === address)
              .reduce((sum: number, input: any) => sum + input.prevout.value, 0);
            value = (sentAmount / 1e8).toString();
            type = 'send';
          }

          transactions.push({
            id: tx.txid,
            hash: tx.txid,
            from: type === 'send' ? address : 'unknown',
            to: type === 'receive' ? address : 'unknown',
            value,
            tokenSymbol: 'BTC',
            tokenId: 'bitcoin',
            timestamp: new Date(tx.status.block_time * 1000),
            blockNumber: tx.status.block_height,
            gasUsed: tx.fee.toString(),
            gasPrice: '0',
            status: tx.status.confirmed ? 'confirmed' : 'pending',
            network: 'bitcoin',
            type
          });
        }
      }

    } catch (error) {
      console.error('Error fetching Bitcoin transactions:', error);
    }

    return transactions;
  }

  /**
   * Fetch Polygon transaction history (similar to Ethereum)
   */
  private async fetchPolygonTransactions(address: string, limit: number): Promise<RealTransaction[]> {
    // Implementation similar to Ethereum but using Polygon API
    console.log('Polygon transaction fetching not fully implemented yet');
    return [];
  }

  /**
   * Convert real transactions to our app's Transaction format
   */
  convertToAppTransactions(realTransactions: RealTransaction[]): Transaction[] {
    return realTransactions.map(tx => {
      const baseTransaction: Transaction = {
        id: tx.id,
        type: this.mapTransactionType(tx.type),
        status: this.mapTransactionStatus(tx.status),
        timestamp: tx.timestamp.getTime(),
        hash: tx.hash,
        account: tx.from,
        from: tx.from,
        to: tx.to,
        fee: tx.gasUsed,
        chain: tx.network
      };

      // Add token and amount based on transaction type
      if (tx.type === 'send') {
        baseTransaction.fromAmount = tx.value;
        baseTransaction.amount = tx.value;
      } else if (tx.type === 'receive') {
        baseTransaction.toAmount = tx.value;
        baseTransaction.amount = tx.value;
      } else {
        baseTransaction.amount = tx.value;
      }

      return baseTransaction;
    });
  }

  /**
   * Map real transaction type to app transaction type
   */
  private mapTransactionType(type: string): string {
    switch (type) {
      case 'send':
        return TransactionType.SEND;
      case 'receive':
        return TransactionType.RECEIVE;
      case 'swap':
        return TransactionType.SWAP;
      case 'stake':
        return TransactionType.STAKE;
      case 'unstake':
        return TransactionType.UNSTAKE;
      default:
        return TransactionType.SEND;
    }
  }

  /**
   * Map real transaction status to app transaction status
   */
  private mapTransactionStatus(status: string): string {
    switch (status) {
      case 'confirmed':
        return TransactionStatus.COMPLETED;
      case 'pending':
        return TransactionStatus.PENDING;
      case 'failed':
        return TransactionStatus.FAILED;
      default:
        return TransactionStatus.PENDING;
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
   * Get transaction history for all connected wallets
   */
  async getAllWalletTransactions(limit: number = 100): Promise<Transaction[]> {
    const connectedWallets = walletConnectivityService.getConnectedWallets();
    const allTransactions: RealTransaction[] = [];

    for (const wallet of connectedWallets) {
      try {
        const transactions = await this.fetchTransactionHistory(
          wallet.address,
          wallet.network,
          limit
        );
        allTransactions.push(...transactions);
      } catch (error) {
        console.error(`Error fetching transactions for wallet ${wallet.address}:`, error);
      }
    }

    // Sort all transactions by timestamp and convert to app format
    const sortedTransactions = allTransactions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    return this.convertToAppTransactions(sortedTransactions);
  }

  /**
   * Clear transaction cache
   */
  clearCache(): void {
    this.transactionCache.clear();
  }
}

// Export singleton instance
export const realTransactionService = new RealTransactionService();
export default realTransactionService;
