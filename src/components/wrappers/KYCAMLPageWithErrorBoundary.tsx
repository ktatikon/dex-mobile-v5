/**
 * KYC/AML Page with Error Boundary Wrapper
 * 
 * Wraps the KYC/AML page component with error boundary for safe rendering
 * following the established pattern from WalletDashboardPageWithErrorBoundary
 */

import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import KYCAMLPage from '@/pages/KYCAMLPage';

const KYCAMLPageWithErrorBoundary: React.FC = React.memo(() => {
  return (
    <ErrorBoundary>
      <KYCAMLPage />
    </ErrorBoundary>
  );
});

KYCAMLPageWithErrorBoundary.displayName = 'KYCAMLPageWithErrorBoundary';

export default KYCAMLPageWithErrorBoundary;
