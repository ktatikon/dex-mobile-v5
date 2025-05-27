import { supabase } from '@/integrations/supabase/client';

export interface StakingOpportunity {
  id: string;
  protocol: string;
  token: string;
  apy: number;
  minimumStake: string;
  lockPeriod: number; // in days
  risk: 'low' | 'medium' | 'high';
  description: string;
  totalStaked: string;
  logo: string;
}

export interface YieldFarmingPool {
  id: string;
  protocol: string;
  pair: string;
  apy: number;
  tvl: string;
  rewards: string[];
  risk: 'low' | 'medium' | 'high';
  description: string;
  logo: string;
}

export interface LiquidityPool {
  id: string;
  protocol: string;
  tokenA: string;
  tokenB: string;
  fee: number;
  apy: number;
  tvl: string;
  volume24h: string;
  userLiquidity?: string;
  logo: string;
}

export interface UserStakingPosition {
  id: string;
  user_id: string;
  wallet_id: string;
  protocol: string;
  token: string;
  amount: string;
  rewards_earned: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'pending';
  apy: number;
}

// Mock data for demonstration
const MOCK_STAKING_OPPORTUNITIES: StakingOpportunity[] = [
  {
    id: 'eth2-staking',
    protocol: 'Ethereum 2.0',
    token: 'ETH',
    apy: 4.2,
    minimumStake: '32',
    lockPeriod: 0, // No lock period after Shanghai upgrade
    risk: 'low',
    description: 'Stake ETH to secure the Ethereum network and earn rewards',
    totalStaked: '28,450,000',
    logo: '/assets/icons/ethereum.png'
  },
  {
    id: 'sol-staking',
    protocol: 'Solana',
    token: 'SOL',
    apy: 6.8,
    minimumStake: '1',
    lockPeriod: 2,
    risk: 'medium',
    description: 'Delegate SOL to validators and earn staking rewards',
    totalStaked: '385,000,000',
    logo: '/assets/icons/solana.png'
  },
  {
    id: 'matic-staking',
    protocol: 'Polygon',
    token: 'MATIC',
    apy: 8.5,
    minimumStake: '1',
    lockPeriod: 3,
    risk: 'medium',
    description: 'Stake MATIC tokens to secure the Polygon network',
    totalStaked: '2,800,000,000',
    logo: '/assets/icons/polygon.png'
  }
];

const MOCK_YIELD_FARMING_POOLS: YieldFarmingPool[] = [
  {
    id: 'uni-eth-usdc',
    protocol: 'Uniswap V3',
    pair: 'ETH/USDC',
    apy: 12.4,
    tvl: '$1.2B',
    rewards: ['UNI', 'Trading Fees'],
    risk: 'medium',
    description: 'Provide liquidity to ETH/USDC pool and earn trading fees plus UNI rewards',
    logo: '/assets/icons/uniswap.png'
  },
  {
    id: 'sushi-wbtc-eth',
    protocol: 'SushiSwap',
    pair: 'WBTC/ETH',
    apy: 15.7,
    tvl: '$450M',
    rewards: ['SUSHI', 'Trading Fees'],
    risk: 'high',
    description: 'High-yield farming pool with SUSHI token rewards',
    logo: '/assets/icons/sushiswap.png'
  },
  {
    id: 'curve-3pool',
    protocol: 'Curve Finance',
    pair: 'DAI/USDC/USDT',
    apy: 5.2,
    tvl: '$2.1B',
    rewards: ['CRV', 'Trading Fees'],
    risk: 'low',
    description: 'Stable coin pool with low impermanent loss risk',
    logo: '/assets/icons/curve.png'
  }
];

/**
 * Get available staking opportunities
 * @returns Array of staking opportunities
 */
export const getStakingOpportunities = async (): Promise<StakingOpportunity[]> => {
  try {
    // In a real implementation, this would fetch from DeFi protocols
    // For now, return mock data
    return MOCK_STAKING_OPPORTUNITIES;
  } catch (error) {
    console.error('Error fetching staking opportunities:', error);
    return [];
  }
};

/**
 * Get yield farming pools
 * @returns Array of yield farming pools
 */
export const getYieldFarmingPools = async (): Promise<YieldFarmingPool[]> => {
  try {
    // In a real implementation, this would fetch from DeFi protocols
    return MOCK_YIELD_FARMING_POOLS;
  } catch (error) {
    console.error('Error fetching yield farming pools:', error);
    return [];
  }
};

/**
 * Get user's staking positions
 * @param userId The user's ID
 * @returns Array of user staking positions
 */
