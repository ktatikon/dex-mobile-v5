/**
 * CHART TEST PAGE
 * 
 * Simple test page to verify the TradingChart component is working correctly
 */

import React, { useState } from 'react';
import { TradingChart, ChartControls } from '@/components/charts';
import ChartErrorBoundary from '@/components/charts/ChartErrorBoundary';
import { useChartData } from '@/hooks/useChartData';
import { TimeInterval, ChartType, DEFAULT_INDICATORS } from '@/types/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ChartTestPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<TimeInterval>('1d');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [indicators, setIndicators] = useState(DEFAULT_INDICATORS);

  // Test with Bitcoin data
  const {
    data: chartData,
    loading: chartLoading,
    error: chartError,
    refetch,
  } = useChartData('bitcoin', timeframe, {
    enableRealTime: true,
    debounceDelay: 300,
  });

  const handleIndicatorToggle = (indicatorId: string) => {
    setIndicators(prev => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId as keyof typeof prev],
        enabled: !prev[indicatorId as keyof typeof prev].enabled,
      },
    }));
  };

  const testToken = {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    logo: '',
    decimals: 8,
    price: 45000,
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-black border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-2xl font-bold" style={{ fontFamily: 'Poppins' }}>
              Chart Component Test
            </CardTitle>
            <p className="text-gray-400" style={{ fontFamily: 'Poppins' }}>
              Testing TradingView Lightweight Charts integration
            </p>
          </CardHeader>
        </Card>

        <ChartErrorBoundary
          height={500}
          onError={(error, errorInfo) => {
            console.error('📊 Chart Test Error:', error, errorInfo);
          }}
        >
          <Card className="bg-black border-gray-800 rounded-xl overflow-hidden mb-6">
            <CardContent className="p-0">
              <TradingChart
                selectedToken={testToken}
                data={chartData}
                height={500}
                theme="dark"
                isLoading={chartLoading}
                error={chartError}
                showIndicators={true}
                enableTouchSlider={true}
                indicators={indicators}
                onTimeframeChange={setTimeframe}
                onChartTypeChange={setChartType}
              />
            </CardContent>
          </Card>

          <ChartControls
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            chartType={chartType}
            onChartTypeChange={setChartType}
            indicators={indicators}
            onIndicatorToggle={handleIndicatorToggle}
            theme="dark"
          />
        </ChartErrorBoundary>

        {/* Debug Info */}
        <Card className="bg-gray-900 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white text-lg" style={{ fontFamily: 'Poppins' }}>
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm" style={{ fontFamily: 'Poppins' }}>
              <div className="flex justify-between">
                <span className="text-gray-400">Data Points:</span>
                <span className="text-white">{chartData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Loading:</span>
                <span className="text-white">{chartLoading ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Error:</span>
                <span className="text-white">{chartError ? chartError.message : 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Timeframe:</span>
                <span className="text-white">{timeframe}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Chart Type:</span>
                <span className="text-white">{chartType}</span>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={refetch}
                className="bg-[#B1420A] hover:bg-[#D2691E] text-white px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ fontFamily: 'Poppins' }}
              >
                Refetch Data
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChartTestPage;
