# Chart Components for DEX Mobile App

## Setup Chart Components

First, install the required dependencies:

```bash
npm install victory-native react-native-svg
npm install date-fns
```

Create a directory structure:
```
src/
  components/
    charts/
      PriceChart.tsx
      CandlestickChart.tsx
      MiniChart.tsx
      ChartTimeframe.tsx
      index.ts
  hooks/
    useTokenPrice.ts
  types/
    chart.ts
```

## types/chart.ts - Chart Data Types

```typescript
// Define chart data types
export interface PriceDataPoint {
  timestamp: number;
  price: number;
}

export interface CandlestickDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TimeframeOption = '1H' | '1D' | '1W' | '1M' | 'ALL';

export interface TokenPriceData {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCap: number;
  totalVolume: number;
  priceHistory: PriceDataPoint[];
  candlesticks?: CandlestickDataPoint[];
}
```

## PriceChart.tsx - Line Chart Component

```typescript
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryArea, VictoryTooltip, VictoryVoronoiContainer } from 'victory-native';
import { format } from 'date-fns';
import { Text, XStack, YStack } from 'tamagui';
import { PriceDataPoint, TimeframeOption } from '../types/chart';
import { ChartTimeframe } from './ChartTimeframe';

interface PriceChartProps {
  data: PriceDataPoint[];
  symbol: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  onTimeframeChange?: (timeframe: TimeframeOption) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const PriceChart: React.FC<PriceChartProps> = ({
  data,
  symbol,
  currentPrice,
  priceChange24h,
  priceChangePercentage24h,
  onTimeframeChange,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>('1D');
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  
  // Format data for the chart
  const chartData = useMemo(() => {
    return data.map((point) => ({
      x: new Date(point.timestamp),
      y: point.price,
    }));
  }, [data]);
  
  // Determine chart color based on price change
  const isPriceUp = priceChangePercentage24h >= 0;
  const chartColor = isPriceUp ? '#34C759' : '#FF3B30';
  
  // Handle timeframe change
  const handleTimeframeChange = (timeframe: TimeframeOption) => {
    setSelectedTimeframe(timeframe);
    setSelectedPrice(null);
    if (onTimeframeChange) {
      onTimeframeChange(timeframe);
    }
  };
  
  // Format price with appropriate precision
  const formatPrice = (price: number) => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };
  
  return (
    <YStack space="$2">
      <YStack padding="$2">
        <Text fontSize={28} fontWeight="bold" color="$dexTextPrimary">
          ${formatPrice(selectedPrice || currentPrice)}
        </Text>
        
        <XStack alignItems="center" space="$2">
          <Text
            fontSize={16}
            fontWeight="medium"
            color={isPriceUp ? '$dexPositive' : '$dexNegative'}
          >
            {isPriceUp ? '+' : ''}{formatPrice(priceChange24h)}
          </Text>
          
          <Text
            fontSize={16}
            fontWeight="medium"
            color={isPriceUp ? '$dexPositive' : '$dexNegative'}
          >
            ({isPriceUp ? '+' : ''}{priceChangePercentage24h.toFixed(2)}%)
          </Text>
        </XStack>
      </YStack>
      
      <View style={styles.chartContainer}>
        <VictoryChart
          width={screenWidth}
          height={220}
          padding={{ top: 10, bottom: 30, left: 40, right: 20 }}
          containerComponent={
            <VictoryVoronoiContainer
              voronoiDimension="x"
              onActivated={(points) => {
                if (points && points[0]) {
                  setSelectedPrice(points[0].y);
                }
              }}
              onDeactivated={() => {
                setSelectedPrice(null);
              }}
            />
          }
        >
          <VictoryArea
            data={chartData}
            style={{
              data: {
                fill: `${chartColor}20`,
                stroke: chartColor,
                strokeWidth: 2,
              },
            }}
            animate={{
              duration: 500,
              onLoad: { duration: 500 },
            }}
          />
          
          <VictoryAxis
            dependentAxis
            style={{
              axis: { stroke: 'transparent' },
              grid: { stroke: '#2C2C2E', strokeDasharray: '4, 8' },
              tickLabels: { fill: '#8E8E93', fontSize: 12, padding: 5 },
            }}
          />
          
          <VictoryAxis
            style={{
              axis: { stroke: 'transparent' },
              grid: { stroke: 'transparent' },
              tickLabels: { fill: '#8E8E93', fontSize: 12, padding: 5 },
            }}
            tickFormat={(date) => {
              const d = new Date(date);
              switch (selectedTimeframe) {
                case '1H':
                  return format(d, 'HH:mm');
                case '1D':
                  return format(d, 'HH:mm');
                case '1W':
                  return format(d, 'EEE');
                case '1M':
                  return format(d, 'dd MMM');
                case 'ALL':
                  return format(d, 'MMM yyyy');
                default:
                  return format(d, 'HH:mm');
              }
            }}
            tickCount={5}
          />
        </VictoryChart>
      </View>
      
      <ChartTimeframe
        selectedTimeframe={selectedTimeframe}
        onTimeframeChange={handleTimeframeChange}
      />
    </YStack>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
  },
});
```

