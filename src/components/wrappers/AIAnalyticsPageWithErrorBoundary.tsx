/**
 * AI Analytics Page with Error Boundary Wrapper
 * 
 * Wraps the AI Analytics page component with error boundary for safe rendering
 * following the established pattern from WalletDashboardPageWithErrorBoundary
 */

import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import AIAnalyticsPage from '@/pages/AIAnalyticsPage';

const AIAnalyticsPageWithErrorBoundary: React.FC = React.memo(() => {
  return (
    <ErrorBoundary>
      <AIAnalyticsPage />
    </ErrorBoundary>
  );
});

AIAnalyticsPageWithErrorBoundary.displayName = 'AIAnalyticsPageWithErrorBoundary';

export default AIAnalyticsPageWithErrorBoundary;
