/**
 * Multi-Network Portfolio Page with Error Boundary Wrapper
 * 
 * Wraps the Multi-Network Portfolio page component with error boundary for safe rendering
 * following the established pattern from WalletDashboardPageWithErrorBoundary
 */

import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import MultiNetworkPortfolioPage from '@/pages/MultiNetworkPortfolioPage';

const MultiNetworkPortfolioPageWithErrorBoundary: React.FC = React.memo(() => {
  return (
    <ErrorBoundary>
      <MultiNetworkPortfolioPage />
    </ErrorBoundary>
  );
});

MultiNetworkPortfolioPageWithErrorBoundary.displayName = 'MultiNetworkPortfolioPageWithErrorBoundary';

export default MultiNetworkPortfolioPageWithErrorBoundary;