## CandlestickChart.tsx - Candlestick Chart Component

```typescript
import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { VictoryCandlestick, VictoryChart, VictoryAxis, VictoryBar, VictoryLabel } from 'victory-native';
import { format } from 'date-fns';
import { Text, YStack } from 'tamagui';
import { CandlestickDataPoint, TimeframeOption } from '../types/chart';
import { ChartTimeframe } from './ChartTimeframe';

interface CandlestickChartProps {
  data: CandlestickDataPoint[];
  symbol: string;
  onTimeframeChange?: (timeframe: TimeframeOption) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  symbol,
  onTimeframeChange,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>('1D');
  
  // Format data for the chart
  const chartData = useMemo(() => {
    return data.map((point) => ({
      x: new Date(point.timestamp),
      open: point.open,
      close: point.close,
      high: point.high,
      low: point.low,
    }));
  }, [data]);
  
  // Format volume data
  const volumeData = useMemo(() => {
    return data.map((point) => ({
      x: new Date(point.timestamp),
      y: point.volume,
      fill: point.close >= point.open ? '#34C759' : '#FF3B30',
    }));
  }, [data]);
  
  // Handle timeframe change
  const handleTimeframeChange = (timeframe: TimeframeOption) => {
    setSelectedTimeframe(timeframe);
    if (onTimeframeChange) {
      onTimeframeChange(timeframe);
    }
  };
  
  return (
    <YStack space="$2">
      <Text fontSize={18} fontWeight="bold" color="$dexTextPrimary">
        {symbol} Price Chart
      </Text>
      
      <View style={styles.chartContainer}>
        <VictoryChart
          width={screenWidth}
          height={300}
          padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
          domainPadding={{ x: 25 }}
        >
          <VictoryCandlestick
            data={chartData}
            candleColors={{ positive: '#34C759', negative: '#FF3B30' }}
            candleWidth={8}
            style={{
              data: {
                stroke: ({ datum }) => (datum.close >= datum.open ? '#34C759' : '#FF3B30'),
                strokeWidth: 1,
              },
            }}
            animate={{
              duration: 500,
              onLoad: { duration: 500 },
            }}
          />
          
          <VictoryAxis
            dependentAxis
            style={{
              axis: { stroke: 'transparent' },
              grid: { stroke: '#2C2C2E', strokeDasharray: '4, 8' },
              tickLabels: { fill: '#8E8E93', fontSize: 12, padding: 5 },
            }}
          />
          
          <VictoryAxis
            style={{
              axis: { stroke: 'transparent' },
              grid: { stroke: 'transparent' },
              tickLabels: { fill: '#8E8E93', fontSize: 12, padding: 5 },
            }}
            tickFormat={(date) => {
              const d = new Date(date);
              switch (selectedTimeframe) {
                case '1H':
                  return format(d, 'HH:mm');
                case '1D':
                  return format(d, 'HH:mm');
                case '1W':
                  return format(d, 'EEE');
                case '1M':
                  return format(d, 'dd MMM');
                case 'ALL':
                  return format(d, 'MMM yyyy');
                default:
                  return format(d, 'HH:mm');
              }
            }}
            tickCount={5}
          />
          
          {/* Volume bars at the bottom */}
          <VictoryBar
            data={volumeData}
            style={{
              data: {
                fill: ({ datum }) => datum.fill,
                opacity: 0.5,
              },
            }}
            barWidth={6}
            y0={() => 0}
            scale={{ y: 'linear' }}
          />
        </VictoryChart>
      </View>
      
      <ChartTimeframe
        selectedTimeframe={selectedTimeframe}
        onTimeframeChange={handleTimeframeChange}
      />
    </YStack>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
  },
});
```

## MiniChart.tsx - Small Chart for Token List Items

```typescript
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { VictoryLine } from 'victory-native';
import { PriceDataPoint } from '../types/chart';

interface MiniChartProps {
  data: PriceDataPoint[];
  width?: number;
  height?: number;
  isPriceUp?: boolean;
}

export const MiniChart: React.FC<MiniChartProps> = ({
  data,
  width = 80,
  height = 40,
  isPriceUp = true,
}) => {
  // Format data for the chart
  const chartData = useMemo(() => {
    return data.map((point) => ({
      x: point.timestamp,
      y: point.price,
    }));
  }, [data]);
  
  // Determine chart color based on price change
  const chartColor = isPriceUp ? '#34C759' : '#FF3B30';
  
  return (
    <View style={[styles.container, { width, height }]}>
      <VictoryLine
        data={chartData}
        style={{
          data: {
            stroke: chartColor,
            strokeWidth: 2,
          },
        }}
        padding={0}
        width={width}
        height={height}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
```

