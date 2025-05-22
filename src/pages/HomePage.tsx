
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
    <div className="pb-24">
      {/* Portfolio section */}
      <div className="mb-6">
        <PortfolioCard tokens={tokens} />
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <Button
          variant="primary"
          className="py-4 px-5 h-auto w-full flex items-center justify-center gap-4 rounded-lg text-lg shadow-lg shadow-dex-primary/20"
          onClick={handleGoToMarket}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
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
          <span className="text-base font-medium">View Market Data</span>
        </Button>
      </div>

      {/* Top assets */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Your Assets</h2>
        <Card className="p-0 bg-dex-dark text-white border-dex-secondary/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
          {topTokens.map(token => (
            <TokenListItem
              key={token.id}
              token={token}
              onSelect={() => navigate('/wallet', { state: { preSelectedToken: token } })}
            />
          ))}

          <div className="p-4 text-center">
            <Button
              variant="ghost"
              className="text-dex-primary hover:text-dex-primary/90 hover:bg-dex-primary/10 font-medium text-base py-3 px-6 rounded-lg"
              onClick={handleGoToWallet}
            >
              View All Assets
            </Button>
          </div>
        </Card>
      </div>

      {/* Trending tokens */}
      <div>
        <h2 className="text-xl font-bold mb-4">Trending</h2>
        <Card className="p-0 bg-dex-dark text-white border-dex-secondary/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
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
