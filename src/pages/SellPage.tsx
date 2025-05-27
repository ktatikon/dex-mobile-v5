import React from 'react';
import ComingSoonPage from '@/components/ComingSoonPage';

const SellPage = () => {
  return (
    <ComingSoonPage
      title="Sell Crypto"
      description="Our secure crypto selling feature is coming soon. You'll be able to sell your cryptocurrencies and withdraw funds to your preferred account."
      returnPath="/trade"
      returnLabel="Back to Market"
    />
  );
};

export default SellPage;