## ChartTimeframe.tsx - Timeframe Selector Component

```typescript
import React from 'react';
import { StyleSheet } from 'react-native';
import { XStack, Button, Text } from 'tamagui';
import { TimeframeOption } from '../types/chart';

interface ChartTimeframeProps {
  selectedTimeframe: TimeframeOption;
  onTimeframeChange: (timeframe: TimeframeOption) => void;
}

const timeframeOptions: TimeframeOption[] = ['1H', '1D', '1W', '1M', 'ALL'];

export const ChartTimeframe: React.FC<ChartTimeframeProps> = ({
  selectedTimeframe,
  onTimeframeChange,
}) => {
  return (
    <XStack justifyContent="space-between" padding="$2">
      {timeframeOptions.map((timeframe) => (
        <Button
          key={timeframe}
          variant={selectedTimeframe === timeframe ? 'primary' : 'ghost'}
          size="$3"
          onPress={() => onTimeframeChange(timeframe)}
          backgroundColor={selectedTimeframe === timeframe ? '$dexPrimary' : 'transparent'}
          borderRadius="$button"
          paddingHorizontal="$3"
        >
          <Text
            color={selectedTimeframe === timeframe ? 'white' : '$dexTextSecondary'}
            fontWeight={selectedTimeframe === timeframe ? 'bold' : 'normal'}
            fontSize={14}
          >
            {timeframe}
          </Text>
        </Button>
      ))}
    </XStack>
  );
};
```

## useTokenPrice.ts - Hook for Fetching Token Price Data

```typescript
import { useState, useEffect } from 'react';
import { TokenPriceData, TimeframeOption } from '../types/chart';

// Mock data generator for demo purposes
const generateMockPriceData = (
  symbol: string,
  basePrice: number,
  timeframe: TimeframeOption
): TokenPriceData => {
  const now = Date.now();
  const priceHistory: { timestamp: number; price: number }[] = [];
  const candlesticks: { timestamp: number; open: number; high: number; low: number; close: number; volume: number }[] = [];
  
  // Generate random price fluctuation
  const volatility = basePrice * 0.05; // 5% volatility
  
  // Determine time interval and number of points based on timeframe
  let interval: number;
  let points: number;
  
  switch (timeframe) {
    case '1H':
      interval = 60 * 1000; // 1 minute
      points = 60;
      break;
    case '1D':
      interval = 15 * 60 * 1000; // 15 minutes
      points = 96;
      break;
    case '1W':
      interval = 60 * 60 * 1000; // 1 hour
      points = 168;
      break;
    case '1M':
      interval = 6 * 60 * 60 * 1000; // 6 hours
      points = 120;
      break;
    case 'ALL':
      interval = 24 * 60 * 60 * 1000; // 1 day
      points = 90;
      break;
    default:
      interval = 15 * 60 * 1000;
      points = 96;
  }
  
  // Generate price history
  let currentPrice = basePrice;
  for (let i = points; i >= 0; i--) {
    const timestamp = now - i * interval;
    const randomChange = (Math.random() - 0.5) * volatility;
    currentPrice = Math.max(0.01, currentPrice + randomChange);
    priceHistory.push({ timestamp, price: currentPrice });
    
    // Generate candlestick data
    if (i > 0) {
      const open = currentPrice;
      const close = Math.max(0.01, open + (Math.random() - 0.5) * volatility);
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      const volume = Math.random() * basePrice * 1000;
      
      candlesticks.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume,
      });
    }
  }
  
  // Calculate 24h change
  const price24hAgo = priceHistory[Math.floor(priceHistory.length * 0.8)].price;
  const currentPriceValue = priceHistory[priceHistory.length - 1].price;
  const priceChange24h = currentPriceValue - price24hAgo;
  const priceChangePercentage24h = (priceChange24h / price24hAgo) * 100;
  
  return {
    symbol,
    name: getTokenName(symbol),
    currentPrice: currentPriceValue,
    priceChange24h,
    priceChangePercentage24h,
    marketCap: currentPriceValue * getTokenSupply(symbol),
    totalVolume: currentPriceValue * getTokenSupply(symbol) * 0.1,
    priceHistory,
    candlesticks,
  };
};

// Helper functions
const getTokenName = (symbol: string): string => {
  const names: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    SOL: 'Solana',
    USDT: 'Tether',
    USDC: 'USD Coin',
    BNB: 'Binance Coin',
    XRP: 'Ripple',
    ADA: 'Cardano',
    AVAX: 'Avalanche',
    DOGE: 'Dogecoin',
  };
  return names[symbol] || symbol;
};

const getTokenSupply = (symbol: string): number => {
  const supply: Record<string, number> = {
    BTC: 19_000_000,
    ETH: 120_000_000,
    SOL: 350_000_000,
    USDT: 83_000_000_000,
    USDC: 43_000_000_000,
    BNB: 166_000_000,
    XRP: 45_000_000_000,
    ADA: 35_000_000_000,
    AVAX: 320_000_000,
    DOGE: 132_000_000_000,
  };
  return supply[symbol] || 1_000_000;
};

// Hook for fetching token price data
export const useTokenPrice = (
  symbol: string,
  timeframe: TimeframeOption = '1D'
): {
  data: TokenPriceData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} => {
  const [data, setData] = useState<TokenPriceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, you would fetch data from an API
      // For demo purposes, we'll generate mock data
      const basePrice = getBasePrice(symbol);
      const mockData = generateMockPriceData(symbol, basePrice, timeframe);
      
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setData(mockData);
    } catch (err: any) {
      console.error('Error fetching token price:', err);
      setError(err.message || 'Failed to fetch token price');
    } finally {
      setLoading(false);
    }
  };
  
  // Get base price for token
  const getBasePrice = (symbol: string): number => {
    const prices: Record<string, number> = {
      BTC: 30000,
      ETH: 1800,
      SOL: 40,
      USDT: 1,
      USDC: 1,
      BNB: 220,
      XRP: 0.5,
      ADA: 0.3,
      AVAX: 10,
      DOGE: 0.07,
    };
    return prices[symbol] || 1;
  };
  
  // Fetch data on mount and when timeframe changes
  useEffect(() => {
    fetchData();
  }, [symbol, timeframe]);
  
  return { data, loading, error, refetch: fetchData };
};
```

