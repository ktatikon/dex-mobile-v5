import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

// Define types
export type TestnetNetwork = 'sepolia' | 'ganache' | 'solana-devnet';

export interface TestnetWallet {
  id: string;
  name: string;
  network: TestnetNetwork;
  address: string;
  balance: string;
}

export interface TestnetTransaction {
  id: string;
  type: 'send' | 'receive';
  amount: string;
  tokenSymbol: string;
  timestamp: Date;
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  fromAddress?: string;
  toAddress?: string;
  network: TestnetNetwork;
}

interface TestnetContextType {
  activeNetwork: TestnetNetwork;
  setActiveNetwork: (network: TestnetNetwork) => void;
  wallets: TestnetWallet[];
  transactions: TestnetTransaction[];
  loading: boolean;
  error: Error | null;
  hasTestnetAccess: boolean;
  isAdminLoading: boolean;
  createWallet: (name: string, network: TestnetNetwork) => Promise<TestnetWallet | null>;
  importWallet: (privateKey: string, name: string, network: TestnetNetwork) => Promise<TestnetWallet | null>;
  sendTransaction: (to: string, amount: string, walletId: string) => Promise<string | null>;
  requestTestTokens: (walletId: string) => Promise<boolean>;
  refreshWalletData: () => Promise<void>;
}

const TestnetContext = createContext<TestnetContextType>({} as TestnetContextType);

export const useTestnet = () => useContext(TestnetContext);

