import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Card className="bg-dex-dark/80 border-dex-primary/30 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col justify-center items-center h-40">
              <div className="text-dex-negative mb-2">Something went wrong</div>
              <div className="text-dex-text-secondary text-sm mb-4">
                {this.state.error?.toString()}
              </div>
              <pre className="text-xs text-dex-text-secondary bg-black/30 p-2 rounded max-h-20 overflow-auto mb-4">
                {this.state.errorInfo?.componentStack}
              </pre>
              <Button
                className="bg-dex-primary text-white"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
