/**
 * Chart Modal Component
 * Full-screen modal for mobile chart viewing with landscape optimization
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Maximize2, RotateCcw, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TradingChart } from '@/components/TradingChart';
import { Token } from '@/types';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedToken: Token;
  isLoading?: boolean;
}

export type ChartType = 'candlestick' | 'bar' | 'line';

export const ChartModal: React.FC<ChartModalProps> = ({
  isOpen,
  onClose,
  selectedToken,
  isLoading = false
}) => {
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [isLandscape, setIsLandscape] = useState(false);
  const [showIndicators, setShowIndicators] = useState({
    volume: true,
    sma: false
  });

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle orientation change
  useEffect(() => {
    const handleOrientationChange = () => {
      // Check if device is in landscape mode
      const isLandscapeMode = window.innerWidth > window.innerHeight;
      setIsLandscape(isLandscapeMode);
    };

    handleOrientationChange(); // Initial check
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  const handleLandscapeToggle = useCallback(() => {
    if (screen.orientation && screen.orientation.lock) {
      try {
        if (isLandscape) {
          screen.orientation.lock('portrait');
        } else {
          screen.orientation.lock('landscape');
        }
      } catch (error) {
        console.warn('Screen orientation lock not supported:', error);
        // Fallback: just toggle the state
        setIsLandscape(!isLandscape);
      }
    } else {
      // Fallback for browsers that don't support orientation lock
      setIsLandscape(!isLandscape);
    }
  }, [isLandscape]);

  const chartTypeButtons = [
    { type: 'candlestick' as ChartType, icon: BarChart3, label: 'Candlestick' },
    { type: 'bar' as ChartType, icon: Activity, label: 'Bar Chart' },
    { type: 'line' as ChartType, icon: TrendingUp, label: 'Line Chart' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm">
      <div className={`h-full w-full flex flex-col ${isLandscape ? 'landscape-mode' : ''}`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-dex-primary/30 bg-dex-dark/90">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">
              {selectedToken.symbol}/USD Chart
            </h2>
            <span className="text-sm text-gray-400">
              {selectedToken.name}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Landscape Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLandscapeToggle}
              className="bg-dex-dark/50 border-dex-primary/30 text-white hover:bg-dex-primary/20"
            >
              <RotateCcw size={16} />
              <span className="ml-1 hidden sm:inline">
                {isLandscape ? 'Portrait' : 'Landscape'}
              </span>
            </Button>

            {/* Fullscreen Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  document.documentElement.requestFullscreen();
                }
              }}
              className="bg-dex-dark/50 border-dex-primary/30 text-white hover:bg-dex-primary/20"
            >
              <Maximize2 size={16} />
            </Button>

            {/* Close Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="bg-dex-dark/50 border-dex-primary/30 text-white hover:bg-dex-primary/20"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Chart Type Controls */}
        <div className="flex items-center justify-between p-4 bg-dex-dark/50 border-b border-dex-primary/20">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 mr-2">Chart Type:</span>
            {chartTypeButtons.map(({ type, icon: Icon, label }) => (
              <Button
                key={type}
                variant={chartType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType(type)}
                className={`${
                  chartType === type
                    ? 'bg-dex-primary text-white'
                    : 'bg-dex-dark/50 border-dex-primary/30 text-white hover:bg-dex-primary/20'
                }`}
              >
                <Icon size={14} />
                <span className="ml-1 hidden sm:inline">{label}</span>
              </Button>
            ))}
          </div>

          {/* Indicators Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 mr-2">Indicators:</span>
            <Button
              variant={showIndicators.volume ? "default" : "outline"}
              size="sm"
              onClick={() => setShowIndicators(prev => ({ ...prev, volume: !prev.volume }))}
              className={`${
                showIndicators.volume
                  ? 'bg-dex-primary text-white'
                  : 'bg-dex-dark/50 border-dex-primary/30 text-white hover:bg-dex-primary/20'
              }`}
            >
              Volume
            </Button>
            <Button
              variant={showIndicators.sma ? "default" : "outline"}
              size="sm"
              onClick={() => setShowIndicators(prev => ({ ...prev, sma: !prev.sma }))}
              className={`${
                showIndicators.sma
                  ? 'bg-dex-primary text-white'
                  : 'bg-dex-dark/50 border-dex-primary/30 text-white hover:bg-dex-primary/20'
              }`}
            >
              SMA
            </Button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="flex-1 p-4 bg-dex-background">
          <div className="h-full w-full">
            <TradingChart
              selectedToken={selectedToken}
              isLoading={isLoading}
              className="h-full"
              chartType={chartType}
              showIndicators={showIndicators}
              isModal={true}
            />
          </div>
        </div>

        {/* Real-time Widgets */}
        <div className="p-4 bg-dex-dark/50 border-t border-dex-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-xs text-gray-400">Price Tracker</div>
                <div className="text-lg font-bold text-white">
                  ${selectedToken.price?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">24h Change</div>
                <div className={`text-lg font-bold ${
                  (selectedToken.priceChange24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {(selectedToken.priceChange24h || 0) >= 0 ? '+' : ''}
                  {(selectedToken.priceChange24h || 0).toFixed(2)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">Volume Tracker</div>
                <div className="text-lg font-bold text-white">
                  ${((selectedToken.totalVolume || 0) / 1e6).toFixed(1)}M
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-400">
              Live Data • Updated just now
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .landscape-mode {
          transform: rotate(90deg);
          transform-origin: center;
          width: 100vh;
          height: 100vw;
          position: fixed;
          top: 50%;
          left: 50%;
          margin-left: -50vh;
          margin-top: -50vw;
        }
      `}</style>
    </div>
  );
};
