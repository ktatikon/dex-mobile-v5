
import React from 'react';
import { Card } from "@/components/ui/card";
import { calculateTotalBalance, formatCurrency } from '@/services/mockData';
import { Token } from '@/types';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface PortfolioCardProps {
  tokens: Token[];
  chartData?: { time: number; value: number }[];
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ tokens, chartData }) => {
  const totalBalance = calculateTotalBalance(tokens);
  
  // Mock chart data if not provided
  const mockChartData = chartData || Array(30).fill(0).map((_, i) => ({
    time: i,
    value: Math.random() * 1000 + 4000
  }));
  
  // Calculate 24h change (mock data)
  const percentChange = 2.34; // Mock value
  const isPositive = percentChange >= 0;

  return (
    <Card className="p-4 bg-gradient-to-br from-dex-dark to-black text-white border-none shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-gray-400 font-medium">Portfolio Value</h2>
        <span className={`text-sm font-semibold ${isPositive ? 'text-dex-success' : 'text-dex-error'}`}>
          {isPositive ? '+' : ''}{percentChange.toFixed(2)}%
        </span>
      </div>
      
      <div className="mb-4">
        <span className="text-3xl font-bold">${formatCurrency(totalBalance)}</span>
      </div>
      
      <div className="h-16 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockChartData}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#8B5CF6" 
              strokeWidth={2} 
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default PortfolioCard;
