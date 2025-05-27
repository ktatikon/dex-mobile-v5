
import React from 'react';

interface TokenPriceProps {
  price: number;
  priceChange?: number;
  size?: 'sm' | 'md' | 'lg';
  showChange?: boolean;
}

const TokenPrice: React.FC<TokenPriceProps> = ({ 
  price, 
  priceChange = 0, 
  size = 'md',
  showChange = true
}) => {
  const isPositive = priceChange >= 0;
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: price < 1 ? 6 : 2
  }).format(price);

  return (
    <div className="flex flex-col">
      <span className={`font-medium ${sizeClasses[size]}`}>
        {formattedPrice}
      </span>
      
      {showChange && (
        <span className={`${sizeClasses[size]} ${isPositive ? 'text-dex-success' : 'text-dex-error'}`}>
          {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
        </span>
      )}
    </div>
  );
};

export default TokenPrice;
