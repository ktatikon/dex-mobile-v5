/**
 * ENTERPRISE LOADING COMPONENTS
 * 
 * Provides skeleton loaders and loading states optimized for enterprise scale
 * with smooth transitions and performance optimization for 50,000+ users
 */

import React, { memo, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, TrendingUp, BarChart3, Wallet, Activity } from 'lucide-react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'default' | 'chart' | 'table' | 'card' | 'dashboard';
  animated?: boolean;
  rows?: number;
}

/**
 * Base Skeleton Component with Enterprise Styling
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = memo(({
  className = '',
  variant = 'default',
  animated = true,
  rows = 3
}) => {
  const baseClasses = `bg-dex-secondary/20 rounded ${animated ? 'animate-pulse' : ''}`;
  
  switch (variant) {
    case 'chart':
      return (
        <div className={`space-y-4 ${className}`}>
          {/* Chart Header */}
          <div className="flex items-center justify-between">
            <div className={`h-6 w-32 ${baseClasses}`}></div>
            <div className={`h-8 w-24 ${baseClasses}`}></div>
          </div>
          
          {/* Chart Area */}
          <div className={`h-64 w-full ${baseClasses} relative overflow-hidden`}>
            {animated && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
            )}
          </div>
          
          {/* Chart Controls */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-8 w-16 ${baseClasses}`}></div>
            ))}
          </div>
        </div>
      );

    case 'table':
      return (
        <div className={`space-y-3 ${className}`}>
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-4 ${baseClasses}`}></div>
            ))}
          </div>
          
          {/* Table Rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className={`h-6 ${baseClasses}`}></div>
              ))}
            </div>
          ))}
        </div>
      );

    case 'card':
      return (
        <Card className={`bg-dex-dark border-dex-secondary/30 ${className}`}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className={`h-6 w-3/4 ${baseClasses}`}></div>
              <div className={`h-4 w-1/2 ${baseClasses}`}></div>
              <div className="space-y-2">
                {Array.from({ length: rows }).map((_, i) => (
                  <div key={i} className={`h-4 w-full ${baseClasses}`}></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case 'dashboard':
      return (
        <div className={`space-y-6 ${className}`}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className={`h-8 w-48 ${baseClasses}`}></div>
            <div className={`h-8 w-8 rounded ${baseClasses}`}></div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="bg-dex-dark border-dex-secondary/30">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className={`h-4 w-24 ${baseClasses}`}></div>
                    <div className={`h-8 w-32 ${baseClasses}`}></div>
                    <div className={`h-3 w-16 ${baseClasses}`}></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LoadingSkeleton variant="chart" />
            <LoadingSkeleton variant="table" rows={5} />
          </div>
        </div>
      );

    default:
      return (
        <div className={`space-y-3 ${className}`}>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className={`h-4 w-full ${baseClasses}`}></div>
          ))}
        </div>
      );
  }
});

LoadingSkeleton.displayName = 'LoadingSkeleton';

/**
 * Progressive Loading Component with Stage Indicators
 */
interface ProgressiveLoadingProps {
  stage: string;
  progress: number;
  className?: string;
  showProgress?: boolean;
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = memo(({
  stage,
  progress,
  className = '',
  showProgress = true
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="relative mb-4">
        <RefreshCw className="h-8 w-8 text-dex-primary animate-spin" />
        <div className="absolute inset-0 rounded-full border-2 border-dex-primary/20"></div>
      </div>
      
      <div className="text-center space-y-2">
        <div className="text-white font-medium">
          {stage}{dots}
        </div>
        
        {showProgress && (
          <div className="w-48 bg-dex-secondary/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-dex-primary to-[#D2691E] h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        )}
        
        <div className="text-dex-text-secondary text-sm">
          {progress}% complete
        </div>
      </div>
    </div>
  );
});

ProgressiveLoading.displayName = 'ProgressiveLoading';

/**
 * Chart Loading Component with Realistic Preview
 */
export const ChartLoadingSkeleton: React.FC<{ className?: string }> = memo(({ className = '' }) => {
  return (
    <Card className={`bg-dex-dark/80 border-dex-primary/30 ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Chart Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-dex-primary" />
              <div className="h-5 w-24 bg-dex-secondary/20 rounded animate-pulse"></div>
            </div>
            <div className="flex gap-2">
              {['1D', '7D', '30D'].map(period => (
                <div key={period} className="h-8 w-12 bg-dex-secondary/20 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
          
          {/* Chart Area with Simulated Candlesticks */}
          <div className="h-64 bg-dex-secondary/10 rounded relative overflow-hidden">
            <div className="absolute inset-0 flex items-end justify-around p-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-1">
                  <div 
                    className="w-1 bg-dex-primary/30 animate-pulse"
                    style={{ 
                      height: `${Math.random() * 60 + 20}%`,
                      animationDelay: `${i * 100}ms`
                    }}
                  ></div>
                  <div 
                    className="w-3 bg-dex-primary/20 animate-pulse"
                    style={{ 
                      height: `${Math.random() * 40 + 10}%`,
                      animationDelay: `${i * 100 + 50}ms`
                    }}
                  ></div>
                </div>
              ))}
            </div>
            
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          </div>
          
          {/* Chart Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div className="h-4 w-16 bg-dex-secondary/20 rounded animate-pulse"></div>
              </div>
              <div className="h-4 w-20 bg-dex-secondary/20 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-24 bg-dex-secondary/20 rounded animate-pulse"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ChartLoadingSkeleton.displayName = 'ChartLoadingSkeleton';

/**
 * Wallet Dashboard Loading Component
 */
export const WalletDashboardSkeleton: React.FC<{ className?: string }> = memo(({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-dex-primary" />
          <div className="h-7 w-40 bg-dex-secondary/20 rounded animate-pulse"></div>
        </div>
        <div className="h-8 w-8 bg-dex-secondary/20 rounded animate-pulse"></div>
      </div>
      
      {/* Portfolio Overview Card */}
      <Card className="bg-dex-dark border-dex-secondary/30">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-dex-secondary/20 rounded animate-pulse"></div>
                <div className="h-8 w-48 bg-dex-secondary/20 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-dex-secondary/20 rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-dex-secondary/20 rounded animate-pulse"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="text-center space-y-2">
                  <div className="h-4 w-16 bg-dex-secondary/20 rounded animate-pulse mx-auto"></div>
                  <div className="h-6 w-20 bg-dex-secondary/20 rounded animate-pulse mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Wallet Cards */}
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-dex-dark border-dex-secondary/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-dex-secondary/20 rounded-full animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-dex-secondary/20 rounded animate-pulse"></div>
                    <div className="h-3 w-32 bg-dex-secondary/20 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-5 w-20 bg-dex-secondary/20 rounded animate-pulse"></div>
                  <div className="h-3 w-16 bg-dex-secondary/20 rounded animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

WalletDashboardSkeleton.displayName = 'WalletDashboardSkeleton';

/**
 * Error Recovery Component
 */
interface ErrorRecoveryProps {
  error: Error;
  onRetry: () => void;
  onFallback?: () => void;
  className?: string;
}

export const ErrorRecovery: React.FC<ErrorRecoveryProps> = memo(({
  error,
  onRetry,
  onFallback,
  className = ''
}) => {
  return (
    <Card className={`bg-dex-dark/80 border-dex-negative/30 ${className}`}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <Activity className="h-12 w-12 text-dex-negative" />
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">
              Data Loading Failed
            </h3>
            <p className="text-dex-text-secondary text-sm">
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-dex-primary text-white rounded-lg hover:bg-dex-primary/80 transition-colors font-poppins text-sm"
            >
              Try Again
            </button>
            
            {onFallback && (
              <button
                onClick={onFallback}
                className="px-4 py-2 bg-dex-secondary/20 text-white rounded-lg hover:bg-dex-secondary/30 transition-colors font-poppins text-sm"
              >
                Use Cached Data
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ErrorRecovery.displayName = 'ErrorRecovery';

// Add shimmer animation to global CSS
const shimmerStyles = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;