## index.ts - Export Chart Components

```typescript
export * from './PriceChart';
export * from './CandlestickChart';
export * from './MiniChart';
export * from './ChartTimeframe';
```

## Usage Example - Token Detail Screen

```typescript
import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { YStack, Text, Spinner } from 'tamagui';
import { PriceChart, CandlestickChart } from '../components/charts';
import { useTokenPrice } from '../hooks/useTokenPrice';
import { TimeframeOption } from '../types/chart';

interface TokenDetailScreenProps {
  route: { params: { symbol: string } };
}

const TokenDetailScreen: React.FC<TokenDetailScreenProps> = ({ route }) => {
  const { symbol } = route.params;
  const [timeframe, setTimeframe] = useState<TimeframeOption>('1D');
  const { data, loading, error } = useTokenPrice(symbol, timeframe);
  
  const handleTimeframeChange = (newTimeframe: TimeframeOption) => {
    setTimeframe(newTimeframe);
  };
  
  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$dexBackground">
        <Spinner size="large" color="$dexPrimary" />
        <Text color="$dexTextSecondary" marginTop="$4">
          Loading {symbol} data...
        </Text>
      </YStack>
    );
  }
  
  if (error || !data) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$dexBackground" padding="$4">
        <Text color="$dexNegative" fontSize={16} textAlign="center">
          {error || `Failed to load ${symbol} data`}
        </Text>
      </YStack>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <YStack padding="$4" space="$6">
        <YStack>
          <Text fontSize={32} fontWeight="bold" color="$dexTextPrimary">
            {data.name} ({data.symbol})
          </Text>
        </YStack>
        
        <PriceChart
          data={data.priceHistory}
          symbol={data.symbol}
          currentPrice={data.currentPrice}
          priceChange24h={data.priceChange24h}
          priceChangePercentage24h={data.priceChangePercentage24h}
          onTimeframeChange={handleTimeframeChange}
        />
        
        <YStack space="$4" backgroundColor="$dexSecondary" padding="$4" borderRadius="$card">
          <Text fontSize={18} fontWeight="bold" color="$dexTextPrimary">
            Market Stats
          </Text>
          
          <YStack space="$2">
            <YStack flexDirection="row" justifyContent="space-between">
              <Text color="$dexTextSecondary">Market Cap</Text>
              <Text color="$dexTextPrimary" fontWeight="medium">
                ${data.marketCap.toLocaleString()}
              </Text>
            </YStack>
            
            <YStack flexDirection="row" justifyContent="space-between">
              <Text color="$dexTextSecondary">24h Volume</Text>
              <Text color="$dexTextPrimary" fontWeight="medium">
                ${data.totalVolume.toLocaleString()}
              </Text>
            </YStack>
          </YStack>
        </YStack>
        
        {data.candlesticks && (
          <CandlestickChart
            data={data.candlesticks}
            symbol={data.symbol}
            onTimeframeChange={handleTimeframeChange}
          />
        )}
      </YStack>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});

export default TokenDetailScreen;
```
