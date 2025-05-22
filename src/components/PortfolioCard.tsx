
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
  // Calculate total balance
  const totalBalance = useMemo(() => {
    if (!tokens || tokens.length === 0) return 0;

    return tokens.reduce((total, token) => {
      const balance = parseFloat(token.balance || '0');
      const price = token.price || 0;
      return total + (balance * price);
    }, 0);
  }, [tokens]);

  // Mock chart data if not provided
  const mockChartData = chartData || Array(30).fill(0).map((_, i) => ({
    time: i,
    value: Math.random() * 1000 + 4000
  }));

  // Calculate 24h change (mock data)
  const percentChange = totalBalance > 0 ? 2.34 : 0; // Mock value
  const isPositive = percentChange >= 0;

  // Determine if this is a new user with zero balance
  const isNewUser = totalBalance === 0;

  return (
    <Card className="p-5 bg-gradient-to-br from-dex-dark to-black text-white border-none shadow-[0_4px_16px_rgba(0,0,0,0.3)] rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-400 font-medium text-lg">Portfolio Value</h2>
        {!isNewUser && (
          <span className={`text-base font-semibold px-3 py-1 rounded-full ${isPositive ? 'bg-dex-positive/10 text-dex-positive' : 'bg-dex-negative/10 text-dex-negative'}`}>
            {isPositive ? '+' : ''}{percentChange.toFixed(2)}%
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
      </div>

      <div className="h-24 w-full">
        {isNewUser ? (
          <div className="flex items-center justify-center h-full text-dex-text-secondary text-sm border border-dashed border-dex-secondary/20 rounded-lg">
            Your portfolio chart will appear here
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockChartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#FF3B30"
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
