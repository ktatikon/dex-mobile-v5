import React from 'react';
import ComingSoonPage from '@/components/ComingSoonPage';

const BuyPage = () => {
  return (
    <ComingSoonPage
      title="Buy Crypto"
      description="Our secure crypto buying feature is coming soon. You'll be able to purchase cryptocurrencies directly with your preferred payment method."
      returnPath="/trade"
      returnLabel="Back to Market"
    />
  );
};

export default BuyPage;
