import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import WalletDashboardPage from './WalletDashboardPage';

const WalletDashboardPageWithErrorBoundary: React.FC = () => {
  return (
    <ErrorBoundary>
      <WalletDashboardPage />
    </ErrorBoundary>
  );
};

export default WalletDashboardPageWithErrorBoundary;
