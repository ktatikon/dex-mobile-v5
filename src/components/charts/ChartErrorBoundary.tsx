/**
 * CHART ERROR BOUNDARY COMPONENT
 * 
 * Enterprise-level error boundary specifically for chart components
 * with graceful fallback and recovery mechanisms
 */

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, BarChart3 } from 'lucide-react';

interface ChartErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  height?: number;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

export class ChartErrorBoundary extends Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ChartErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('📊 Chart Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry for certain recoverable errors
    if (this.isRecoverableError(error) && this.state.retryCount < this.maxRetries) {
      this.scheduleRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  /**
   * Determine if an error is recoverable
   */
  private isRecoverableError(error: Error): boolean {
    const recoverablePatterns = [
      /network/i,
      /fetch/i,
      /timeout/i,
      /connection/i,
      /chart.*initialization/i,
    ];

    return recoverablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  /**
   * Schedule automatic retry
   */
  private scheduleRetry = () => {
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Exponential backoff
    
    this.retryTimeout = setTimeout(() => {
      console.log(`📊 Auto-retrying chart (attempt ${this.state.retryCount + 1}/${this.maxRetries})`);
      this.handleRetry();
    }, delay);
  };

  /**
   * Handle manual or automatic retry
   */
  private handleRetry = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  /**
   * Reset error boundary state
   */
  private handleReset = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const { error } = this.state;
      const height = this.props.height || 400;
      const canRetry = this.state.retryCount < this.maxRetries;
      const isRetrying = this.retryTimeout !== null;

      return (
        <div 
          className="flex items-center justify-center bg-black border border-gray-800 rounded-xl"
          style={{ height }}
        >
          <div className="flex flex-col items-center space-y-6 text-center p-8 max-w-md">
            {/* Error Icon */}
            <div className="relative">
              <BarChart3 size={64} className="text-gray-600" />
              <div className="absolute -top-2 -right-2 bg-[#FF3B30] rounded-full p-1">
                <AlertTriangle size={16} className="text-white" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h3 className="text-xl font-medium text-white" style={{ fontFamily: 'Poppins' }}>
                Chart Error
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed" style={{ fontFamily: 'Poppins' }}>
                {error?.message || 'An unexpected error occurred while loading the chart.'}
              </p>
              
              {/* Technical Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                    Technical Details
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 bg-gray-900 p-3 rounded overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {/* Retry Button */}
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                  className="flex-1 bg-[#B1420A] hover:bg-[#D2691E] text-white border-0 h-11 rounded-lg font-medium transition-all duration-200"
                  style={{ fontFamily: 'Poppins' }}
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} className="mr-2" />
                      Retry ({this.maxRetries - this.state.retryCount} left)
                    </>
                  )}
                </Button>
              )}

              {/* Reset Button */}
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex-1 bg-transparent hover:bg-gray-800 text-gray-300 border-gray-600 hover:border-gray-500 h-11 rounded-lg font-medium transition-all duration-200"
                style={{ fontFamily: 'Poppins' }}
              >
                Reset Chart
              </Button>
            </div>

            {/* Retry Counter */}
            {this.state.retryCount > 0 && (
              <div className="text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>
                Retry attempts: {this.state.retryCount}/{this.maxRetries}
              </div>
            )}

            {/* Auto-retry Indicator */}
            {isRetrying && (
              <div className="flex items-center gap-2 text-xs text-[#B1420A]" style={{ fontFamily: 'Poppins' }}>
                <div className="w-2 h-2 bg-[#B1420A] rounded-full animate-pulse"></div>
                Auto-retrying in a moment...
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC wrapper for easier usage
 */
export function withChartErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ChartErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ChartErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ChartErrorBoundary>
  );

  WrappedComponent.displayName = `withChartErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default ChartErrorBoundary;
