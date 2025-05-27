import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import HomePage from './HomePage';

const HomePageWithErrorBoundary: React.FC = () => {
  return (
    <ErrorBoundary>
      <HomePage />
    </ErrorBoundary>
  );
};

export default HomePageWithErrorBoundary;
