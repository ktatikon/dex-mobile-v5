
import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { formatCurrency } from '@/services/realTimeData';
import { Token } from '@/types';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface PortfolioCardProps {
  tokens: Token[];
  chartData?: { time: number; value: number }[];
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ tokens, chartData }) => {
  // Calculate total balance and portfolio change
  const { totalBalance, portfolioChange24h } = useMemo(() => {
    if (!tokens || tokens.length === 0) return { totalBalance: 0, portfolioChange24h: 0 };

    let currentValue = 0;
    let previousValue = 0;

    tokens.forEach(token => {
      const balance = parseFloat(token.balance || '0');
      const currentPrice = token.price || 0;
      const priceChange24h = token.priceChange24h || 0;

      // Calculate current value
      currentValue += balance * currentPrice;

      // Calculate previous price (24h ago) and previous value
      const previousPrice = currentPrice / (1 + priceChange24h / 100);
      previousValue += balance * previousPrice;
    });

    // Calculate portfolio percentage change
    const portfolioChange = previousValue > 0
      ? ((currentValue - previousValue) / previousValue) * 100
      : 0;

    return {
      totalBalance: currentValue,
      portfolioChange24h: portfolioChange
    };
  }, [tokens]);

  // Generate realistic chart data based on portfolio change
  const portfolioChartData = useMemo(() => {
    if (chartData) return chartData;

    // Generate chart data that reflects the actual portfolio change
    const dataPoints = 30;
    const data = [];
    const endValue = totalBalance;
    const startValue = endValue / (1 + portfolioChange24h / 100);

    for (let i = 0; i < dataPoints; i++) {
      const progress = i / (dataPoints - 1);
      // Add some realistic volatility
      const volatility = (Math.random() - 0.5) * 0.02; // ±1% random variation
      const baseValue = startValue + (endValue - startValue) * progress;
      const value = baseValue * (1 + volatility);

      data.push({
        time: i,
        value: Math.max(value, 0) // Ensure no negative values
      });
    }

    return data;
  }, [totalBalance, portfolioChange24h, chartData]);

  const isPositive = portfolioChange24h >= 0;

  // Determine if this is a new user with zero balance
  const isNewUser = totalBalance === 0;

  return (
    <Card className="p-5 bg-gradient-to-br from-dex-dark to-black text-white border-none shadow-[0_4px_16px_rgba(0,0,0,0.3)] rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-400 font-medium text-lg">Portfolio Value</h2>
        {!isNewUser && (
          <span className={`text-base font-semibold px-3 py-1 rounded-full ${isPositive ? 'bg-dex-positive/10 text-dex-positive' : 'bg-dex-negative/10 text-dex-negative'}`}>
            {isPositive ? '+' : ''}{portfolioChange24h.toFixed(2)}%
          </span>
        )}
      </div>

      <div className="mb-6">
        <span className="text-4xl font-bold">${formatCurrency(totalBalance)}</span>
        {isNewUser && (
          <div className="text-dex-text-secondary text-sm mt-2">
            Start by adding funds to your wallet
          </div>
        )}
        {!isNewUser && (
          <div className="text-dex-text-secondary text-sm mt-2">
            24h change: {isPositive ? '+' : ''}${formatCurrency(totalBalance * portfolioChange24h / 100)}
          </div>
        )}
      </div>

      <div className="h-24 w-full">
        {isNewUser ? (
          <div className="flex items-center justify-center h-full text-dex-text-secondary text-sm border border-dashed border-dex-secondary/20 rounded-lg">
            Your portfolio chart will appear here
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={portfolioChartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={isPositive ? "#34C759" : "#FF3B30"}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default PortfolioCard;
