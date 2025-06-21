/**
 * CHART CONTROLS COMPONENT
 * 
 * Mobile-optimized controls for timeframe selection, chart type switching,
 * and technical indicator toggles with 44px minimum touch targets
 */

import React, { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartControlsProps, TIMEFRAME_OPTIONS, TimeInterval, ChartType } from '@/types/chart';
import { TrendingUp, BarChart3, Activity, Eye, EyeOff, Clock, ChevronDown } from 'lucide-react';

export const ChartControls = memo<ChartControlsProps>(({
  timeframe,
  onTimeframeChange,
  chartType,
  onChartTypeChange,
  indicators,
  onIndicatorToggle,
  theme = 'dark',
}) => {
  /**
   * Handle timeframe selection with validation and logging
   */
  const handleTimeframeClick = useCallback((newTimeframe: TimeInterval) => {
    if (newTimeframe !== timeframe) {
      console.log(`📊 ChartControls: Timeframe changing from ${timeframe} to ${newTimeframe}`);

      // Validate timeframe
      const validTimeframes = TIMEFRAME_OPTIONS.map(opt => opt.value);
      if (!validTimeframes.includes(newTimeframe)) {
        console.error(`📊 ChartControls: Invalid timeframe ${newTimeframe}`);
        return;
      }

      try {
        onTimeframeChange(newTimeframe);
        console.log(`📊 ChartControls: Timeframe change successful`);
      } catch (error) {
        console.error(`📊 ChartControls: Timeframe change failed:`, error);
      }
    }
  }, [timeframe, onTimeframeChange]);

  /**
   * Handle chart type selection with validation and logging
   */
  const handleChartTypeClick = useCallback((newType: ChartType) => {
    if (newType !== chartType) {
      console.log(`📊 ChartControls: Chart type changing from ${chartType} to ${newType}`);

      // Validate chart type
      const validTypes: ChartType[] = ['candlestick', 'line', 'area', 'bar'];
      if (!validTypes.includes(newType)) {
        console.error(`📊 ChartControls: Invalid chart type ${newType}`);
        return;
      }

      try {
        onChartTypeChange(newType);
        console.log(`📊 ChartControls: Chart type change successful`);
      } catch (error) {
        console.error(`📊 ChartControls: Chart type change failed:`, error);
      }
    }
  }, [chartType, onChartTypeChange]);

  /**
   * Handle indicator toggle with validation and logging
   */
  const handleIndicatorToggle = useCallback((indicatorId: string) => {
    console.log(`📊 ChartControls: Toggling indicator ${indicatorId}`);

    // Validate indicator ID
    const validIndicators = ['ema', 'sma', 'rsi', 'macd', 'volume'];
    if (!validIndicators.includes(indicatorId)) {
      console.error(`📊 ChartControls: Invalid indicator ${indicatorId}`);
      return;
    }

    // Check if indicator exists in current indicators
    if (!indicators[indicatorId as keyof typeof indicators]) {
      console.error(`📊 ChartControls: Indicator ${indicatorId} not found in current indicators`);
      return;
    }

    try {
      onIndicatorToggle(indicatorId);
      console.log(`📊 ChartControls: Indicator ${indicatorId} toggle successful`);
    } catch (error) {
      console.error(`📊 ChartControls: Indicator toggle failed:`, error);
    }
  }, [onIndicatorToggle, indicators]);

  return (
    <div className="p-3 bg-black border-t border-gray-800">
      {/* Mobile-Optimized Controls Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Timeframe Dropdown */}
        <div className="space-y-1">
          <Select value={timeframe} onValueChange={handleTimeframeClick}>
            <SelectTrigger
              className="h-11 bg-transparent border-gray-600 hover:border-gray-500 text-white rounded-lg"
              style={{ fontFamily: 'Poppins' }}
            >
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#B1420A]" />
                <span className="text-sm">
                  {TIMEFRAME_OPTIONS.find(opt => opt.value === timeframe)?.label || 'Time'}
                </span>
                <ChevronDown size={14} className="text-gray-400 ml-auto" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1C1C1E] border-gray-600 text-white">
              {TIMEFRAME_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="hover:bg-gray-800 focus:bg-gray-800 text-white cursor-pointer"
                  style={{ fontFamily: 'Poppins' }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    <span className="text-xs text-gray-400 ml-2">({option.days}d)</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Chart Type Dropdown */}
        <div className="space-y-1">
          <Select value={chartType} onValueChange={handleChartTypeClick}>
            <SelectTrigger
              className="h-11 bg-transparent border-gray-600 hover:border-gray-500 text-white rounded-lg"
              style={{ fontFamily: 'Poppins' }}
            >
              <div className="flex items-center gap-2">
                {chartType === 'candlestick' && <BarChart3 size={16} className="text-[#B1420A]" />}
                {chartType === 'line' && <TrendingUp size={16} className="text-[#B1420A]" />}
                {chartType === 'area' && <Activity size={16} className="text-[#B1420A]" />}
                <span className="text-sm">
                  {chartType === 'candlestick' ? 'Candles' : chartType === 'line' ? 'Line' : 'Area'}
                </span>
                <ChevronDown size={14} className="text-gray-400 ml-auto" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1C1C1E] border-gray-600 text-white">
              <SelectItem
                value="candlestick"
                className="hover:bg-gray-800 focus:bg-gray-800 text-white cursor-pointer"
                style={{ fontFamily: 'Poppins' }}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} />
                  <span>Candlestick</span>
                </div>
              </SelectItem>
              <SelectItem
                value="line"
                className="hover:bg-gray-800 focus:bg-gray-800 text-white cursor-pointer"
                style={{ fontFamily: 'Poppins' }}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} />
                  <span>Line</span>
                </div>
              </SelectItem>
              <SelectItem
                value="area"
                className="hover:bg-gray-800 focus:bg-gray-800 text-white cursor-pointer"
                style={{ fontFamily: 'Poppins' }}
              >
                <div className="flex items-center gap-2">
                  <Activity size={16} />
                  <span>Area</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Indicators Dropdown */}
        <div className="space-y-1">
          <Select>
            <SelectTrigger
              className="h-11 bg-transparent border-gray-600 hover:border-gray-500 text-white rounded-lg"
              style={{ fontFamily: 'Poppins' }}
            >
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-[#B1420A]" />
                <span className="text-sm">Indicators</span>
                <ChevronDown size={14} className="text-gray-400 ml-auto" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1C1C1E] border-gray-600 text-white">
              <div className="p-2 space-y-2">
                {/* EMA Toggle */}
                <div
                  onClick={() => handleIndicatorToggle('ema')}
                  className="flex items-center justify-between p-2 hover:bg-gray-800 rounded cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ fontFamily: 'Poppins' }}>EMA (14)</span>
                  </div>
                  {indicators.ema.enabled ? (
                    <Eye size={16} className="text-[#B1420A]" />
                  ) : (
                    <EyeOff size={16} className="text-gray-500" />
                  )}
                </div>

                {/* RSI Toggle */}
                <div
                  onClick={() => handleIndicatorToggle('rsi')}
                  className="flex items-center justify-between p-2 hover:bg-gray-800 rounded cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ fontFamily: 'Poppins' }}>RSI (14)</span>
                  </div>
                  {indicators.rsi.enabled ? (
                    <Eye size={16} className="text-[#FF3B30]" />
                  ) : (
                    <EyeOff size={16} className="text-gray-500" />
                  )}
                </div>

                {/* SMA Toggle */}
                <div
                  onClick={() => handleIndicatorToggle('sma')}
                  className="flex items-center justify-between p-2 hover:bg-gray-800 rounded cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ fontFamily: 'Poppins' }}>SMA (20)</span>
                  </div>
                  {indicators.sma.enabled ? (
                    <Eye size={16} className="text-[#34C759]" />
                  ) : (
                    <EyeOff size={16} className="text-gray-500" />
                  )}
                </div>

                {/* Volume Toggle */}
                <div
                  onClick={() => handleIndicatorToggle('volume')}
                  className="flex items-center justify-between p-2 hover:bg-gray-800 rounded cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ fontFamily: 'Poppins' }}>Volume</span>
                  </div>
                  {indicators.volume.enabled ? (
                    <Eye size={16} className="text-[#8E8E93]" />
                  ) : (
                    <EyeOff size={16} className="text-gray-500" />
                  )}
                </div>
              </div>
            </SelectContent>
          </Select>
        </div>
      </div>

    </div>
  );
});

ChartControls.displayName = 'ChartControls';

export default ChartControls;