export const TestnetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isAdmin, isLoading: isAdminLoading, hasPermission } = useAdmin();
  const { toast } = useToast();
  const [activeNetwork, setActiveNetwork] = useState<TestnetNetwork>('sepolia');
  const [wallets, setWallets] = useState<TestnetWallet[]>([]);
  const [transactions, setTransactions] = useState<TestnetTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check if user has testnet access
  const hasTestnetAccess = isAdmin && hasPermission('report_viewer');

  // Fetch wallet data when user, network, or admin status changes
  useEffect(() => {
    if (user && hasTestnetAccess) {
      refreshWalletData();
    } else {
      setWallets([]);
      setTransactions([]);
      setLoading(false);
    }
  }, [user, activeNetwork, hasTestnetAccess]);

  // Refresh wallet data
  const refreshWalletData = async () => {
    if (!user || !hasTestnetAccess) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch wallets from Supabase
      const { data: walletsData, error: walletsError } = await supabase
        .from('testnet_wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('network', activeNetwork);

      if (walletsError) {
        throw new Error(`Error fetching wallets: ${walletsError.message}`);
      }

      // Fetch transactions from Supabase
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('testnet_transactions')
        .select(`
          id,
          transaction_type,
          from_address,
          to_address,
          amount,
          token_symbol,
          hash,
          network,
          status,
          timestamp
        `)
        .eq('user_id', user.id)
        .eq('network', activeNetwork)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (transactionsError) {
        throw new Error(`Error fetching transactions: ${transactionsError.message}`);
      }

      // Update wallet balances from blockchain
      const updatedWallets = await Promise.all(
        walletsData.map(async (wallet) => {
          let balance = '0';

          try {
            if (wallet.network === 'sepolia' || wallet.network === 'ganache') {
              const provider = new ethers.JsonRpcProvider(
                wallet.network === 'sepolia'
                  ? 'https://eth-sepolia.g.alchemy.com/v2/demo'
                  : 'http://127.0.0.1:8545'
              );
              const ethBalance = await provider.getBalance(wallet.address);
              balance = ethers.formatEther(ethBalance);
            } else if (wallet.network === 'solana-devnet') {
              // For Solana, we'll just use the stored balance for now
              // In a real implementation, we would fetch from Solana network
              balance = wallet.balance || '0';
            }
          } catch (err) {
            console.error(`Error fetching balance for wallet ${wallet.id}:`, err);
          }

          return {
            id: wallet.id,
            name: wallet.name,
            network: wallet.network as TestnetNetwork,
            address: wallet.address,
            balance
          };
        })
      );

      // Format transactions
      const formattedTransactions = transactionsData.map(tx => ({
        id: tx.id,
        type: tx.transaction_type as 'send' | 'receive',
        amount: tx.amount,
        tokenSymbol: tx.token_symbol || 'ETH',
        timestamp: new Date(tx.timestamp),
        hash: tx.hash || '',
        status: tx.status as 'pending' | 'confirmed' | 'failed',
        fromAddress: tx.from_address,
        toAddress: tx.to_address,
        network: tx.network as TestnetNetwork
      }));

      setWallets(updatedWallets);
      setTransactions(formattedTransactions);
    } catch (err) {
      console.error('Error refreshing wallet data:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh wallet data'));
    } finally {
      setLoading(false);
    }
  };

  // Create a new wallet
  const createWallet = async (name: string, network: TestnetNetwork): Promise<TestnetWallet | null> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a wallet",
        variant: "destructive",
      });
      return null;
    }

    if (!hasTestnetAccess) {
      toast({
        title: "Access Denied",
        description: "Testnet functionality is restricted to administrators only",
        variant: "destructive",
      });
      return null;
    }

    try {
      let address = '';
      let privateKey = '';

      // Generate wallet based on network
      if (network === 'sepolia' || network === 'ganache') {
        const wallet = ethers.Wallet.createRandom();
        address = wallet.address;
        privateKey = wallet.privateKey;
      } else if (network === 'solana-devnet') {
        // For Solana, we would generate a keypair
        // For now, we'll just create a mock address
        address = `solana${Math.random().toString(16).substring(2, 14)}`;
        privateKey = `solana_private_key_${Math.random().toString(16).substring(2, 14)}`;
      }

      // Save to Supabase
      const walletId = uuidv4();
      const { error: insertError } = await supabase
        .from('testnet_wallets')
        .insert({
          id: walletId,
          user_id: user.id,
          name,
          network,
          address,
          private_key: privateKey,
          balance: '0'
        });

      if (insertError) {
        throw new Error(`Error creating wallet: ${insertError.message}`);
      }

      // Create initial balance record
      await supabase
        .from('testnet_balances')
        .insert({
          user_id: user.id,
          wallet_id: walletId,
          token_symbol: network === 'solana-devnet' ? 'SOL' : 'ETH',
          token_name: network === 'solana-devnet' ? 'Solana' : 'Ethereum',
          balance: '0',
          network
        });

      toast({
        title: "Wallet Created",
        description: `Your ${network} testnet wallet has been created successfully`,
      });

      // Refresh wallet data
      await refreshWalletData();

      return {
        id: walletId,
        name,
        network,
        address,
        balance: '0'
      };
    } catch (err) {
      console.error('Error creating wallet:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create wallet",
        variant: "destructive",
      });
      return null;
    }
  };

  // Import an existing wallet
  const importWallet = async (privateKey: string, name: string, network: TestnetNetwork): Promise<TestnetWallet | null> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to import a wallet",
        variant: "destructive",
      });
      return null;
    }

    if (!hasTestnetAccess) {
      toast({
        title: "Access Denied",
        description: "Testnet functionality is restricted to administrators only",
        variant: "destructive",
      });
      return null;
    }

    try {
      let address = '';

      // Validate and import wallet based on network
      if (network === 'sepolia' || network === 'ganache') {
        try {
          const wallet = new ethers.Wallet(privateKey);
          address = wallet.address;
        } catch (err) {
          throw new Error('Invalid Ethereum private key');
        }
      } else if (network === 'solana-devnet') {
        // For Solana, we would validate and import the keypair
        // For now, we'll just create a mock address
        if (!privateKey.startsWith('solana_')) {
          throw new Error('Invalid Solana private key');
        }
        address = `solana${Math.random().toString(16).substring(2, 14)}`;
      }

      // Save to Supabase
      const walletId = uuidv4();
      const { error: insertError } = await supabase
        .from('testnet_wallets')
        .insert({
          id: walletId,
          user_id: user.id,
          name,
          network,
          address,
          private_key: privateKey,
          balance: '0'
        });

      if (insertError) {
        throw new Error(`Error importing wallet: ${insertError.message}`);
      }

      // Create initial balance record
      await supabase
        .from('testnet_balances')
        .insert({
          user_id: user.id,
          wallet_id: walletId,
          token_symbol: network === 'solana-devnet' ? 'SOL' : 'ETH',
          token_name: network === 'solana-devnet' ? 'Solana' : 'Ethereum',
          balance: '0',
          network
        });

      toast({
        title: "Wallet Imported",
        description: `Your ${network} testnet wallet has been imported successfully`,
      });

      // Refresh wallet data
      await refreshWalletData();

      return {
        id: walletId,
        name,
        network,
        address,
        balance: '0'
      };
    } catch (err) {
      console.error('Error importing wallet:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to import wallet",
        variant: "destructive",
      });
      return null;
    }
  };

  // Send a transaction
  const sendTransaction = async (to: string, amount: string, walletId: string): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send a transaction",
        variant: "destructive",
      });
      return null;
    }

    if (!hasTestnetAccess || !hasPermission('transaction_manager')) {
      toast({
        title: "Access Denied",
        description: "Testnet transaction functionality requires transaction manager permissions",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Get wallet from Supabase
      const { data: walletData, error: walletError } = await supabase
        .from('testnet_wallets')
        .select('*')
        .eq('id', walletId)
        .eq('user_id', user.id)
        .single();

      if (walletError || !walletData) {
        throw new Error('Wallet not found');
      }

      let txHash = '';

      // Send transaction based on network
      if (walletData.network === 'sepolia' || walletData.network === 'ganache') {
        const provider = new ethers.JsonRpcProvider(
          walletData.network === 'sepolia'
            ? 'https://eth-sepolia.g.alchemy.com/v2/demo'
            : 'http://127.0.0.1:8545'
        );

        const wallet = new ethers.Wallet(walletData.private_key, provider);

        const tx = await wallet.sendTransaction({
          to,
          value: ethers.parseEther(amount)
        });

        txHash = tx.hash;
      } else if (walletData.network === 'solana-devnet') {
        // For Solana, we would send a transaction using the Solana web3.js library
        // For now, we'll just create a mock transaction hash
        txHash = `solana_tx_${Math.random().toString(16).substring(2, 30)}`;
      }

      // Save transaction to Supabase
      const txId = uuidv4();
      await supabase
        .from('testnet_transactions')
        .insert({
          id: txId,
          user_id: user.id,
          wallet_id: walletId,
          transaction_type: 'send',
          from_address: walletData.address,
          to_address: to,
          amount,
          token_symbol: walletData.network === 'solana-devnet' ? 'SOL' : 'ETH',
          hash: txHash,
          network: walletData.network,
          status: 'pending',
          timestamp: new Date().toISOString()
        });

      toast({
        title: "Transaction Sent",
        description: `Your transaction has been sent successfully`,
      });

      // Refresh wallet data
      await refreshWalletData();

      return txHash;
    } catch (err) {
      console.error('Error sending transaction:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send transaction",
        variant: "destructive",
      });
      return null;
    }
  };

  // Request test tokens from a faucet
  const requestTestTokens = async (walletId: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to request test tokens",
        variant: "destructive",
      });
      return false;
    }

    if (!hasTestnetAccess || !hasPermission('transaction_manager')) {
      toast({
        title: "Access Denied",
        description: "Testnet token request functionality requires transaction manager permissions",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Get wallet from Supabase
      const { data: walletData, error: walletError } = await supabase
        .from('testnet_wallets')
        .select('*')
        .eq('id', walletId)
        .eq('user_id', user.id)
        .single();

      if (walletError || !walletData) {
        throw new Error('Wallet not found');
      }

      // In a real implementation, we would call a faucet API
      // For now, we'll just simulate a successful faucet request

      // Create a mock transaction for the faucet request
      const txId = uuidv4();
      const txHash = `faucet_tx_${Math.random().toString(16).substring(2, 30)}`;

      await supabase
        .from('testnet_transactions')
        .insert({
          id: txId,
          user_id: user.id,
          wallet_id: walletId,
          transaction_type: 'receive',
          from_address: 'Faucet',
          to_address: walletData.address,
          amount: walletData.network === 'solana-devnet' ? '1' : '0.1',
          token_symbol: walletData.network === 'solana-devnet' ? 'SOL' : 'ETH',
          hash: txHash,
          network: walletData.network,
          status: 'confirmed',
          timestamp: new Date().toISOString()
        });

      // Update wallet balance
      const currentBalance = parseFloat(walletData.balance || '0');
      const newBalance = currentBalance + (walletData.network === 'solana-devnet' ? 1 : 0.1);

      await supabase
        .from('testnet_wallets')
        .update({ balance: newBalance.toString() })
        .eq('id', walletId);

      // Update balance record
      const { data: balanceData } = await supabase
        .from('testnet_balances')
        .select('*')
        .eq('wallet_id', walletId)
        .eq('token_symbol', walletData.network === 'solana-devnet' ? 'SOL' : 'ETH')
        .single();

      if (balanceData) {
        const currentTokenBalance = parseFloat(balanceData.balance || '0');
        const newTokenBalance = currentTokenBalance + (walletData.network === 'solana-devnet' ? 1 : 0.1);

        await supabase
          .from('testnet_balances')
          .update({ balance: newTokenBalance.toString() })
          .eq('id', balanceData.id);
      }

      toast({
        title: "Test Tokens Received",
        description: `You have received test ${walletData.network === 'solana-devnet' ? 'SOL' : 'ETH'} in your wallet`,
      });

      // Refresh wallet data
      await refreshWalletData();

      return true;
    } catch (err) {
      console.error('Error requesting test tokens:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to request test tokens",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <TestnetContext.Provider
      value={{
        activeNetwork,
        setActiveNetwork,
        wallets,
        transactions,
        loading,
        error,
        hasTestnetAccess,
        isAdminLoading,
        createWallet,
        importWallet,
        sendTransaction,
        requestTestTokens,
        refreshWalletData,
      }}
    >
      {children}
    </TestnetContext.Provider>
  );
};
