/**
 * ENTERPRISE CHART TYPE DEFINITIONS
 * 
 * Comprehensive type definitions for TradingView Lightweight Charts
 * with mobile-first optimizations and enterprise-level features
 */

import { Time, CandlestickData, LineData } from 'lightweight-charts';
import { Token } from './index';

// Core Chart Data Types
export interface ChartDataPoint {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface PriceDataPoint {
  time: Time;
  value: number;
}

export interface VolumeDataPoint {
  time: Time;
  value: number;
  color?: string;
}

// Chart Configuration Types
export interface ChartConfig {
  width: number;
  height: number;
  layout: {
    background: { color: string };
    textColor: string;
  };
  grid: {
    vertLines: { color: string };
    horzLines: { color: string };
  };
  crosshair: {
    mode: number;
  };
  rightPriceScale: {
    borderColor: string;
    scaleMargins: {
      top: number;
      bottom: number;
    };
  };
  timeScale: {
    borderColor: string;
    timeVisible: boolean;
    secondsVisible: boolean;
  };
  handleScroll: {
    mouseWheel: boolean;
    pressedMouseMove: boolean;
    horzTouchDrag: boolean;
    vertTouchDrag: boolean;
  };
  handleScale: {
    axisPressedMouseMove: boolean;
    mouseWheel: boolean;
    pinch: boolean;
  };
}

// Chart Types and Intervals
export type ChartType = 'candlestick' | 'line' | 'area' | 'bar';
export type TimeInterval = '1d' | '7d' | '1m' | '6m' | '1y';

export interface TimeframeOption {
  label: string;
  value: TimeInterval;
  days: string; // For CoinGecko API
}

// Technical Indicators
export interface IndicatorConfig {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
  period?: number;
  params?: Record<string, any>;
}

export interface TechnicalIndicators {
  ema: IndicatorConfig;
  sma: IndicatorConfig;
  rsi: IndicatorConfig;
  macd: IndicatorConfig;
  volume: IndicatorConfig;
}

// Mobile-Specific Types
export interface TouchSliderConfig {
  enabled: boolean;
  sensitivity: number;
  minValue: number;
  maxValue: number;
  step: number;
}

export interface MobileChartConfig {
  touchSlider: TouchSliderConfig;
  landscapeModal: {
    enabled: boolean;
    expandButtonSize: number;
    modalHeight: string;
  };
  gestures: {
    pinchZoom: boolean;
    panNavigation: boolean;
    doubleTapZoom: boolean;
  };
}

// Chart Component Props
export interface TradingChartProps {
  selectedToken: Token | null;
  data: CandlestickData[];
  height?: number;
  theme?: 'dark' | 'light';
  isLoading?: boolean;
  error?: Error | null;
  onExpand?: () => void;
  showIndicators?: boolean;
  enableTouchSlider?: boolean;
  mobileConfig?: MobileChartConfig;
  indicators?: TechnicalIndicators;
  chartType?: ChartType;
  onTimeframeChange?: (timeframe: TimeInterval) => void;
  onChartTypeChange?: (type: ChartType) => void;
}

// Chart Modal Props
export interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedToken: Token | null;
  data: CandlestickData[];
  indicators?: TechnicalIndicators;
  theme?: 'dark' | 'light';
}

// Chart Controls Props
export interface ChartControlsProps {
  timeframe: TimeInterval;
  onTimeframeChange: (timeframe: TimeInterval) => void;
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  indicators: TechnicalIndicators;
  onIndicatorToggle: (indicatorId: string) => void;
  theme?: 'dark' | 'light';
}

// Data Service Types
export interface ChartDataCache {
  [key: string]: {
    data: CandlestickData[];
    timestamp: number;
    ttl: number;
    quality: number; // Data quality score 0-1
  };
}

export interface ChartDataServiceConfig {
  cacheTTL: number;
  maxCacheSize: number;
  retryAttempts: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  debounceDelay: number;
}

// WebSocket Types
export interface ChartWebSocketUpdate {
  tokenId: string;
  price: number;
  volume?: number;
  timestamp: number;
  change24h?: number;
}

// Error Types
export interface ChartError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
  timestamp: number;
}

// Performance Monitoring Types
export interface ChartPerformanceMetrics {
  renderTime: number;
  dataFetchTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  activeConnections: number;
}

// Constants
export const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { label: '1 Day', value: '1d', days: '1' },
  { label: '7 Days', value: '7d', days: '7' },
  { label: '1 Month', value: '1m', days: '30' },
  { label: '6 Months', value: '6m', days: '180' },
  { label: '1 Year', value: '1y', days: '365' },
];

export const DEFAULT_CHART_CONFIG: Partial<ChartConfig> = {
  layout: {
    background: { color: '#000000' },
    textColor: '#FFFFFF',
  },
  grid: {
    vertLines: { color: '#2C2C2E' },
    horzLines: { color: '#2C2C2E' },
  },
  crosshair: {
    mode: 1, // CrosshairMode.Normal
  },
  rightPriceScale: {
    borderColor: '#2C2C2E',
    scaleMargins: {
      top: 0.1,
      bottom: 0.2,
    },
  },
  timeScale: {
    borderColor: '#2C2C2E',
    timeVisible: true,
    secondsVisible: false,
  },
  handleScroll: {
    mouseWheel: true,
    pressedMouseMove: true,
    horzTouchDrag: true,
    vertTouchDrag: true,
  },
  handleScale: {
    axisPressedMouseMove: true,
    mouseWheel: true,
    pinch: true,
  },
};

export const DEFAULT_MOBILE_CONFIG: MobileChartConfig = {
  touchSlider: {
    enabled: true,
    sensitivity: 1.0,
    minValue: 0,
    maxValue: 100,
    step: 0.1,
  },
  landscapeModal: {
    enabled: true,
    expandButtonSize: 44,
    modalHeight: '100vh',
  },
  gestures: {
    pinchZoom: true,
    panNavigation: true,
    doubleTapZoom: true,
  },
};

export const DEFAULT_INDICATORS: TechnicalIndicators = {
  ema: {
    id: 'ema',
    name: 'EMA (14)',
    enabled: false,
    color: '#B1420A',
    period: 14,
  },
  sma: {
    id: 'sma',
    name: 'SMA (20)',
    enabled: false,
    color: '#34C759',
    period: 20,
  },
  rsi: {
    id: 'rsi',
    name: 'RSI (14)',
    enabled: false,
    color: '#FF3B30',
    period: 14,
  },
  macd: {
    id: 'macd',
    name: 'MACD',
    enabled: false,
    color: '#8E8E93',
  },
  volume: {
    id: 'volume',
    name: 'Volume',
    enabled: true,
    color: '#2C2C2E',
  },
};
