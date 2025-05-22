import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import PortfolioPage from './PortfolioPage';

const PortfolioPageWithErrorBoundary: React.FC = () => {
  return (
    <ErrorBoundary>
      <PortfolioPage />
    </ErrorBoundary>
  );
};

export default PortfolioPageWithErrorBoundary;
