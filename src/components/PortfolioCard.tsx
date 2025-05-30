
import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from '@/services/realTimeData';
import { Token } from '@/types';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface PortfolioCardProps {
  tokens: Token[];
  chartData?: { time: number; value: number }[];
}

// Custom SVG Icons following #FF3B30/#000000/#FFFFFF color scheme
const WalletIcon = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
  </svg>
);

const TradingIcon = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="22,6 13.5,14.5 8.5,9.5 2,16" />
    <polyline points="16,6 22,6 22,12" />
  </svg>
);

const P2PIcon = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const PortfolioCard: React.FC<PortfolioCardProps> = ({ tokens, chartData }) => {
  const navigate = useNavigate();

  // Calculate wallet balance (total portfolio value)
  const { walletBalance, portfolioChange24h } = useMemo(() => {
    if (!tokens || tokens.length === 0) return { walletBalance: 0, portfolioChange24h: 0 };

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
      walletBalance: currentValue,
      portfolioChange24h: portfolioChange
    };
  }, [tokens]);

  // Calculate trading balance (placeholder - no separate trading balance system exists)
  const tradingBalance = 0; // Will be implemented when trading balance system is added

  // Calculate P2P balance (placeholder - no P2P system exists)
  const p2pBalance = 0; // Will be implemented when P2P system is added

  // Navigation handlers
  const handleWalletClick = () => {
    navigate('/wallet-dashboard');
  };

  const handleTradingClick = () => {
    navigate('/trade');
  };

  const handleP2PClick = () => {
    // Since P2P doesn't exist, show coming soon placeholder
    navigate('/p2p-coming-soon');
  };

  // Generate realistic chart data based on portfolio change
  const portfolioChartData = useMemo(() => {
    if (chartData) return chartData;

    // Generate chart data that reflects the actual portfolio change
    const dataPoints = 30;
    const data = [];
    const endValue = walletBalance;
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
  }, [walletBalance, portfolioChange24h, chartData]);

  const isPositive = portfolioChange24h >= 0;

  // Determine if this is a new user with zero balance
  const isNewUser = walletBalance === 0;

  return (
    <Card className="p-5 bg-gradient-to-br from-dex-dark to-black text-white border-none shadow-[0_4px_16px_rgba(0,0,0,0.3)] rounded-xl">
      {/* Three-section balance display */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Wallet Section */}
        <Button
          onClick={handleWalletClick}
          variant="ghost"
          className="flex flex-col items-center p-4 h-auto bg-transparent hover:bg-dex-primary/10 border border-dex-secondary/20 rounded-lg transition-all duration-200"
        >
          <WalletIcon size={24} className="text-dex-primary mb-2" />
          <span className="text-white text-sm font-medium mb-1">Wallet</span>
          <span className="text-white text-lg font-bold">
            ${formatCurrency(walletBalance)}
          </span>
          {!isNewUser && (
            <span className={`text-xs mt-1 ${isPositive ? 'text-dex-positive' : 'text-dex-negative'}`}>
              {isPositive ? '+' : ''}{portfolioChange24h.toFixed(2)}%
            </span>
          )}
        </Button>

        {/* Trading Section */}
        <Button
          onClick={handleTradingClick}
          variant="ghost"
          className="flex flex-col items-center p-4 h-auto bg-transparent hover:bg-dex-primary/10 border border-dex-secondary/20 rounded-lg transition-all duration-200"
        >
          <TradingIcon size={24} className="text-dex-primary mb-2" />
          <span className="text-white text-sm font-medium mb-1">Trading</span>
          <span className="text-white text-lg font-bold">
            ${formatCurrency(tradingBalance)}
          </span>
          <span className="text-dex-text-secondary text-xs mt-1">Available</span>
        </Button>

        {/* P2P Section */}
        <Button
          onClick={handleP2PClick}
          variant="ghost"
          className="flex flex-col items-center p-4 h-auto bg-transparent hover:bg-dex-primary/10 border border-dex-secondary/20 rounded-lg transition-all duration-200"
        >
          <P2PIcon size={24} className="text-dex-primary mb-2" />
          <span className="text-white text-sm font-medium mb-1">P2P</span>
          <span className="text-white text-lg font-bold">
            ${formatCurrency(p2pBalance)}
          </span>
          <span className="text-dex-text-secondary text-xs mt-1">Coming Soon</span>
        </Button>
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
