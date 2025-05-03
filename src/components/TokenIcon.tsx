
import React, { useState } from 'react';
import { Token } from '@/types';

interface TokenIconProps {
  token: Token;
  size?: 'sm' | 'md' | 'lg';
}

const TokenIcon: React.FC<TokenIconProps> = ({ token, size = 'md' }) => {
  const [imageError, setImageError] = useState(false);

  const sizeClass = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const fallbackIcon = `https://via.placeholder.com/32/8B5CF6/FFFFFF?text=${token.symbol.substring(0, 2)}`;

  return (
    <div className={`relative ${sizeClass[size]} rounded-full bg-white/10 overflow-hidden flex items-center justify-center`}>
      {!imageError && token.logo ? (
        <img 
          src={token.logo} 
          alt={`${token.symbol} logo`} 
          className={`${sizeClass[size]} object-contain`}
          onError={handleImageError}
        />
      ) : (
        <div className="text-white text-xs font-bold">
          {token.symbol.substring(0, 2)}
        </div>
      )}
    </div>
  );
};

export default TokenIcon;
