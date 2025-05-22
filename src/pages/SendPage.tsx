import React from 'react';
import ComingSoonPage from '@/components/ComingSoonPage';

const SendPage = () => {
  return (
    <ComingSoonPage
      title="Send Crypto"
      description="Our secure crypto sending feature is coming soon. You'll be able to transfer your assets to any wallet address with low fees and fast confirmation times."
      returnPath="/wallet"
      returnLabel="Back to Wallet"
    />
  );
};

export default SendPage;
