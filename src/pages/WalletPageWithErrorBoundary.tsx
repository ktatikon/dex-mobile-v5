import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import WalletPage from './WalletPage';

const WalletPageWithErrorBoundary: React.FC = () => {
  return (
    <ErrorBoundary>
      <WalletPage />
    </ErrorBoundary>
  );
};

export default WalletPageWithErrorBoundary;
