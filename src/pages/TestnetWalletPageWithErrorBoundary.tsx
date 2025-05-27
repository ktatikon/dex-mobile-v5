import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import TestnetWalletPage from './TestnetWalletPage';

const TestnetWalletPageWithErrorBoundary: React.FC = () => {
  return (
    <ErrorBoundary>
      <TestnetWalletPage />
    </ErrorBoundary>
  );
};

export default TestnetWalletPageWithErrorBoundary;
