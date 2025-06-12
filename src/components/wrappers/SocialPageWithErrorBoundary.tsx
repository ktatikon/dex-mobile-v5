/**
 * Social Page with Error Boundary Wrapper
 * 
 * Wraps the Social page component with error boundary for safe rendering
 * following the established pattern from WalletDashboardPageWithErrorBoundary
 */

import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import SocialPage from '@/pages/SocialPage';

const SocialPageWithErrorBoundary: React.FC = React.memo(() => {
  return (
    <ErrorBoundary>
      <SocialPage />
    </ErrorBoundary>
  );
});

SocialPageWithErrorBoundary.displayName = 'SocialPageWithErrorBoundary';

export default SocialPageWithErrorBoundary;
