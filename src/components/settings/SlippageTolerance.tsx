/**
 * Slippage Tolerance Configuration Component
 * 
 * Provides comprehensive slippage tolerance settings with:
 * - Preset options (0.1%, 0.5%, 1.0%, 3.0%)
 * - Custom input with validation
 * - Real-time preview
 * - Warning messages for high values
 * - Reset to default functionality
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Info, 
  RotateCcw,
  TrendingDown,
  Calculator
} from 'lucide-react';
import { 
  SLIPPAGE_TOLERANCE_PRESETS, 
  validateSlippageTolerance,
  DEFAULT_WALLET_SETTINGS 
} from '@/services/walletSettingsService';

interface SlippageToleranceProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

const SlippageTolerance: React.FC<SlippageToleranceProps> = ({
  value,
  onChange,
  disabled = false,
  className = ''
}) => {
  const [customValue, setCustomValue] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; error?: string }>({ isValid: true });

  // Initialize custom value when switching to custom mode
  useEffect(() => {
    if (isCustomMode && !customValue) {
      setCustomValue(value.toString());
    }
  }, [isCustomMode, value, customValue]);

  // Validate custom input
  useEffect(() => {
    if (isCustomMode && customValue) {
      const numValue = parseFloat(customValue);
      const result = validateSlippageTolerance(numValue);
      setValidationResult(result);
    }
  }, [customValue, isCustomMode]);

  const handlePresetClick = (presetValue: number) => {
    setIsCustomMode(false);
    setCustomValue('');
    onChange(presetValue);
  };

  const handleCustomSubmit = () => {
    if (customValue && validationResult.isValid) {
      const numValue = parseFloat(customValue);
      onChange(numValue);
    }
  };

  const handleReset = () => {
    setIsCustomMode(false);
    setCustomValue('');
    onChange(DEFAULT_WALLET_SETTINGS.slippage_tolerance);
  };

  const formatPercentage = (val: number) => `${val}%`;

  const calculateImpact = (slippage: number, amount: number = 1000) => {
    const impact = (amount * slippage) / 100;
    return impact;
  };

  const getSlippageLevel = (slippage: number): { level: string; color: string; icon: React.ReactNode } => {
    if (slippage <= 0.5) {
      return { 
        level: 'Low', 
        color: 'text-dex-positive', 
        icon: <TrendingDown className="w-3 h-3" /> 
      };
    } else if (slippage <= 2) {
      return { 
        level: 'Medium', 
        color: 'text-yellow-400', 
        icon: <Info className="w-3 h-3" /> 
      };
    } else if (slippage <= 5) {
      return { 
        level: 'High', 
        color: 'text-orange-400', 
        icon: <AlertTriangle className="w-3 h-3" /> 
      };
    } else {
      return { 
        level: 'Very High', 
        color: 'text-dex-negative', 
        icon: <AlertTriangle className="w-3 h-3" /> 
      };
    }
  };

  const slippageInfo = getSlippageLevel(value);

  return (
    <Card className={`bg-dex-dark/80 border-dex-secondary/30 ${className}`}>
      <CardHeader>
        <CardTitle className="text-dex-text-primary flex items-center gap-2">
          <Calculator className="text-dex-primary" size={20} />
          Slippage Tolerance
          <Badge 
            variant="outline" 
            className={`text-xs ${slippageInfo.color} border-current`}
          >
            {slippageInfo.icon}
            <span className="ml-1">{slippageInfo.level}</span>
          </Badge>
        </CardTitle>
        <p className="text-sm text-dex-text-secondary">
          Set the maximum price movement you're willing to accept during trades
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Setting Display */}
        <div className="flex items-center justify-between p-3 bg-dex-dark/50 rounded-lg border border-dex-primary/20">
          <div>
            <Label className="text-dex-text-primary font-medium">Current Setting</Label>
            <p className="text-sm text-dex-text-secondary">Active slippage tolerance</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-dex-text-primary">
              {formatPercentage(value)}
            </div>
            <div className={`text-xs ${slippageInfo.color}`}>
              {slippageInfo.level} Risk
            </div>
          </div>
        </div>

        {/* Preset Options */}
        <div className="space-y-3">
          <Label className="text-dex-text-primary font-medium">Preset Options</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SLIPPAGE_TOLERANCE_PRESETS.map((preset) => (
              <Button
                key={preset.value}
                variant={value === preset.value && !isCustomMode ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetClick(preset.value)}
                disabled={disabled}
                className={`
                  ${value === preset.value && !isCustomMode 
                    ? 'bg-dex-primary text-white border-dex-primary' 
                    : 'bg-dex-dark/50 text-dex-text-secondary border-dex-secondary/30 hover:bg-dex-secondary/20'
                  }
                `}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        <Separator className="bg-dex-secondary/20" />

        {/* Custom Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-dex-text-primary font-medium">Custom Value</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCustomMode(!isCustomMode)}
              disabled={disabled}
              className="text-dex-text-secondary hover:text-dex-text-primary"
            >
              {isCustomMode ? 'Cancel' : 'Custom'}
            </Button>
          </div>

          {isCustomMode && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="50"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="Enter percentage (0.01 - 50)"
                    disabled={disabled}
                    className={`
                      bg-dex-dark/50 border-dex-secondary/30 text-dex-text-primary
                      ${!validationResult.isValid ? 'border-dex-negative' : ''}
                    `}
                  />
                </div>
                <Button
                  onClick={handleCustomSubmit}
                  disabled={disabled || !validationResult.isValid || !customValue}
                  className="bg-dex-primary hover:bg-dex-primary/80"
                >
                  Apply
                </Button>
              </div>

              {validationResult.error && (
                <div className={`flex items-center gap-2 text-sm ${
                  validationResult.isValid ? 'text-orange-400' : 'text-dex-negative'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                  {validationResult.error}
                </div>
              )}
            </div>
          )}
        </div>

        <Separator className="bg-dex-secondary/20" />

        {/* Impact Preview */}
        <div className="space-y-3">
          <Label className="text-dex-text-primary font-medium">Impact Preview</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-dex-dark/50 rounded-lg border border-dex-secondary/20">
              <div className="text-sm text-dex-text-secondary mb-1">On $1,000 trade</div>
              <div className="text-lg font-semibold text-dex-text-primary">
                ±${calculateImpact(value, 1000).toFixed(2)}
              </div>
            </div>
            <div className="p-3 bg-dex-dark/50 rounded-lg border border-dex-secondary/20">
              <div className="text-sm text-dex-text-secondary mb-1">On $10,000 trade</div>
              <div className="text-lg font-semibold text-dex-text-primary">
                ±${calculateImpact(value, 10000).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Reset Option */}
        <div className="flex justify-between items-center pt-2">
          <div className="text-sm text-dex-text-secondary">
            Default: {formatPercentage(DEFAULT_WALLET_SETTINGS.slippage_tolerance)}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={disabled || value === DEFAULT_WALLET_SETTINGS.slippage_tolerance}
            className="text-dex-text-secondary hover:text-dex-text-primary"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>
        </div>

        {/* Information Box */}
        <div className="p-3 bg-dex-primary/10 border border-dex-primary/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-dex-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-dex-text-secondary">
              <strong className="text-dex-text-primary">What is slippage tolerance?</strong>
              <br />
              The maximum price difference you'll accept between when you submit a transaction and when it's executed. 
              Higher values reduce failed transactions but may result in worse prices.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SlippageTolerance;
