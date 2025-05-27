
import React from 'react';
import { Token } from '@/types';
import TokenIcon from './TokenIcon';
import TokenPrice from './TokenPrice';

interface TokenListItemProps {
  token: Token;
  onSelect?: () => void;
  showBalance?: boolean;
}

const TokenListItem: React.FC<TokenListItemProps> = ({
  token,
  onSelect,
  showBalance = true
}) => {
  // Calculate USD value
  const usdValue = parseFloat(token.balance || '0') * (token.price || 0);

  return (
    <div
      className="flex items-center justify-between p-4 active:bg-dex-secondary/10 hover:bg-dex-secondary/5 rounded-lg cursor-pointer transition-all duration-200 border-b border-dex-secondary/10 last:border-b-0"
      onClick={onSelect}
    >
      <div className="flex items-center gap-4">
        <TokenIcon token={token} />

        <div>
          <div className="font-medium text-white text-base">{token.symbol}</div>
          <div className="text-sm text-gray-400">{token.name}</div>
        </div>
      </div>

      <div className="text-right">
        {showBalance && (
          <>
            <div className="font-medium text-white text-base">
              {parseFloat(token.balance || '0').toFixed(
                token.decimals > 6 ? 4 : 2
              )}
            </div>
            <div className="text-sm text-dex-primary">
              ${usdValue.toFixed(2)}
            </div>
          </>
        )}

        {!showBalance && token.price && (
          <TokenPrice
            price={token.price}
            priceChange={token.priceChange24h}
            size="sm"
          />
        )}
      </div>
    </div>
  );
};

export default TokenListItem;
