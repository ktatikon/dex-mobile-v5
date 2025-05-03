import React from 'react';
import ComingSoonPage from '@/components/ComingSoonPage';

const ReceivePage = () => {
  return (
    <ComingSoonPage
      title="Receive Crypto"
      description="Our secure crypto receiving feature is coming soon. You'll be able to generate wallet addresses and QR codes to receive assets from other users."
      returnPath="/wallet"
      returnLabel="Back to Wallet"
    />
  );
};

export default ReceivePage;
