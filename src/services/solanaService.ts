import { Connection, PublicKey, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';

// Network configurations
export const SOLANA_NETWORKS = {
  'solana-devnet': {
    name: 'Solana Devnet',
    endpoint: 'https://api.devnet.solana.com',
    faucetUrl: 'https://solfaucet.com/',
    symbol: 'SOL',
    blockExplorer: 'https://explorer.solana.com/?cluster=devnet',
  },
};

// Create connection to Solana network
export const getConnection = (network: 'solana-devnet') => {
  return new Connection(SOLANA_NETWORKS[network].endpoint);
};

// Get balance for address
export const getBalance = async (address: string, network: 'solana-devnet') => {
  try {
    const connection = getConnection(network);
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    return (balance / LAMPORTS_PER_SOL).toString();
  } catch (error) {
    console.error('Error getting Solana balance:', error);
    return '0';
  }
};

// Format address for display
export const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
};

// Check if Phantom wallet is installed
export const isPhantomInstalled = () => {
  return typeof window !== 'undefined' && 
         window.solana && 
         window.solana.isPhantom;
};

// Connect to Phantom wallet
export const connectPhantom = async () => {
  if (!isPhantomInstalled()) {
    throw new Error('Phantom wallet is not installed');
  }
  
  try {
    const resp = await window.solana.connect();
    return resp.publicKey.toString();
  } catch (error) {
    console.error('Error connecting to Phantom wallet:', error);
    throw error;
  }
};

// Disconnect from Phantom wallet
export const disconnectPhantom = async () => {
  if (!isPhantomInstalled()) {
    throw new Error('Phantom wallet is not installed');
  }
  
  try {
    await window.solana.disconnect();
    return true;
  } catch (error) {
    console.error('Error disconnecting from Phantom wallet:', error);
    throw error;
  }
};

// Get Phantom wallet balance
export const getPhantomBalance = async () => {
  if (!isPhantomInstalled()) {
    throw new Error('Phantom wallet is not installed');
  }
  
  try {
    const connection = getConnection('solana-devnet');
    const publicKey = new PublicKey(window.solana.publicKey.toString());
    const balance = await connection.getBalance(publicKey);
    return (balance / LAMPORTS_PER_SOL).toString();
  } catch (error) {
    console.error('Error getting Phantom wallet balance:', error);
    throw error;
  }
};

// Create a new Solana keypair
export const createSolanaKeypair = () => {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey.toString(),
    secretKey: Buffer.from(keypair.secretKey).toString('hex'),
  };
};
