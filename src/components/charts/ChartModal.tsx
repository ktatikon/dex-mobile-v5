/**
 * CHART MODAL COMPONENT
 * 
 * Full-screen landscape modal for enhanced chart viewing experience
 * with advanced controls and mobile optimization
 */

import React, { memo, useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChartModalProps, TimeInterval, ChartType, DEFAULT_INDICATORS } from '@/types/chart';
import { useChartData } from '@/hooks/useChartData';
import TradingChart from './TradingChart';
import ChartControls from './ChartControls';
import { X, Maximize2, RotateCcw } from 'lucide-react';

/**
 * Error boundary for chart modal to catch disposal errors
 */
class ChartModalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // Silent error handling for production
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-64 bg-black border border-gray-800 rounded-xl">
          <Button
            onClick={() => this.setState({ hasError: false })}
            className="bg-[#B1420A] hover:bg-[#D2691E] text-white"
          >
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ChartModal = memo<ChartModalProps>(({
  isOpen,
  onClose,
  selectedToken,
  data,
  indicators: propIndicators,
  theme = 'dark',
}) => {
  // State for modal-specific chart configuration
  const [timeframe, setTimeframe] = useState<TimeInterval>('1d');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [indicators, setIndicators] = useState(propIndicators || DEFAULT_INDICATORS);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');

  // Use chart data hook for modal-specific data fetching with auto-refresh
  const {
    data: modalData,
    loading,
    error,
    refetch,
  } = useChartData(selectedToken?.id || null, timeframe, {
    enableRealTime: true,
    debounceDelay: 200, // Faster updates in modal

  });

  /**
   * Auto-load data when modal opens or token changes
   */
  useEffect(() => {
    if (isOpen && selectedToken?.id) {
      // Automatically fetch data when modal opens
      refetch();
    }
  }, [isOpen, selectedToken?.id, refetch]);

  /**
   * Auto-reload data when timeframe changes
   */
  useEffect(() => {
    if (isOpen && selectedToken?.id) {
      // Small delay to prevent rapid API calls
      const timer = setTimeout(() => {
        refetch();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [timeframe, isOpen, selectedToken?.id, refetch]);

  /**
   * Handle timeframe changes with cache invalidation
   */
  const handleTimeframeChange = useCallback((newTimeframe: TimeInterval) => {
    setTimeframe(newTimeframe);
  }, [timeframe]);

  /**
   * Handle chart type changes
   */
  const handleChartTypeChange = useCallback((newType: ChartType) => {
    setChartType(newType);
  }, [chartType]);

  /**
   * Handle indicator toggles
   */
  const handleIndicatorToggle = useCallback((indicatorId: string) => {
    setIndicators(prev => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId as keyof typeof prev],
        enabled: !prev[indicatorId as keyof typeof prev].enabled,
      },
    }));
  }, []);

  /**
   * Enhanced fullscreen toggle with comprehensive mobile browser support
   */
  const handleFullscreenToggle = useCallback(async () => {
    console.log(`📊 ChartModal: Fullscreen toggle requested (Android: ${isAndroid}, Current: ${isFullscreen})`);

    try {
      if (!document.fullscreenElement) {
        console.log('📊 ChartModal: Entering fullscreen mode');

        // Get the modal element instead of document for better mobile support
        const modalElement = document.querySelector('[data-modal="chart"]') || document.documentElement;

        // Try different fullscreen APIs based on browser support
        let fullscreenPromise: Promise<void> | null = null;

        if (modalElement.requestFullscreen) {
          console.log('📊 ChartModal: Using standard requestFullscreen');
          fullscreenPromise = modalElement.requestFullscreen();
        } else if ((modalElement as any).webkitRequestFullscreen) {
          console.log('📊 ChartModal: Using webkit requestFullscreen');
          fullscreenPromise = (modalElement as any).webkitRequestFullscreen();
        } else if ((modalElement as any).webkitRequestFullScreen) {
          console.log('📊 ChartModal: Using webkit requestFullScreen (old)');
          fullscreenPromise = (modalElement as any).webkitRequestFullScreen();
        } else if ((modalElement as any).mozRequestFullScreen) {
          console.log('📊 ChartModal: Using moz requestFullScreen');
          fullscreenPromise = (modalElement as any).mozRequestFullScreen();
        } else if ((modalElement as any).msRequestFullscreen) {
          console.log('📊 ChartModal: Using ms requestFullscreen');
          fullscreenPromise = (modalElement as any).msRequestFullscreen();
        }

        if (fullscreenPromise) {
          await fullscreenPromise;
          setIsFullscreen(true);
          console.log('📊 ChartModal: Fullscreen entered successfully');
        } else {
          // Fallback for browsers without fullscreen API
          console.log('📊 ChartModal: No fullscreen API available, using CSS fallback');
          await this.enterFullscreenFallback(modalElement);
        }

      } else {
        console.log('📊 ChartModal: Exiting fullscreen mode');

        // Exit fullscreen with multiple API support
        let exitPromise: Promise<void> | null = null;

        if (document.exitFullscreen) {
          exitPromise = document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          exitPromise = (document as any).webkitExitFullscreen();
        } else if ((document as any).webkitCancelFullScreen) {
          exitPromise = (document as any).webkitCancelFullScreen();
        } else if ((document as any).mozCancelFullScreen) {
          exitPromise = (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          exitPromise = (document as any).msExitFullscreen();
        }

        if (exitPromise) {
          await exitPromise;
        } else {
          // Fallback exit
          this.exitFullscreenFallback();
        }

        setIsFullscreen(false);
        console.log('📊 ChartModal: Fullscreen exited successfully');
      }

    } catch (err) {
      console.warn('📊 ChartModal: Fullscreen operation failed, trying fallback:', err);

      // Enhanced fallback for mobile devices
      if (!document.fullscreenElement) {
        await this.enterFullscreenFallback();
      } else {
        this.exitFullscreenFallback();
      }
    }
  }, [isAndroid, isFullscreen]);

  /**
   * Fallback method to simulate fullscreen using CSS and viewport manipulation
   */
  const enterFullscreenFallback = useCallback(async (element?: Element) => {
    console.log('📊 ChartModal: Entering fullscreen fallback mode');

    try {
      // Hide browser UI on mobile
      if (isAndroid || /iPhone|iPad|iPod/.test(navigator.userAgent)) {
        // Scroll to top to hide address bar
        window.scrollTo(0, 1);

        // Manipulate viewport for mobile
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
          viewport.setAttribute('data-original-content', viewport.getAttribute('content') || '');
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover');
        }

        // Add fullscreen class to body
        document.body.classList.add('fullscreen-fallback');

        // Request orientation lock if available
        if ('orientation' in screen && 'lock' in screen.orientation) {
          try {
            await (screen.orientation as any).lock('landscape');
            console.log('📊 ChartModal: Orientation locked to landscape');
          } catch (orientationErr) {
            console.log('📊 ChartModal: Orientation lock not available or failed');
          }
        }
      }

      setIsFullscreen(true);
      console.log('📊 ChartModal: Fullscreen fallback activated');

    } catch (fallbackErr) {
      console.error('📊 ChartModal: Fullscreen fallback failed:', fallbackErr);
      // Just update state as last resort
      setIsFullscreen(true);
    }
  }, [isAndroid]);

  /**
   * Exit fullscreen fallback mode
   */
  const exitFullscreenFallback = useCallback(() => {
    console.log('📊 ChartModal: Exiting fullscreen fallback mode');

    try {
      // Restore viewport
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        const originalContent = viewport.getAttribute('data-original-content');
        if (originalContent) {
          viewport.setAttribute('content', originalContent);
          viewport.removeAttribute('data-original-content');
        }
      }

      // Remove fullscreen class
      document.body.classList.remove('fullscreen-fallback');

      // Unlock orientation if available
      if ('orientation' in screen && 'unlock' in screen.orientation) {
        try {
          (screen.orientation as any).unlock();
          console.log('📊 ChartModal: Orientation unlocked');
        } catch (orientationErr) {
          console.log('📊 ChartModal: Orientation unlock not available or failed');
        }
      }

      setIsFullscreen(false);
      console.log('📊 ChartModal: Fullscreen fallback deactivated');

    } catch (fallbackErr) {
      console.error('📊 ChartModal: Fullscreen fallback exit failed:', fallbackErr);
      setIsFullscreen(false);
    }
  }, []);

  /**
   * Handle refresh data with retry logic
   */
  const handleRefresh = useCallback(async () => {
    try {
      setLastError(null);
      await refetch();
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      const error = err as Error;
      setLastError(error);

      // Implement exponential backoff retry
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          refetch();
        }, delay);
      }
    }
  }, [refetch, retryCount]);

  /**
   * Auto-retry on error with exponential backoff
   */
  useEffect(() => {
    if (error && retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000;
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        refetch();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [error, retryCount, refetch]);

  /**
   * Handle modal close with cleanup
   */
  const handleClose = useCallback(() => {
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setIsFullscreen(false);
    onClose();
  }, [onClose]);

  /**
   * Enhanced device detection and orientation management
   */
  useEffect(() => {
    // Comprehensive device detection
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroidDevice = userAgent.includes('android');
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isMobileDevice = isAndroidDevice || isIOSDevice || /mobile|tablet/.test(userAgent);

    setIsAndroid(isAndroidDevice);

    console.log(`📊 ChartModal: Device detection - Android: ${isAndroidDevice}, iOS: ${isIOSDevice}, Mobile: ${isMobileDevice}`);

    // Enhanced orientation detection
    const checkOrientation = () => {
      const isLandscapeMode = window.innerWidth > window.innerHeight;

      // Use modern screen.orientation API if available, fallback to deprecated window.orientation
      let orientationAngle = 0;
      if ('orientation' in screen && screen.orientation) {
        orientationAngle = screen.orientation.angle || 0;
      } else if ('orientation' in window) {
        orientationAngle = (window as any).orientation || 0;
      }

      const isLandscapeByAngle = Math.abs(orientationAngle) === 90;

      // Use both methods for better accuracy
      const finalLandscape = isLandscapeMode || isLandscapeByAngle;

      setIsLandscape(finalLandscape);

      console.log(`📊 ChartModal: Orientation - Width: ${window.innerWidth}, Height: ${window.innerHeight}, Angle: ${orientationAngle}, Landscape: ${finalLandscape}`);

      // Update CSS classes for responsive behavior
      if (finalLandscape) {
        document.body.classList.add('chart-landscape');
        document.body.classList.remove('chart-portrait');
      } else {
        document.body.classList.add('chart-portrait');
        document.body.classList.remove('chart-landscape');
      }
    };

    // Initial check
    checkOrientation();

    // Listen for orientation changes with debouncing
    let orientationTimer: NodeJS.Timeout;
    const debouncedOrientationCheck = () => {
      clearTimeout(orientationTimer);
      orientationTimer = setTimeout(checkOrientation, 100);
    };

    window.addEventListener('resize', debouncedOrientationCheck);
    window.addEventListener('orientationchange', debouncedOrientationCheck);

    // Additional mobile-specific events
    if (isMobileDevice) {
      window.addEventListener('deviceorientation', debouncedOrientationCheck);
    }

    return () => {
      clearTimeout(orientationTimer);
      window.removeEventListener('resize', debouncedOrientationCheck);
      window.removeEventListener('orientationchange', debouncedOrientationCheck);
      if (isMobileDevice) {
        window.removeEventListener('deviceorientation', debouncedOrientationCheck);
      }

      // Cleanup CSS classes
      document.body.classList.remove('chart-landscape', 'chart-portrait');
    };
  }, []);

  /**
   * Listen for fullscreen changes
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  /**
   * Handle escape key to close modal
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleClose]);

  // Use modal data if available, otherwise fall back to prop data
  const chartData = modalData.length > 0 ? modalData : data;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        data-modal="chart"
        className={`
          max-w-full max-h-full w-screen h-screen p-0 bg-black border-0
          ${isFullscreen ? 'fixed inset-0 z-[9999]' : ''}
          ${isAndroid ? 'android-optimized' : ''}
          ${isLandscape ? 'landscape-mode' : 'portrait-mode'}
        `}
        style={{
          margin: 0,
          borderRadius: 0,
          // Android-specific optimizations
          ...(isAndroid && {
            WebkitOverflowScrolling: 'touch',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'manipulation',
          }),
          // Landscape-specific optimizations
          ...(isLandscape && {
            height: '100vh',
            width: '100vw',
          }),
        }}
      >
        {/* Modal Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-gray-800 bg-black">
          <DialogTitle className="text-white font-medium flex items-center gap-3" style={{ fontFamily: 'Poppins' }}>
            {selectedToken && (
              <>
                <span className="text-lg">{selectedToken.symbol?.toUpperCase()}</span>
                <span className="text-gray-400 text-sm">{selectedToken.name}</span>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                  {timeframe.toUpperCase()}
                </span>
              </>
            )}
          </DialogTitle>
          
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="h-10 w-10 p-0 hover:bg-gray-800 rounded-lg"
              aria-label="Refresh chart data"
            >
              <RotateCcw size={18} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFullscreenToggle}
              className="h-10 w-10 p-0 hover:bg-gray-800 rounded-lg"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <Maximize2 size={18} className="text-gray-400" />
            </Button>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-10 w-10 p-0 hover:bg-gray-800 rounded-lg"
              aria-label="Close chart modal"
            >
              <X size={18} className="text-gray-400" />
            </Button>
          </div>
        </DialogHeader>

        {/* Modal Content - Mobile Optimized */}
        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
          {/* Chart Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-2 lg:p-4">
              <ChartModalErrorBoundary>
                <TradingChart
                  selectedToken={selectedToken}
                  data={chartData}
                  height={
                    isFullscreen
                      ? window.innerHeight - (isLandscape ? 100 : 200)
                      : isLandscape && isAndroid
                        ? Math.min(window.innerHeight - 150, window.innerHeight * 0.8)
                        : window.innerWidth < 1024
                          ? Math.min(window.innerHeight - 300, 500)
                          : 600
                  }
                  theme={theme}
                  isLoading={loading}
                  error={error}
                  showIndicators={true}
                  enableTouchSlider={true}
                  indicators={indicators}
                  chartType={chartType}
                  onTimeframeChange={handleTimeframeChange}
                  onChartTypeChange={handleChartTypeChange}
                />
              </ChartModalErrorBoundary>
            </div>
          </div>

          {/* Controls - Mobile: Bottom, Desktop: Sidebar */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-800 bg-black overflow-y-auto">
            <ChartControls
              timeframe={timeframe}
              onTimeframeChange={handleTimeframeChange}
              chartType={chartType}
              onChartTypeChange={handleChartTypeChange}
              indicators={indicators}
              onIndicatorToggle={handleIndicatorToggle}
              theme={theme}
            />
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B1420A]"></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

ChartModal.displayName = 'ChartModal';

export default ChartModal;
