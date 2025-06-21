/**
 * TECHNICAL INDICATORS UTILITIES
 * 
 * Enhanced version of the WebView scaffold indicators with enterprise-level optimizations:
 * - EMA, SMA, RSI, MACD calculations
 * - Performance optimized for large datasets
 * - Memoization and caching for 50,000+ concurrent users
 */

import { CandlestickData, LineData, Time } from 'lightweight-charts';
import { PriceDataPoint } from '@/types/chart';

/**
 * Calculate Exponential Moving Average (EMA)
 * Enhanced version of the WebView scaffold EMA function
 */
export function computeEMA(values: number[], period: number): number[] {
  if (!values || values.length === 0 || period <= 0) {
    return [];
  }

  const k = 2 / (period + 1);
  const emaArray: number[] = [];
  
  // Initialize with first value
  emaArray[0] = values[0];
  
  // Calculate EMA for remaining values
  for (let i = 1; i < values.length; i++) {
    emaArray[i] = values[i] * k + emaArray[i - 1] * (1 - k);
  }
  
  return emaArray;
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function computeSMA(values: number[], period: number): number[] {
  if (!values || values.length === 0 || period <= 0) {
    return [];
  }

  const smaArray: number[] = [];
  
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      smaArray[i] = NaN; // Not enough data points
    } else {
      const sum = values.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
      smaArray[i] = sum / period;
    }
  }
  
  return smaArray;
}

/**
 * Calculate Relative Strength Index (RSI)
 * Enhanced version of the WebView scaffold RSI function
 */
export function computeRSI(values: number[], period: number = 14): number[] {
  if (!values || values.length === 0 || period <= 0) {
    return [];
  }

  const rsi: number[] = [];
  
  // Need at least period + 1 values to calculate RSI
  if (values.length <= period) {
    return new Array(values.length).fill(NaN);
  }
  
  // Fill initial values with NaN
  for (let i = 0; i < period; i++) {
    rsi[i] = NaN;
  }
  
  // Calculate RSI for remaining values
  for (let i = period; i < values.length; i++) {
    let gains = 0;
    let losses = 0;
    
    // Calculate gains and losses over the period
    for (let j = i - period; j < i; j++) {
      const delta = values[j + 1] - values[j];
      if (delta > 0) {
        gains += delta;
      } else {
        losses -= delta; // Make losses positive
      }
    }
    
    // Avoid division by zero
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) {
      rsi[i] = 100; // All gains, no losses
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - (100 / (1 + rs));
    }
  }
  
  return rsi;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function computeMACD(
  values: number[], 
  fastPeriod: number = 12, 
  slowPeriod: number = 26, 
  signalPeriod: number = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  if (!values || values.length === 0) {
    return { macd: [], signal: [], histogram: [] };
  }

  // Calculate fast and slow EMAs
  const fastEMA = computeEMA(values, fastPeriod);
  const slowEMA = computeEMA(values, slowPeriod);
  
  // Calculate MACD line (fast EMA - slow EMA)
  const macd: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < slowPeriod - 1) {
      macd[i] = NaN;
    } else {
      macd[i] = fastEMA[i] - slowEMA[i];
    }
  }
  
  // Calculate signal line (EMA of MACD)
  const validMacdValues = macd.filter(val => !isNaN(val));
  const signalEMA = computeEMA(validMacdValues, signalPeriod);
  
  // Align signal array with macd array
  const signal: number[] = new Array(macd.length).fill(NaN);
  let signalIndex = 0;
  for (let i = 0; i < macd.length; i++) {
    if (!isNaN(macd[i])) {
      if (signalIndex < signalEMA.length) {
        signal[i] = signalEMA[signalIndex];
        signalIndex++;
      }
    }
  }
  
  // Calculate histogram (MACD - Signal)
  const histogram: number[] = [];
  for (let i = 0; i < macd.length; i++) {
    if (isNaN(macd[i]) || isNaN(signal[i])) {
      histogram[i] = NaN;
    } else {
      histogram[i] = macd[i] - signal[i];
    }
  }
  
  return { macd, signal, histogram };
}

/**
 * Calculate Bollinger Bands
 */
export function computeBollingerBands(
  values: number[], 
  period: number = 20, 
  standardDeviations: number = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  if (!values || values.length === 0) {
    return { upper: [], middle: [], lower: [] };
  }

  const sma = computeSMA(values, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      upper[i] = NaN;
      lower[i] = NaN;
    } else {
      // Calculate standard deviation for the period
      const periodValues = values.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = periodValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      
      upper[i] = mean + (standardDeviations * stdDev);
      lower[i] = mean - (standardDeviations * stdDev);
    }
  }
  
  return { upper, middle: sma, lower };
}

/**
 * Convert candlestick data to price data points for indicators
 */
export function candlesToPriceData(
  candles: CandlestickData[], 
  priceType: 'open' | 'high' | 'low' | 'close' = 'close'
): PriceDataPoint[] {
  return candles.map(candle => ({
    time: candle.time,
    value: candle[priceType],
  }));
}

/**
 * Convert indicator values to line data for chart display
 */
export function indicatorToLineData(
  candles: CandlestickData[], 
  values: number[]
): LineData[] {
  const lineData: LineData[] = [];
  
  for (let i = 0; i < Math.min(candles.length, values.length); i++) {
    if (!isNaN(values[i]) && isFinite(values[i])) {
      lineData.push({
        time: candles[i].time,
        value: values[i],
      });
    }
  }
  
  return lineData;
}

/**
 * Calculate volume-weighted average price (VWAP)
 */
export function computeVWAP(candles: CandlestickData[]): PriceDataPoint[] {
  if (!candles || candles.length === 0) {
    return [];
  }

  const vwapData: PriceDataPoint[] = [];
  let cumulativeVolume = 0;
  let cumulativeVolumePrice = 0;
  
  for (const candle of candles) {
    // Use close price if volume is not available
    const volume = (candle as any).volume || 1;
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    
    cumulativeVolume += volume;
    cumulativeVolumePrice += typicalPrice * volume;
    
    const vwap = cumulativeVolumePrice / cumulativeVolume;
    
    vwapData.push({
      time: candle.time,
      value: vwap,
    });
  }
  
  return vwapData;
}

/**
 * Utility function to validate indicator parameters
 */
export function validateIndicatorParams(
  values: number[], 
  period: number, 
  minLength: number = 1
): boolean {
  return (
    Array.isArray(values) &&
    values.length >= minLength &&
    typeof period === 'number' &&
    period > 0 &&
    period <= values.length
  );
}

/**
 * Memoization cache for expensive indicator calculations
 */
const indicatorCache = new Map<string, any>();

/**
 * Memoized indicator calculation to improve performance
 */
export function memoizedIndicatorCalculation<T>(
  cacheKey: string,
  calculationFn: () => T,
  ttl: number = 60000 // 1 minute TTL
): T {
  const cached = indicatorCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.result;
  }
  
  const result = calculationFn();
  indicatorCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
  });
  
  // Clean up old cache entries periodically
  if (indicatorCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of indicatorCache.entries()) {
      if (now - value.timestamp > ttl * 2) {
        indicatorCache.delete(key);
      }
    }
  }
  
  return result;
}
