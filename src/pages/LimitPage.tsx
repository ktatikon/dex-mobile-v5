import React from 'react';
import ComingSoonPage from '@/components/ComingSoonPage';

const LimitPage = () => {
  return (
    <ComingSoonPage
      title="Limit Orders"
      description="Advanced limit order functionality is coming soon. You'll be able to set precise buy and sell orders at your desired price points."
      returnPath="/trade"
      returnLabel="Back to Market"
    />
  );
};

export default LimitPage;
