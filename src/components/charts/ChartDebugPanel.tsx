/**
 * CHART DEBUG PANEL COMPONENT
 * 
 * Comprehensive testing panel for chart functionality
 */

import React, { useState, useCallback, useEffect } from 'react';
import { TradingChart } from './TradingChart';
import { ChartTypeSelector, ChartType } from './ChartTypeSelector';
import { useChartData } from '../../hooks/useChartData';
import { Button } from '../ui/button';
import { RefreshCw, Settings, TrendingUp } from 'lucide-react';
import { logEnvironmentVariables } from '../../utils/envTest';

interface ChartDebugPanelProps {
  selectedToken?: {
    id: string;
    symbol: string;
    name: string;
  };
}

const timeframes = [
  { value: '1d', label: '1 Day', days: '1' },
  { value: '7d', label: '7 Days', days: '7' },
  { value: '1m', label: '1 Month', days: '30' },
  { value: '6m', label: '6 Months', days: '180' },
  { value: '1y', label: '1 Year', days: '365' }
];

export const ChartDebugPanel: React.FC<ChartDebugPanelProps> = ({
  selectedToken = { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' }
}) => {
  // Chart state
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [indicators, setIndicators] = useState({
    ema: { enabled: false, period: 14 },
    rsi: { enabled: false, period: 14 }
  });

  // Log environment variables on mount for debugging
  useEffect(() => {
    const envVars = logEnvironmentVariables();
    console.log('🔧 ChartDebugPanel Environment Check:', envVars);

    // Force log all process.env variables that start with REACT_APP
    console.log('🔧 All REACT_APP environment variables:');
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('REACT_APP')) {
        console.log(`  ${key}:`, process.env[key]);
      }
    });
  }, []);

  // Chart data hook
  const {
    data: chartData,
    loading: chartLoading,
    error: chartError,
    source,
    isUsingMicroservice,
    lastUpdated,
    refetch
  } = useChartData(
    selectedToken.id,
    selectedTimeframe as any, // TimeInterval type
    {
      enableRealTime: true,
      debounceDelay: 300,
      forceRefresh: false
    }
  );

  // Event handlers
  const handleTimeframeChange = useCallback((timeframe: string) => {
    console.log('🔧 Debug: Changing timeframe from', selectedTimeframe, 'to', timeframe);
    setSelectedTimeframe(timeframe);
  }, [selectedTimeframe]);

  const handleChartTypeChange = useCallback((type: ChartType) => {
    console.log('🔧 Debug: Changing chart type from', chartType, 'to', type);
    setChartType(type);
  }, [chartType]);

  const handleIndicatorToggle = useCallback((indicator: 'ema' | 'rsi') => {
    console.log('🔧 Debug: Toggling indicator', indicator);
    setIndicators(prev => ({
      ...prev,
      [indicator]: {
        ...prev[indicator],
        enabled: !prev[indicator].enabled
      }
    }));
  }, []);

  const handleRefresh = useCallback(() => {
    console.log('🔧 Debug: Manual refresh triggered');
    refetch();
  }, [refetch]);

  const handleTestMicroservice = useCallback(async () => {
    console.log('🔧 Debug: Testing microservice directly...');
    console.log('🔧 Debug: Environment variables:');
    console.log('  REACT_APP_USE_CHART_MICROSERVICE:', process.env.REACT_APP_USE_CHART_MICROSERVICE);
    console.log('  REACT_APP_CHART_API_URL:', process.env.REACT_APP_CHART_API_URL);

    try {
      const healthUrl = 'http://localhost:4000/api/v1/health';
      console.log('🔧 Debug: Testing health endpoint:', healthUrl);
      const response = await fetch(healthUrl);
      const data = await response.json();
      console.log('🔧 Debug: Microservice health response:', data);

      const chartUrl = 'http://localhost:4000/api/v1/chart/bitcoin/1';
      console.log('🔧 Debug: Testing chart endpoint:', chartUrl);
      const chartResponse = await fetch(chartUrl);
      const chartData = await chartResponse.json();
      console.log('🔧 Debug: Microservice chart response:', chartData);

      // Test the chart service directly
      console.log('🔧 Debug: Testing chartDataService directly...');
      const { chartDataService } = await import('../../services/chartDataService');
      const serviceData = await chartDataService.fetchCandles('bitcoin', '1', true);
      console.log('🔧 Debug: Chart service response:', serviceData);

    } catch (error) {
      console.error('🔧 Debug: Microservice test failed:', error);
    }
  }, []);

  return (
    <div className="space-y-6 p-6 bg-black border border-gray-800 rounded-xl">
      {/* Debug Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrendingUp className="text-[#B1420A]" size={24} />
          <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'Poppins' }}>
            Chart Debug Panel
          </h2>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <span>Source: {source}</span>
          <span>•</span>
          <span>Microservice: {isUsingMicroservice ? 'ON' : 'OFF'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeframe Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300" style={{ fontFamily: 'Poppins' }}>
            Timeframe
          </label>
          <div className="flex flex-wrap gap-2">
            {timeframes.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleTimeframeChange(value)}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${selectedTimeframe === value
                    ? 'bg-[#B1420A] text-white shadow-lg'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
                style={{ fontFamily: 'Poppins' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Type Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300" style={{ fontFamily: 'Poppins' }}>
            Chart Type
          </label>
          <ChartTypeSelector
            selectedType={chartType}
            onTypeChange={handleChartTypeChange}
          />
        </div>

        {/* Technical Indicators */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300" style={{ fontFamily: 'Poppins' }}>
            Technical Indicators
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleIndicatorToggle('ema')}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${indicators.ema.enabled
                  ? 'bg-[#B1420A] text-white shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              `}
              style={{ fontFamily: 'Poppins' }}
            >
              EMA (14)
            </button>
            <button
              onClick={() => handleIndicatorToggle('rsi')}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${indicators.rsi.enabled
                  ? 'bg-[#B1420A] text-white shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              `}
              style={{ fontFamily: 'Poppins' }}
            >
              RSI (14)
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span>Token: {selectedToken.symbol}</span>
          <span>•</span>
          <span>Data Points: {chartData?.length || 0}</span>
          <span>•</span>
          <span>Loading: {chartLoading ? 'YES' : 'NO'}</span>
          {chartError && (
            <>
              <span>•</span>
              <span className="text-red-400">Error: {chartError.message}</span>
            </>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            disabled={chartLoading}
          >
            <RefreshCw size={16} className={chartLoading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button
            onClick={handleTestMicroservice}
            variant="outline"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <Settings size={16} />
            Test API
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-black border border-gray-800 rounded-xl overflow-hidden">
        <TradingChart
          selectedToken={selectedToken}
          data={chartData}
          height={400}
          theme="dark"
          isLoading={chartLoading}
          error={chartError}
          showIndicators={true}
          enableTouchSlider={true}
          indicators={indicators}
          chartType={chartType}
          onTimeframeChange={handleTimeframeChange}
          onChartTypeChange={handleChartTypeChange}
        />
      </div>

      {/* Debug Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>Last Updated: {lastUpdated?.toLocaleString() || 'Never'}</div>
        <div>Chart Type: {chartType}</div>
        <div>Timeframe: {selectedTimeframe}</div>
        <div>EMA Enabled: {indicators.ema.enabled ? 'Yes' : 'No'}</div>
        <div>RSI Enabled: {indicators.rsi.enabled ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
};

export default ChartDebugPanel;
