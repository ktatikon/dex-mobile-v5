import { supabase } from '@/integrations/supabase/client';
import { Token } from '@/types';

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
