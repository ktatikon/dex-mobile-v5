
import React, { useState } from 'react';
import { Token } from '@/types';

interface TokenIconProps {
  token: Token;
  size?: 'sm' | 'md' | 'lg';
}

const TokenIcon: React.FC<TokenIconProps> = ({ token, size = 'md' }) => {
  const [imageError, setImageError] = useState(false);

  const sizeClass = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14'
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`relative ${sizeClass[size]} rounded-full bg-white/10 overflow-hidden flex items-center justify-center shadow-md border border-white/5`}>
      {!imageError && token.logo ? (
        <img
          src={token.logo}
          alt={`${token.symbol} logo`}
          className={`${sizeClass[size]} object-contain p-0.5`}
          onError={handleImageError}
        />
      ) : (
        <div className="text-white text-sm font-bold bg-gradient-to-br from-dex-primary/80 to-dex-primary/50 w-full h-full flex items-center justify-center">
          {token.symbol.substring(0, 2)}
        </div>
      )}
    </div>
  );
};

export default TokenIcon;
