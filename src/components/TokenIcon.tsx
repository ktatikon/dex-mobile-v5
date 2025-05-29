
import React, { useState, useCallback } from 'react';
import { Token } from '@/types';

interface TokenIconProps {
  token: Token;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const TokenIcon: React.FC<TokenIconProps> = ({ token, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const [fallbackAttempts, setFallbackAttempts] = useState(0);

  // Enhanced size classes for trade page requirements
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  // Generate fallback icon sources with priority order
  const getIconSources = useCallback((symbol: string): string[] => {
    const lowerSymbol = symbol.toLowerCase();
    return [
      // 1. Original token logo (if provided)
      token.logo,
      // 2. Local crypto-icons directory
      `/crypto-icons/${lowerSymbol}.svg`,
      // 3. Common alternative names
      `/crypto-icons/${getAlternativeSymbol(lowerSymbol)}.svg`,
      // 4. CoinGecko fallback (if original was from CoinGecko)
      token.logo?.includes('coingecko') ? token.logo : null,
    ].filter(Boolean) as string[];
  }, [token.logo]);

  // Get alternative symbol names for common tokens
  const getAlternativeSymbol = (symbol: string): string => {
    const alternatives: Record<string, string> = {
      'wbtc': 'btc',
      'weth': 'eth',
      'usdc.e': 'usdc',
      'dai': 'usdc', // Use USDC icon as fallback for DAI
      'busd': 'usdt', // Use USDT icon as fallback for BUSD
      'matic': 'polygon',
      'avax': 'avalanche',
      'ftm': 'fantom',
      'atom': 'cosmos',
      'dot': 'polkadot',
      'link': 'chainlink',
      'uni': 'uniswap',
      'cake': 'pancakeswap',
      'sushi': 'sushiswap'
    };
    return alternatives[symbol] || symbol;
  };

  // Handle image loading errors with fallback attempts
  const handleImageError = useCallback(() => {
    const sources = getIconSources(token.symbol);
    if (fallbackAttempts < sources.length - 1) {
      setFallbackAttempts(prev => prev + 1);
    } else {
      setImageError(true);
    }
  }, [fallbackAttempts, getIconSources, token.symbol]);

  // Get current image source based on fallback attempts
  const getCurrentImageSource = (): string | null => {
    const sources = getIconSources(token.symbol);
    return sources[fallbackAttempts] || null;
  };

  // Generate gradient colors based on token symbol for consistent fallback appearance
  const getGradientColors = (symbol: string): string => {
    const colors = [
      'from-red-500 to-red-600',
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-yellow-500 to-yellow-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-orange-500 to-orange-600'
    ];

    // Use symbol hash to consistently assign colors
    const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const currentImageSource = getCurrentImageSource();
  const gradientColors = getGradientColors(token.symbol);

  return (
    <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center shadow-sm border border-white/10 ${className}`}>
      {!imageError && currentImageSource ? (
        <img
          src={currentImageSource}
          alt={`${token.symbol} logo`}
          className={`${sizeClasses[size]} object-contain p-0.5 bg-white/5 rounded-full`}
          onError={handleImageError}
          loading="lazy"
        />
      ) : (
        <div className={`bg-gradient-to-br ${gradientColors} w-full h-full flex items-center justify-center text-white font-bold`}>
          {token.symbol.substring(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default TokenIcon;
