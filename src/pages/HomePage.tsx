
import React from 'react';
import PortfolioCard from '@/components/PortfolioCard';
import TokenListItem from '@/components/TokenListItem';
import { calculateTotalBalance, mockTokens, mockWallet } from '@/services/mockData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const tokens = mockWallet.tokens;

  // Sort tokens by value (balance * price)
  const sortedTokens = [...tokens].sort((a, b) => {
    const aValue = parseFloat(a.balance || '0') * (a.price || 0);
    const bValue = parseFloat(b.balance || '0') * (b.price || 0);
    return bValue - aValue;
  });

  // Get top tokens by value
  const topTokens = sortedTokens.slice(0, 4);

  // Get trending tokens
  const trendingTokens = [...tokens].sort((a, b) => {
    return (b.priceChange24h || 0) - (a.priceChange24h || 0);
  }).slice(0, 4);

  const handleGoToMarket = () => {
    navigate('/trade');
  };

  const handleGoToWallet = () => {
    navigate('/wallet');
  };

  return (
    <div className="pb-20">
      {/* Portfolio section */}
      <div className="mb-6">
        <PortfolioCard tokens={tokens} />
      </div>

      {/* Quick actions */}
      <div className="mb-6">
        <Button
          className="p-4 h-auto w-full bg-dex-primary hover:bg-dex-primary/90 flex items-center justify-center gap-2"
          onClick={handleGoToMarket}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3v18h18"/>
            <path d="m19 9-5 5-4-4-3 3"/>
          </svg>
          <span className="text-lg font-medium">View Market Data</span>
        </Button>
      </div>

      {/* Top assets */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Your Assets</h2>
        <Card className="p-0 bg-dex-dark text-white border-gray-700">
          {topTokens.map(token => (
            <TokenListItem
              key={token.id}
              token={token}
              onSelect={() => navigate('/wallet', { state: { preSelectedToken: token } })}
            />
          ))}

          <div className="p-3 text-center">
            <Button
              variant="ghost"
              className="text-dex-primary hover:text-dex-primary/90 hover:bg-dex-primary/10"
              onClick={handleGoToWallet}
            >
              View All Assets
            </Button>
          </div>
        </Card>
      </div>

      {/* Trending tokens */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Trending</h2>
        <Card className="p-0 bg-dex-dark text-white border-gray-700">
          {trendingTokens.map(token => (
            <TokenListItem
              key={token.id}
              token={token}
              showBalance={false}
              onSelect={() => {
                navigate('/trade');
              }}
            />
          ))}
        </Card>
      </div>
    </div>
  );
};

export default HomePage;
