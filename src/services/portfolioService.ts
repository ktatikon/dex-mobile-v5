import { supabase } from '@/integrations/supabase/client';
import { Token } from '@/types';

export interface PortfolioSummary {
  totalValue: number;
  totalTransactions: number;
  totalVolume: number;
  averageAmount: number;
  walletCount: number;
  change24h: number;
  changePercentage24h: number;
}

/**
 * Gets all portfolio holdings for a user
 * @param userId The user's ID
 * @returns Array of tokens with balances
 */
export async function getPortfolioHoldings(userId: string) {
  try {
    // Get all wallet balances for the user
    const { data, error } = await supabase
      .from('wallet_balances')
      .select(`
        id,
        balance,
        token_id,
        tokens:token_id (
          id,
          symbol,
          name,
          logo,
          decimals,
          price,
          price_change_24h
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching portfolio holdings:', error);
      return [];
    }

    // Transform the data to match our Token type
    return (data || []).map(item => ({
      id: item.tokens.id,
      symbol: item.tokens.symbol,
      name: item.tokens.name,
      logo: item.tokens.logo,
      decimals: item.tokens.decimals,
      balance: item.balance,
      price: item.tokens.price,
      priceChange24h: item.tokens.price_change_24h
    }));
  } catch (error) {
    console.error('Error in getPortfolioHoldings:', error);
    return [];
  }
}

/**
 * Gets liquidity positions for a user
 * @param userId The user's ID
 * @returns Array of liquidity positions
 */
export async function getLiquidityPositions(userId: string) {
  try {
    const { data, error } = await supabase
      .from('liquidity_positions')
      .select(`
        id,
        token_a_amount,
        token_b_amount,
        pool_share,
        token_a:token_a_id (
          id,
          symbol,
          name,
          logo,
          decimals,
          price
        ),
        token_b:token_b_id (
          id,
          symbol,
          name,
          logo,
          decimals,
          price
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching liquidity positions:', error);
      return [];
    }

    // Transform the data to match our expected format
    return (data || []).map(item => ({
      id: item.id,
      tokenA: {
        ...item.token_a,
        balance: item.token_a_amount
      },
      tokenB: {
        ...item.token_b,
        balance: item.token_b_amount
      },
      poolShare: item.pool_share,
      value: calculatePositionValue(
        item.token_a_amount,
        item.token_b_amount,
        item.token_a.price || 0,
        item.token_b.price || 0
      )
    }));
  } catch (error) {
    console.error('Error in getLiquidityPositions:', error);
    return [];
  }
}

/**
 * Calculates the total value of a liquidity position
 */
function calculatePositionValue(
  amountA: string,
  amountB: string,
  priceA: number,
  priceB: number
): number {
  const valueA = parseFloat(amountA) * priceA;
  const valueB = parseFloat(amountB) * priceB;
  return valueA + valueB;
}

/**
 * Gets the total portfolio value for a user
 * @param userId The user's ID
 * @returns Total portfolio value in USD
 */
export async function getTotalPortfolioValue(userId: string): Promise<number> {
  try {
    // Get holdings value
    const holdings = await getPortfolioHoldings(userId);
    const holdingsValue = holdings.reduce((total, token) => {
      return total + (parseFloat(token.balance || '0') * (token.price || 0));
    }, 0);

    // Get liquidity positions value
    const positions = await getLiquidityPositions(userId);
    const positionsValue = positions.reduce((total, position) => {
      return total + position.value;
    }, 0);

    return holdingsValue + positionsValue;
  } catch (error) {
    console.error('Error in getTotalPortfolioValue:', error);
    return 0;
  }
}

/**
 * Gets the portfolio change over 24 hours
 * @param userId The user's ID
 * @returns Percentage change in portfolio value
 */
export async function getPortfolioChange24h(userId: string): Promise<number> {
  try {
    const holdings = await getPortfolioHoldings(userId);

    if (holdings.length === 0) {
      return 0;
    }

    let currentValue = 0;
    let previousValue = 0;

    for (const token of holdings) {
      const balance = parseFloat(token.balance || '0');
      const currentPrice = token.price || 0;
      const priceChange = token.priceChange24h || 0;

      // Calculate previous price (24h ago)
      const previousPrice = currentPrice / (1 + priceChange / 100);

      currentValue += balance * currentPrice;
      previousValue += balance * previousPrice;
    }

    if (previousValue === 0) {
      return 0;
    }

    return ((currentValue - previousValue) / previousValue) * 100;
  } catch (error) {
    console.error('Error in getPortfolioChange24h:', error);
    return 0;
  }
}

/**
 * Get comprehensive portfolio summary for a user
 * @param userId The user's ID
 * @returns Portfolio summary with real data
 */
export const getPortfolioSummary = async (userId: string): Promise<PortfolioSummary> => {
  try {
    // Get all user wallets
    const [generatedWallets, hotWallets, hardwareWallets] = await Promise.all([
      supabase.from('generated_wallets').select('id').eq('user_id', userId),
      supabase.from('wallet_connections').select('id').eq('user_id', userId).eq('wallet_type', 'hot'),
      supabase.from('wallet_connections').select('id').eq('user_id', userId).eq('wallet_type', 'hardware')
    ]);

    const allWalletIds = [
      ...(generatedWallets.data || []).map(w => w.id),
      ...(hotWallets.data || []).map(w => w.id),
      ...(hardwareWallets.data || []).map(w => w.id)
    ];

    const walletCount = allWalletIds.length;

    if (walletCount === 0) {
      return {
        totalValue: 0,
        totalTransactions: 0,
        totalVolume: 0,
        averageAmount: 0,
        walletCount: 0,
        change24h: 0,
        changePercentage24h: 0
      };
    }

    // Get total portfolio value using existing function
    const totalValue = await getTotalPortfolioValue(userId);

    // Get transaction data
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        from_amount,
        timestamp,
        tokens:from_token_id (
          price
        )
      `)
      .eq('user_id', userId);

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
    }

    let totalTransactions = 0;
    let totalVolume = 0;
    let averageAmount = 0;

    if (transactions && transactions.length > 0) {
      totalTransactions = transactions.length;

      // Calculate total volume in USD
      totalVolume = transactions.reduce((sum, tx) => {
        const amount = parseFloat(tx.from_amount || '0');
        const price = tx.tokens?.price || 0;
        return sum + (amount * price);
      }, 0);

      averageAmount = totalVolume / totalTransactions;
    }

    // Get 24h change using existing function
    const changePercentage24h = await getPortfolioChange24h(userId);
    const change24h = totalValue * (changePercentage24h / 100);

    return {
      totalValue,
      totalTransactions,
      totalVolume,
      averageAmount,
      walletCount,
      change24h,
      changePercentage24h
    };
  } catch (error) {
    console.error('Error getting portfolio summary:', error);
    return {
      totalValue: 0,
      totalTransactions: 0,
      totalVolume: 0,
      averageAmount: 0,
      walletCount: 0,
      change24h: 0,
      changePercentage24h: 0
    };
  }
};

/**
 * Get portfolio value for a specific wallet
 * @param walletId The wallet ID
 * @returns Portfolio value for the wallet
 */
export const getWalletPortfolioValue = async (walletId: string): Promise<number> => {
  try {
    const { data: balances, error } = await supabase
      .from('wallet_balances')
      .select(`
        balance,
        tokens:token_id (
          price
        )
      `)
      .eq('wallet_id', walletId);

    if (error || !balances) {
      console.error('Error fetching wallet portfolio value:', error);
      return 0;
    }

    return balances.reduce((total, balance) => {
      const amount = parseFloat(balance.balance || '0');
      const price = balance.tokens?.price || 0;
      return total + (amount * price);
    }, 0);
  } catch (error) {
    console.error('Error calculating wallet portfolio value:', error);
    return 0;
  }
};