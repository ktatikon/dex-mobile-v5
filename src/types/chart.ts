/**
 * Chart-related TypeScript interfaces for TradingChart component
 * Enterprise-grade type definitions for OHLC data and chart configuration
 */

export type TimeInterval = '1D' | '7D' | '30D' | '90D' | '180D';

export interface ChartDataPoint {
  timestamp: number; // Unix timestamp in milliseconds
  open: number;      // Opening price in USD
  high: number;      // Highest price in USD
  low: number;       // Lowest price in USD
  close: number;     // Closing price in USD
  volume: number;    // Trading volume
}

export interface ChartData {
  symbol: string;
  interval: TimeInterval;
  data: ChartDataPoint[];
  lastUpdated: number;
  currentPrice?: number;
}

export interface TradingChartProps {
  selectedToken: {
    id: string;
    symbol: string;
    name: string;
    price?: number;
    logo?: string;
  };
  timeInterval?: TimeInterval;
  isLoading?: boolean;
  className?: string;
}

export interface ChartConfig {
  height: number;
  candleHeight: number;
  volumeHeight: number;
  colors: {
    bullish: string;
    bearish: string;
    volume: string;
    grid: string;
    background: string;
    currentPrice: string;
  };
  responsive: {
    mobile: { height: number; };
    tablet: { height: number; };
    desktop: { height: number; };
  };
}

export interface ChartError {
  message: string;
  code?: string;
  timestamp: number;
}

export interface ChartCache {
  [key: string]: {
    data: ChartData;
    expiry: number;
  };
}

export interface TooltipData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  formattedTime: string;
  formattedPrice: string;
  formattedVolume: string;
}

export interface ChartInteraction {
  isHovering: boolean;
  tooltipData: TooltipData | null;
  crosshairPosition: { x: number; y: number } | null;
}
