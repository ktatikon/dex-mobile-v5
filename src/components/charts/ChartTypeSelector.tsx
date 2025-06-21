/**
 * CHART TYPE SELECTOR COMPONENT
 * 
 * Provides chart type selection (candlestick, line, area) for TradingChart
 */

import React, { memo } from 'react';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

export type ChartType = 'candlestick' | 'line' | 'area';

interface ChartTypeSelectorProps {
  selectedType: ChartType;
  onTypeChange: (type: ChartType) => void;
  className?: string;
}

const chartTypes = [
  {
    type: 'candlestick' as ChartType,
    label: 'Candlestick',
    icon: BarChart3,
    description: 'OHLC candlestick chart'
  },
  {
    type: 'line' as ChartType,
    label: 'Line',
    icon: TrendingUp,
    description: 'Simple line chart'
  },
  {
    type: 'area' as ChartType,
    label: 'Area',
    icon: Activity,
    description: 'Filled area chart'
  }
];

export const ChartTypeSelector = memo<ChartTypeSelectorProps>(({
  selectedType,
  onTypeChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {chartTypes.map(({ type, label, icon: Icon, description }) => (
        <button
          key={type}
          onClick={() => onTypeChange(type)}
          className={`
            flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${selectedType === type
              ? 'bg-[#B1420A] text-white shadow-lg'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
            }
          `}
          title={description}
          style={{ fontFamily: 'Poppins' }}
        >
          <Icon size={16} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
});

ChartTypeSelector.displayName = 'ChartTypeSelector';

export default ChartTypeSelector;
