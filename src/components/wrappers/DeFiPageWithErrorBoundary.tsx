/**
 * DeFi Page with Error Boundary Wrapper
 * 
 * Wraps the DeFi page component with error boundary for safe rendering
 * following the established pattern from WalletDashboardPageWithErrorBoundary
 */

import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import DeFiPage from '@/pages/DeFiPage';

const DeFiPageWithErrorBoundary: React.FC = React.memo(() => {
  return (
    <ErrorBoundary>
      <DeFiPage />
    </ErrorBoundary>
  );
});

DeFiPageWithErrorBoundary.displayName = 'DeFiPageWithErrorBoundary';

export default DeFiPageWithErrorBoundary;
