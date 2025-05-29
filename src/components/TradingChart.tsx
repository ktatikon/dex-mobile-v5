/**
 * Trading Chart Component
 * Professional candlestick chart with volume indicators for trading analysis
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Bar,
  ReferenceLine,
  Tooltip,
  Cell,
  Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { TradingChartProps, TimeInterval, ChartDataPoint, TooltipData } from '@/types/chart';
import { useChartData } from '@/hooks/useChartData';
import { formatPrice, formatVolume } from '@/services/chartDataService';

// Chart configuration following design system
const CHART_CONFIG = {
  colors: {
    bullish: '#34C759',
    bearish: '#FF3B30',
    volume: '#8E8E93',
    grid: '#2C2C2E',
    background: '#000000',
    currentPrice: '#FF3B30',
    text: '#FFFFFF'
  },
  responsive: {
    mobile: { height: 400 },
    tablet: { height: 450 },
    desktop: { height: 500 }
  }
};

// Time interval options
const TIME_INTERVALS: { value: TimeInterval; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '7D', label: '7D' },
  { value: '30D', label: '30D' },
  { value: '90D', label: '90D' },
  { value: '180D', label: '180D' }
];

// Custom Candlestick component for Recharts
const Candlestick: React.FC<{
  payload?: ChartDataPoint;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}> = ({ payload, x = 0, y = 0, width = 0, height = 0 }) => {
  if (!payload) return null;

  const { open, high, low, close } = payload;
  const isBullish = close >= open;
  const color = isBullish ? CHART_CONFIG.colors.bullish : CHART_CONFIG.colors.bearish;

  const candleWidth = Math.max(1, width * 0.6);
  const candleX = x + (width - candleWidth) / 2;

  // Calculate positions
  const maxPrice = Math.max(open, close);
  const minPrice = Math.min(open, close);
  const priceRange = high - low;

  if (priceRange === 0) return null;

  const bodyHeight = Math.abs(close - open) / priceRange * height;
  const bodyY = y + (high - maxPrice) / priceRange * height;

  return (
    <g>
      {/* Wick line */}
      <line
        x1={x + width / 2}
        y1={y + (high - high) / priceRange * height}
        x2={x + width / 2}
        y2={y + (high - low) / priceRange * height}
        stroke={color}
        strokeWidth={1}
      />

      {/* Candle body */}
      <rect
        x={candleX}
        y={bodyY}
        width={candleWidth}
        height={Math.max(1, bodyHeight)}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

// Custom tooltip component
const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload as ChartDataPoint;
  const { open, high, low, close, volume, timestamp } = data;

  const formattedTime = new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const isPositive = close >= open;

  return (
    <div className="bg-dex-dark border border-dex-secondary/30 rounded-lg p-3 shadow-lg">
      <div className="text-white text-sm font-medium mb-2">{formattedTime}</div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Open:</span>
          <span className="text-white">${formatPrice(open)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">High:</span>
          <span className="text-white">${formatPrice(high)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Low:</span>
          <span className="text-white">${formatPrice(low)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Close:</span>
          <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
            ${formatPrice(close)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Volume:</span>
          <span className="text-white">{formatVolume(volume)}</span>
        </div>
      </div>
    </div>
  );
};

export const TradingChart: React.FC<TradingChartProps> = ({
  selectedToken,
  timeInterval: propTimeInterval = '7D',
  isLoading: propIsLoading = false,
  className = ''
}) => {
  // Chart data hook
  const {
    chartData,
    isLoading: hookIsLoading,
    error,
    timeInterval,
    setTimeInterval,
    refreshData,
    lastUpdated
  } = useChartData({
    tokenId: selectedToken.id,
    tokenSymbol: selectedToken.symbol,
    currentPrice: selectedToken.price,
    initialInterval: propTimeInterval,
    enableAutoRefresh: true
  });

  const isLoading = propIsLoading || hookIsLoading;

  // Prepare chart data for Recharts
  const chartDataFormatted = useMemo(() => {
    if (!chartData?.data) return [];

    return chartData.data.map(point => ({
      ...point,
      // Add formatted timestamp for display
      timeLabel: new Date(point.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }));
  }, [chartData]);

  // Handle time interval change
  const handleIntervalChange = useCallback((newInterval: TimeInterval) => {
    setTimeInterval(newInterval);
  }, [setTimeInterval]);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  // Get responsive height
  const getChartHeight = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return CHART_CONFIG.responsive.mobile.height;
      if (window.innerWidth < 1024) return CHART_CONFIG.responsive.tablet.height;
    }
    return CHART_CONFIG.responsive.desktop.height;
  };

  const chartHeight = getChartHeight();

  return (
    <Card className={`bg-dex-dark/80 border-dex-primary/30 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <TrendingUp size={20} />
              {selectedToken.symbol}/USD Chart
            </CardTitle>
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Time interval selector */}
            <div className="flex bg-dex-dark/50 rounded-lg p-1">
              {TIME_INTERVALS.map(({ value, label }) => (
                <Button
                  key={value}
                  size="sm"
                  variant={timeInterval === value ? 'default' : 'ghost'}
                  className={`text-xs h-8 px-3 ${
                    timeInterval === value
                      ? 'bg-dex-primary text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => handleIntervalChange(value)}
                  disabled={isLoading}
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 px-2 bg-dex-tertiary border-dex-secondary text-white"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 text-yellow-500 text-sm mt-2">
            <AlertCircle size={16} />
            {error.message}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {isLoading && !chartData ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-dex-primary" />
              <div className="text-dex-text-secondary">Loading chart data...</div>
            </div>
          </div>
        ) : chartDataFormatted.length === 0 ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center text-dex-text-secondary">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <div>No chart data available</div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-2 bg-dex-primary text-white"
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartDataFormatted}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CHART_CONFIG.colors.grid}
                  opacity={0.3}
                />

                <XAxis
                  dataKey="timeLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: CHART_CONFIG.colors.text, fontSize: 11 }}
                  interval="preserveStartEnd"
                />

                <YAxis
                  yAxisId="price"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: CHART_CONFIG.colors.text, fontSize: 11 }}
                  domain={['dataMin * 0.99', 'dataMax * 1.01']}
                  tickFormatter={(value) => `$${formatPrice(value)}`}
                />

                <YAxis
                  yAxisId="volume"
                  orientation="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: CHART_CONFIG.colors.text, fontSize: 11 }}
                  tickFormatter={formatVolume}
                />

                <Tooltip content={<CustomTooltip />} />

                {/* Volume bars */}
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  fill={CHART_CONFIG.colors.volume}
                  opacity={0.3}
                  maxBarSize={20}
                />

                {/* Price lines for OHLC visualization */}
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke={CHART_CONFIG.colors.bullish}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />

                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="high"
                  stroke={CHART_CONFIG.colors.bullish}
                  strokeWidth={1}
                  strokeOpacity={0.5}
                  dot={false}
                  connectNulls={false}
                />

                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="low"
                  stroke={CHART_CONFIG.colors.bearish}
                  strokeWidth={1}
                  strokeOpacity={0.5}
                  dot={false}
                  connectNulls={false}
                />

                {/* Current price line */}
                {selectedToken.price && (
                  <ReferenceLine
                    yAxisId="price"
                    y={selectedToken.price}
                    stroke={CHART_CONFIG.colors.currentPrice}
                    strokeDasharray="5 5"
                    strokeWidth={2}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