export const getUserStakingPositions = async (userId: string): Promise<UserStakingPosition[]> => {
  try {
    const { data, error } = await supabase
      .from('user_staking_positions')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching user staking positions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserStakingPositions:', error);
    return [];
  }
};

/**
 * Create a new staking position
 * @param userId The user's ID
 * @param walletId The wallet ID
 * @param stakingOpportunity The staking opportunity
 * @param amount The amount to stake
 * @returns Created staking position
 */
export const createStakingPosition = async (
  userId: string,
  walletId: string,
  stakingOpportunity: StakingOpportunity,
  amount: string
): Promise<UserStakingPosition | null> => {
  try {
    const position: Omit<UserStakingPosition, 'id'> = {
      user_id: userId,
      wallet_id: walletId,
      protocol: stakingOpportunity.protocol,
      token: stakingOpportunity.token,
      amount,
      rewards_earned: '0',
      start_date: new Date().toISOString(),
      status: 'pending',
      apy: stakingOpportunity.apy
    };

    const { data, error } = await supabase
      .from('user_staking_positions')
      .insert(position)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating staking position:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createStakingPosition:', error);
    return null;
  }
};

/**
 * Calculate estimated rewards for a staking position
 * @param amount The staking amount
 * @param apy The annual percentage yield
 * @param days The number of days
 * @returns Estimated rewards
 */
export const calculateStakingRewards = (amount: string, apy: number, days: number): string => {
  try {
    const principal = parseFloat(amount);
    const dailyRate = apy / 100 / 365;
    const rewards = principal * dailyRate * days;
    return rewards.toFixed(6);
  } catch (error) {
    console.error('Error calculating staking rewards:', error);
    return '0';
  }
};

/**
 * Get DeFi portfolio summary for a user
 * @param userId The user's ID
 * @returns Portfolio summary
 */
export const getDeFiPortfolioSummary = async (userId: string) => {
  try {
    const stakingPositions = await getUserStakingPositions(userId);
    
    let totalStaked = 0;
    let totalRewards = 0;
    let activePositions = 0;

    stakingPositions.forEach(position => {
      if (position.status === 'active') {
        activePositions++;
        totalStaked += parseFloat(position.amount);
        totalRewards += parseFloat(position.rewards_earned);
      }
    });

    return {
      totalStaked: totalStaked.toString(),
      totalRewards: totalRewards.toString(),
      activePositions,
      averageApy: stakingPositions.length > 0 
        ? stakingPositions.reduce((sum, pos) => sum + pos.apy, 0) / stakingPositions.length 
        : 0
    };
  } catch (error) {
    console.error('Error getting DeFi portfolio summary:', error);
    return {
      totalStaked: '0',
      totalRewards: '0',
      activePositions: 0,
      averageApy: 0
    };
  }
};

/**
 * Get protocol information
 * @param protocolName The protocol name
 * @returns Protocol information
 */
export const getProtocolInfo = (protocolName: string) => {
  const protocols: { [key: string]: any } = {
    'Ethereum 2.0': {
      name: 'Ethereum 2.0',
      description: 'The upgraded Ethereum network using Proof of Stake consensus',
      website: 'https://ethereum.org',
      riskLevel: 'low',
      auditStatus: 'audited'
    },
    'Solana': {
      name: 'Solana',
      description: 'High-performance blockchain supporting smart contracts',
      website: 'https://solana.com',
      riskLevel: 'medium',
      auditStatus: 'audited'
    },
    'Polygon': {
      name: 'Polygon',
      description: 'Ethereum scaling solution with lower fees',
      website: 'https://polygon.technology',
      riskLevel: 'medium',
      auditStatus: 'audited'
    },
    'Uniswap V3': {
      name: 'Uniswap V3',
      description: 'Leading decentralized exchange with concentrated liquidity',
      website: 'https://uniswap.org',
      riskLevel: 'medium',
      auditStatus: 'audited'
    },
    'SushiSwap': {
      name: 'SushiSwap',
      description: 'Community-driven DEX with yield farming',
      website: 'https://sushi.com',
      riskLevel: 'high',
      auditStatus: 'audited'
    },
    'Curve Finance': {
      name: 'Curve Finance',
      description: 'Specialized DEX for stablecoin trading',
      website: 'https://curve.fi',
      riskLevel: 'low',
      auditStatus: 'audited'
    }
  };

  return protocols[protocolName] || {
    name: protocolName,
    description: 'DeFi protocol',
    website: '',
    riskLevel: 'unknown',
    auditStatus: 'unknown'
  };
};
