import { NETWORKS } from './ethersService';

// Check if MetaMask is installed
export const isMetaMaskInstalled = () => {
  return typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask;
};

// Connect to MetaMask
export const connectMetaMask = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0] as string;
  } catch (error) {
    console.error('Error connecting to MetaMask:', error);
    throw error;
  }
};

// Get current chain ID
export const getCurrentChainId = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainId, 16);
  } catch (error) {
    console.error('Error getting chain ID:', error);
    throw error;
  }
};

// Switch to Sepolia network
export const switchToSepoliaNetwork = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${NETWORKS.sepolia.chainId.toString(16)}` }],
    });
    return true;
  } catch (error: any) {
    // If the chain hasn't been added to MetaMask
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${NETWORKS.sepolia.chainId.toString(16)}`,
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'Sepolia Ether',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [NETWORKS.sepolia.rpcUrl],
              blockExplorerUrls: [NETWORKS.sepolia.blockExplorer],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Error adding Sepolia network to MetaMask:', addError);
        throw addError;
      }
    }
    console.error('Error switching to Sepolia network:', error);
    throw error;
  }
};

// Switch to Ganache network
export const switchToGanacheNetwork = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${NETWORKS.ganache.chainId.toString(16)}` }],
    });
    return true;
  } catch (error: any) {
    // If the chain hasn't been added to MetaMask
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${NETWORKS.ganache.chainId.toString(16)}`,
              chainName: 'Ganache Local',
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [NETWORKS.ganache.rpcUrl],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Error adding Ganache network to MetaMask:', addError);
        throw addError;
      }
    }
    console.error('Error switching to Ganache network:', error);
    throw error;
  }
};

// Get MetaMask account balance
export const getMetaMaskBalance = async (address: string) => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  
  try {
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });
    
    // Convert from wei to ether
    return parseInt(balance, 16) / 1e18;
  } catch (error) {
    console.error('Error getting MetaMask balance:', error);
    throw error;
  }
};

// Send transaction using MetaMask
export const sendMetaMaskTransaction = async (toAddress: string, amount: string) => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const fromAddress = accounts[0];
    
    // Convert amount to wei
    const amountInWei = `0x${(parseFloat(amount) * 1e18).toString(16)}`;
    
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: fromAddress,
          to: toAddress,
          value: amountInWei,
        },
      ],
    });
    
    return txHash;
  } catch (error) {
    console.error('Error sending MetaMask transaction:', error);
    throw error;
  }
};
