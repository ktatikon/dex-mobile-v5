import { ethers } from 'ethers';

// Network configurations
export const NETWORKS = {
  sepolia: {
    name: 'Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo',
    blockExplorer: 'https://sepolia.etherscan.io',
    symbol: 'ETH',
    faucetUrl: 'https://sepoliafaucet.com/',
  },
  ganache: {
    name: 'Ganache (Local)',
    chainId: 1337,
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: '',
    symbol: 'ETH',
    faucetUrl: '',
  },
};

// Create provider for a specific network
export const getProvider = (network: 'sepolia' | 'ganache') => {
  return new ethers.JsonRpcProvider(NETWORKS[network].rpcUrl);
};

// Create wallet from private key
export const createWalletFromPrivateKey = (privateKey: string, network: 'sepolia' | 'ganache') => {
  const provider = getProvider(network);
  return new ethers.Wallet(privateKey, provider);
};

// Create new random wallet
export const createRandomWallet = (network: 'sepolia' | 'ganache') => {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
};

// Get balance for address
export const getBalance = async (address: string, network: 'sepolia' | 'ganache') => {
  try {
    const provider = getProvider(network);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting balance:', error);
    return '0';
  }
};

// Send transaction
export const sendTransaction = async (
  privateKey: string,
  toAddress: string,
  amount: string,
  network: 'sepolia' | 'ganache'
) => {
  try {
    const wallet = createWalletFromPrivateKey(privateKey, network);
    
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: ethers.parseEther(amount),
    });
    
    return tx.hash;
  } catch (error) {
    console.error('Error sending transaction:', error);
    throw error;
  }
};

// Get transaction receipt
export const getTransactionReceipt = async (txHash: string, network: 'sepolia' | 'ganache') => {
  try {
    const provider = getProvider(network);
    return provider.getTransactionReceipt(txHash);
  } catch (error) {
    console.error('Error getting transaction receipt:', error);
    return null;
  }
};

// Get transaction details
export const getTransaction = async (txHash: string, network: 'sepolia' | 'ganache') => {
  try {
    const provider = getProvider(network);
    return provider.getTransaction(txHash);
  } catch (error) {
    console.error('Error getting transaction:', error);
    return null;
  }
};

// Format address for display
export const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Start Ganache local blockchain
export const startGanache = async () => {
  try {
    // In a real implementation, we would start Ganache programmatically
    // For now, we'll just assume Ganache is running
    return true;
  } catch (error) {
    console.error('Error starting Ganache:', error);
    return false;
  }
};

// Check if Ganache is running
export const isGanacheRunning = async () => {
  try {
    const provider = getProvider('ganache');
    await provider.getBlockNumber();
    return true;
  } catch (error) {
    console.error('Ganache is not running:', error);
    return false;
  }
};
