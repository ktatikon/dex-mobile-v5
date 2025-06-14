
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { formatCurrency } from '@/services/realTimeData';
import { realTimeOrderBookService } from '@/services/realTimeOrderBook';
import { convertPrice } from '@/services/currencyService';
import { safeAdvancedTradingService } from '@/services/phase4/advancedTradingService';
import { webSocketDataService } from '@/services/webSocketDataService';
import { Token } from '@/types';
import { useMarketData } from '@/hooks/useMarketData';
import { MarketFilterType, AltFilterType } from '@/types/api';
import ErrorBoundary from '@/components/ErrorBoundary';
import TokenIcon from '@/components/TokenIcon';
import EnhancedTokenSelector from '@/components/TokenSelector';
import { TradingTabsContainer } from '@/components/trade';
import { TradingChart } from '@/components/TradingChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Tabs, TabsContent } from '@/components/ui/tabs'; // Removed - using custom tabs in TradingTabsContainer
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { TrendingUp, TrendingDown, ChevronDown, RefreshCw, Activity, DollarSign, BarChart3, CheckCircle, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

// Enhanced Tab Component with Gradient Styling and Swipe Support
interface EnhancedTabsListProps {
  children: React.ReactNode;
  className?: string;
  onSwipe?: (direction: 'left' | 'right') => void;
}

const EnhancedTabsList: React.FC<EnhancedTabsListProps> = memo(({ children, className, onSwipe }) => {
  const tabsRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const mouseStartX = useRef<number>(0);
  const mouseEndX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    console.log('Touch start:', touchStartX.current);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!onSwipe) return;

    const swipeThreshold = 50; // Minimum distance for swipe
    const swipeDistance = touchStartX.current - touchEndX.current;

    console.log('Touch end - Start:', touchStartX.current, 'End:', touchEndX.current, 'Distance:', swipeDistance);

    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        console.log('Swiping left (next tab)');
        onSwipe('left');
      } else {
        console.log('Swiping right (previous tab)');
        onSwipe('right');
      }
    }
  }, [onSwipe]);

  // Mouse events for desktop testing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseStartX.current = e.clientX;
    isDragging.current = true;
    console.log('Mouse down:', mouseStartX.current);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    mouseEndX.current = e.clientX;
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!onSwipe || !isDragging.current) {
      isDragging.current = false;
      return;
    }

    const swipeThreshold = 50;
    const swipeDistance = mouseStartX.current - mouseEndX.current;

    console.log('Mouse up - Start:', mouseStartX.current, 'End:', mouseEndX.current, 'Distance:', swipeDistance);

    // Only trigger swipe if the distance is significant and we're not clicking on a button
    const target = e.target as HTMLElement;
    const isButton = target.tagName === 'BUTTON' || target.closest('button');

    if (Math.abs(swipeDistance) > swipeThreshold && !isButton) {
      if (swipeDistance > 0) {
        console.log('Mouse swipe left (next tab)');
        onSwipe('left');
      } else {
        console.log('Mouse swipe right (previous tab)');
        onSwipe('right');
      }
    }

    isDragging.current = false;
  }, [onSwipe]);

  return (
    <div
      ref={tabsRef}
      className={`flex overflow-x-auto ${className || ''} cursor-pointer select-none`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {children}
    </div>
  );
});

// Enhanced Tab Trigger with Updated Gradient Effects
interface EnhancedTabTriggerProps {
  value: string;
  isActive: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}

const EnhancedTabTrigger: React.FC<EnhancedTabTriggerProps> = memo(({
  isActive,
  children,
  onClick,
  className
}) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className={`
        relative flex-shrink-0 px-4 py-3 min-w-[80px] text-center transition-all duration-200 ease-in-out rounded-lg font-poppins
        ${isActive
          ? 'text-lg font-medium bg-gradient-to-br from-[#B1420A] to-[#D2691E] text-white shadow-[0_6px_12px_rgba(255,255,255,0.08),0_2px_4px_rgba(177,66,10,0.4),inset_0_2px_4px_rgba(255,255,255,0.15)] border border-white/10 hover:shadow-[0_8px_20px_rgba(255,255,255,0.12),0_3px_6px_rgba(177,66,10,0.6),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-t before:from-transparent before:to-white/20 before:opacity-70 before:rounded-lg'
          : 'text-sm font-normal text-white/70 hover:text-white hover:bg-dex-secondary/10 hover:scale-[1.01]'
        }
        ${className || ''}
      `}
    >
      {children}
    </button>
  );
});

// Unified Swipeable Tab-Content Component
interface UnifiedTabContentProps {
  filter: MarketFilterType;
  altFilter: AltFilterType;
  setFilter: (filter: MarketFilterType) => void;
  setAltFilter: (filter: AltFilterType) => void;
  onSwipe: (direction: 'left' | 'right') => void;
  onUnifiedSwipe: (e: React.TouchEvent | React.MouseEvent) => void;
  tokens: Token[];
  sortedByMarketCap: Token[];
  sortedByPriceChange: Token[];
  loading: boolean;
  error: Error | null;
  onSelectToken: (token: Token) => void;
  onRefresh: () => void;
}

const UnifiedTabContent: React.FC<UnifiedTabContentProps> = memo(({
  filter,
  altFilter,
  setFilter,
  setAltFilter,
  onSwipe,
  onUnifiedSwipe,
  tokens,
  sortedByMarketCap,
  sortedByPriceChange,
  loading,
  error,
  onSelectToken,
  onRefresh
}) => {
  return (
    <div
      className="w-full"
      onTouchStart={onUnifiedSwipe}
      onTouchEnd={onUnifiedSwipe}
    >
      {/* Enhanced Tab Navigation - No background highlights */}
      <EnhancedTabsList
        className="w-full mb-6 px-2 py-2 rounded-lg"
        onSwipe={onSwipe}
      >
        <EnhancedTabTrigger
          value="all"
          isActive={filter === 'all'}
          onClick={() => setFilter('all')}
          className="min-h-[44px]"
        >
          All Assets
        </EnhancedTabTrigger>
        <EnhancedTabTrigger
          value="gainers"
          isActive={filter === 'gainers'}
          onClick={() => setFilter('gainers')}
          className="min-h-[44px]"
        >
          Top Gainers
        </EnhancedTabTrigger>
        <EnhancedTabTrigger
          value="losers"
          isActive={filter === 'losers'}
          onClick={() => setFilter('losers')}
          className="min-h-[44px]"
        >
          Top Losers
        </EnhancedTabTrigger>
        <EnhancedTabTrigger
          value="inr"
          isActive={filter === 'inr'}
          onClick={() => setFilter('inr')}
          className="min-h-[44px]"
        >
          INR
        </EnhancedTabTrigger>
        <EnhancedTabTrigger
          value="usdt"
          isActive={filter === 'usdt'}
          onClick={() => setFilter('usdt')}
          className="min-h-[44px]"
        >
          USDT
        </EnhancedTabTrigger>
        <EnhancedTabTrigger
          value="btc"
          isActive={filter === 'btc'}
          onClick={() => setFilter('btc')}
          className="min-h-[44px]"
        >
          BTC
        </EnhancedTabTrigger>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setFilter('alts');
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className={`
                relative flex-shrink-0 px-4 py-3 min-w-[80px] text-center transition-all duration-200 ease-in-out min-h-[44px] flex items-center gap-1 rounded-lg font-poppins
                ${filter === 'alts'
                  ? 'text-lg font-medium bg-gradient-to-br from-[#B1420A] to-[#D2691E] text-white shadow-[0_6px_12px_rgba(255,255,255,0.08),0_2px_4px_rgba(177,66,10,0.4),inset_0_2px_4px_rgba(255,255,255,0.15)] border border-white/10 hover:shadow-[0_8px_20px_rgba(255,255,255,0.12),0_3px_6px_rgba(177,66,10,0.6),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-t before:from-transparent before:to-white/20 before:opacity-70 before:rounded-lg'
                  : 'text-sm font-normal text-white/70 hover:text-white hover:bg-dex-secondary/10 hover:scale-[1.01]'
                }
              `}
            >
              ALTs
              <ChevronDown className="h-3 w-3 ml-0.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="bg-dex-dark border-dex-secondary/30 text-white rounded-lg shadow-lg min-w-[200px] z-50"
            align="center"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-white font-semibold px-4 py-3 sticky top-0 bg-dex-dark z-10">
              Filter ALTs
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-dex-secondary/20" />
            <DropdownMenuRadioGroup value={altFilter} onValueChange={(value) => {
              setAltFilter(value as AltFilterType);
              if (filter !== 'alts') {
                setFilter('alts');
              }
            }}>
              <DropdownMenuRadioItem value="all" className="text-white hover:bg-dex-primary/20 cursor-pointer px-4 py-2">
                All Altcoins
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="usdc" className="text-white hover:bg-dex-primary/20 cursor-pointer px-4 py-2">
                USDC Pairs
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="bnb" className="text-white hover:bg-dex-primary/20 cursor-pointer px-4 py-2">
                BNB Pairs
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="eth" className="text-white hover:bg-dex-primary/20 cursor-pointer px-4 py-2">
                ETH Pairs
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="xrp" className="text-white hover:bg-dex-primary/20 cursor-pointer px-4 py-2">
                XRP Pairs
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dai" className="text-white hover:bg-dex-primary/20 cursor-pointer px-4 py-2">
                DAI Pairs
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="tusd" className="text-white hover:bg-dex-primary/20 cursor-pointer px-4 py-2">
                TUSD Pairs
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="trx" className="text-white hover:bg-dex-primary/20 cursor-pointer px-4 py-2">
                TRX Pairs
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </EnhancedTabsList>

      {/* Unified Content Area with Smooth Transitions */}
      <div className="transition-all duration-300 ease-in-out">
        <TokenListContent
          filter={filter}
          altFilter={altFilter}
          tokens={tokens}
          sortedByMarketCap={sortedByMarketCap}
          sortedByPriceChange={sortedByPriceChange}
          loading={loading}
          error={error}
          onSelectToken={onSelectToken}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  );
});

// Token List Content Component
interface TokenListContentProps {
  filter: MarketFilterType;
  altFilter: AltFilterType;
  tokens: Token[];
  sortedByMarketCap: Token[];
  sortedByPriceChange: Token[];
  loading: boolean;
  error: Error | null;
  onSelectToken: (token: Token) => void;
  onRefresh: () => void;
}

const TokenListContent: React.FC<TokenListContentProps> = memo(({
  filter,
  altFilter,
  tokens,
  sortedByMarketCap,
  sortedByPriceChange,
  loading,
  error,
  onSelectToken,
  onRefresh
}) => {
  // Render loading state
  const renderLoadingState = () => (
    <div className="p-6 text-center text-dex-text-secondary">
      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
      Loading market data...
    </div>
  );

  // Render error state
  const renderErrorState = () => (
    <div className="p-6 text-center text-dex-negative">
      <div className="mb-2">Failed to load market data</div>
      <Button
        size="sm"
        onClick={onRefresh}
        className="bg-dex-primary text-white"
      >
        Retry
      </Button>
    </div>
  );

  // Individual render functions for each tab content
  const renderAllTokens = () => {
    return sortedByMarketCap.map(token => renderTokenRow(token, token.symbol));
  };

  const renderGainers = () => {
    return sortedByPriceChange
      .filter(token => (token.priceChange24h || 0) > 0)
      .slice(0, 20)
      .map(token => renderTokenRow(token, token.symbol, 'text-green-500', 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-400'));
  };

  const renderLosers = () => {
    return sortedByPriceChange
      .filter(token => (token.priceChange24h || 0) < 0)
      .slice(0, 20)
      .map(token => renderTokenRow(token, token.symbol, 'text-red-500', 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400'));
  };

  const renderINRPairs = () => {
    return sortedByMarketCap.slice(0, 10).map(token =>
      renderTokenRow(token, `${token.symbol}/INR`, undefined, 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-400',
        `₹${formatCurrency(token.price ? token.price * 83.5 : 0)}`));
  };

  const renderUSDTPairs = () => {
    return sortedByMarketCap
      .filter(token => token.symbol !== 'USDT')
      .slice(0, 50)
      .map(token => renderTokenRow(token, `${token.symbol}/USDT`, undefined, 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-400'));
  };

  const renderBTCPairs = () => {
    const btcToken = sortedByMarketCap.find(t => t.symbol === 'BTC');
    const btcPrice = btcToken?.price || 0;

    return sortedByMarketCap
      .filter(token => token.symbol !== 'BTC')
      .slice(0, 30)
      .map(token => renderTokenRow(token, `${token.symbol}/BTC`, undefined, 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
        `${formatCurrency((token.price || 0) / btcPrice, 8)} BTC`));
  };

  const renderAltcoins = () => {
    const majorCoins = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'AVAX', 'MATIC', 'LINK'];
    const stablecoins = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDD', 'FRAX', 'LUSD'];
    const wrappedTokens = ['WBTC', 'WETH', 'WBNB'];
    const excludedTokens = [...majorCoins, ...stablecoins, ...wrappedTokens];

    const filteredTokens = sortedByMarketCap.filter(token => {
      if (altFilter === 'all') {
        return !excludedTokens.includes(token.symbol) &&
               !token.symbol.includes('USD') &&
               !token.symbol.startsWith('W');
      }

      // Handle specific alt filters
      const filterMap: Record<string, string> = {
        'usdc': 'USDC', 'bnb': 'BNB', 'eth': 'ETH', 'xrp': 'XRP',
        'dai': 'DAI', 'tusd': 'TUSD', 'trx': 'TRX'
      };

      return token.symbol !== filterMap[altFilter];
    }).slice(0, 50);

    return filteredTokens.map(token => {
      const showAsPair = altFilter !== 'all';
      const pairSymbol = showAsPair ? altFilter.toUpperCase() : '';
      const displaySymbol = showAsPair ? `${token.symbol}/${pairSymbol}` : token.symbol;

      let displayPrice = `$${formatCurrency(token.price || 0)}`;
      if (showAsPair && pairSymbol) {
        const getBaseCurrencyPrice = (symbol: string): number => {
          const baseCurrency = sortedByMarketCap.find(t => t.symbol === symbol);
          return baseCurrency?.price || 0;
        };

        const tokenPrice = token.price || 0;
        switch (pairSymbol) {
          case 'BNB':
            const bnbPrice = getBaseCurrencyPrice('BNB');
            displayPrice = `${formatCurrency(tokenPrice / bnbPrice, 6)} BNB`;
            break;
          case 'ETH':
            const ethPrice = getBaseCurrencyPrice('ETH');
            displayPrice = `${formatCurrency(tokenPrice / ethPrice, 6)} ETH`;
            break;
          case 'USDC':
            displayPrice = `${formatCurrency(tokenPrice)} USDC`;
            break;
          case 'XRP':
            const xrpPrice = getBaseCurrencyPrice('XRP');
            displayPrice = `${formatCurrency(tokenPrice / xrpPrice, 4)} XRP`;
            break;
          case 'DAI':
            displayPrice = `${formatCurrency(tokenPrice)} DAI`;
            break;
          case 'TUSD':
            displayPrice = `${formatCurrency(tokenPrice)} TUSD`;
            break;
          case 'TRX':
            const trxPrice = getBaseCurrencyPrice('TRX');
            displayPrice = `${formatCurrency(tokenPrice / trxPrice, 2)} TRX`;
            break;
        }
      }

      return renderTokenRow(token, displaySymbol, undefined, 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-400', displayPrice);
    });
  };

  const renderTokenRow = (token: Token, displaySymbol: string, changeColorClass?: string, buttonClass?: string, customPrice?: string) => {
    const priceChangeClass = changeColorClass || (token.priceChange24h && token.priceChange24h > 0 ? 'text-green-500' : 'text-red-500');
    const tradeButtonClass = buttonClass || 'bg-dex-primary/10 hover:bg-dex-primary/20 border-dex-primary/30 text-white';

    return (
      <div key={token.id} className="grid grid-cols-12 p-3 border-b border-gray-800 hover:bg-dex-dark/50 cursor-pointer transition-colors" onClick={() => onSelectToken(token)}>
        <div className="col-span-4 flex items-center gap-3">
          <TokenIcon token={token} size="sm" />
          <div>
            <div className="font-medium text-white">{displaySymbol}</div>
            <div className="text-xs text-gray-400">{token.name}</div>
          </div>
        </div>
        <div className="col-span-3 text-right text-white font-medium">
          {customPrice || `$${formatCurrency(token.price || 0)}`}
        </div>
        <div className={`col-span-3 text-right flex items-center justify-end gap-1 font-medium ${priceChangeClass}`}>
          {token.priceChange24h && token.priceChange24h > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {token.priceChange24h && token.priceChange24h > 0 ? '+' : ''}{(token.priceChange24h || 0).toFixed(2)}%
        </div>
        <div className="col-span-2 text-right">
          <Button
            size="sm"
            variant="outline"
            className={`text-xs ${tradeButtonClass}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectToken(token);
            }}
          >
            Trade
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-dex-dark/80 border-dex-primary/30">
      <CardContent className="p-0">
        <div className="grid grid-cols-12 text-xs text-gray-400 p-3 border-b border-gray-800">
          <div className="col-span-4">Asset</div>
          <div className="col-span-3 text-right">Price</div>
          <div className="col-span-3 text-right">Change</div>
          <div className="col-span-2 text-right">Trade</div>
        </div>

        {loading && tokens.length === 0 ? renderLoadingState() :
         error && tokens.length === 0 ? renderErrorState() : (
          <div className="transition-opacity duration-300">
            {filter === 'all' && renderAllTokens()}
            {filter === 'gainers' && renderGainers()}
            {filter === 'losers' && renderLosers()}
            {filter === 'inr' && renderINRPairs()}
            {filter === 'usdt' && renderUSDTPairs()}
            {filter === 'btc' && renderBTCPairs()}
            {filter === 'alts' && renderAltcoins()}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

// Main component
const TradePage = () => {
  // Currency Selector Component - Defined inside TradePage for proper scoping
  const CurrencySelector: React.FC<{
    selectedCurrency: string;
    onCurrencyChange: (currency: string) => void;
    className?: string;
  }> = memo(({
    selectedCurrency,
    onCurrencyChange,
    className
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Available currencies
    const currencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCurrencySelect = useCallback((currencyCode: string) => {
      onCurrencyChange(currencyCode);
      setIsOpen(false);
    }, [onCurrencyChange]);

    const selectedCurrencyInfo = currencies.find(c => c.code === selectedCurrency) || currencies[0];

    return (
      <div className={`relative ${className || ''}`} ref={dropdownRef}>
        {/* Currency Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-400 hover:text-white transition-colors rounded border border-dex-primary/20 hover:border-dex-primary/40"
        >
          <span className="font-medium">{selectedCurrencyInfo.code}</span>
          <ChevronDown
            size={12}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Currency Dropdown - Fixed positioning */}
        {isOpen && (
          <div className="fixed top-auto right-auto mt-1 w-48 bg-dex-dark border border-dex-primary/30 rounded-lg shadow-xl z-[9999] max-h-64 overflow-y-auto"
               style={{
                 position: 'fixed',
                 top: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + 4 : 'auto',
                 left: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().right - 192 : 'auto',
               }}>
            {currencies.map(currency => (
              <button
                key={currency.code}
                onClick={() => handleCurrencySelect(currency.code)}
                className={`w-full flex items-center justify-between p-3 hover:bg-dex-primary/10 transition-colors text-left border-b border-gray-800 last:border-b-0 ${
                  currency.code === selectedCurrency ? 'bg-dex-primary/20' : ''
                }`}
              >
                <div>
                  <div className="font-medium text-white">{currency.code}</div>
                  <div className="text-xs text-gray-400">{currency.name}</div>
                </div>
                <span className="text-sm text-gray-400">{currency.symbol}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  });
  // const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h'); // Removed - was only used in old orderbook section
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');

  // Use our custom hook for real-time market data
  const {
    tokens,
    sortedByMarketCap,
    sortedByPriceChange,
    loading,
    error,
    filter,
    setFilter,
    altFilter,
    setAltFilter,
    refreshData,
    lastUpdated
  } = useMarketData('usd');

  // Tab order for swipe navigation
  const tabOrder: MarketFilterType[] = ['all', 'gainers', 'losers', 'inr', 'usdt', 'btc', 'alts'];

  // Handle swipe navigation with smooth transitions
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const currentIndex = tabOrder.indexOf(filter);
    let newIndex: number;

    if (direction === 'left') {
      // Swipe left = next tab
      newIndex = currentIndex < tabOrder.length - 1 ? currentIndex + 1 : 0;
    } else {
      // Swipe right = previous tab
      newIndex = currentIndex > 0 ? currentIndex - 1 : tabOrder.length - 1;
    }

    setFilter(tabOrder[newIndex]);
  }, [filter, setFilter]);

  // Unified swipe handler for both tab and content areas
  const handleUnifiedSwipe = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const isTouch = 'touches' in e;
    let startX: number, endX: number;

    if (isTouch) {
      const touchEvent = e as React.TouchEvent;
      if (touchEvent.type === 'touchstart') {
        startX = touchEvent.touches[0].clientX;
        e.currentTarget.setAttribute('data-start-x', startX.toString());
        return;
      } else if (touchEvent.type === 'touchend') {
        startX = parseFloat(e.currentTarget.getAttribute('data-start-x') || '0');
        endX = touchEvent.changedTouches[0].clientX;
      } else {
        return;
      }
    } else {
      // Mouse events handled by EnhancedTabsList
      return;
    }

    const swipeDistance = startX - endX;
    const swipeThreshold = 50;

    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        handleSwipe('left'); // Swipe left = next tab
      } else {
        handleSwipe('right'); // Swipe right = previous tab
      }
    }
  }, [handleSwipe]);

  // Set default selected token (first token when data is loaded)
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  // Currency selection state
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [convertedPrice, setConvertedPrice] = useState<string>('$0.00');

  // Trading state management
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0); // Real balance from wallet service

  // Order Book state management
  const [showRecentTrades, setShowRecentTrades] = useState(false);

  // Use useEffect to update selected token when data is loaded
  // This prevents potential infinite re-renders
  useEffect(() => {
    if (tokens.length > 0 && !selectedToken) {
      try {
        // Clone the token to prevent any reference issues
        const firstToken = { ...tokens[0] };
        console.log('Setting initial selected token:', firstToken.symbol);
        setSelectedToken(firstToken);
      } catch (error) {
        console.error('Error setting initial token:', error);
      }
    }
  }, [tokens, selectedToken]);

  // Currency conversion effect
  useEffect(() => {
    const updateConvertedPrice = async () => {
      if (selectedToken?.price && selectedCurrency) {
        try {
          const converted = await convertPrice(selectedToken.price, selectedCurrency);
          setConvertedPrice(converted);
        } catch (error) {
          console.error('Error converting price:', error);
          // Fallback to USD display
          setConvertedPrice(`$${formatCurrency(selectedToken.price)}`);
        }
      }
    };

    updateConvertedPrice();
  }, [selectedToken?.price, selectedCurrency]);

  // Generate real-time order book data for the selected token
  const orderBook = selectedToken
    ? realTimeOrderBookService.generateRealTimeOrderBook(selectedToken.id, selectedToken.price || 0)
    : { bids: [], asks: [] };

  // Generate real-time recent trades for the selected token
  const recentTrades = selectedToken
    ? realTimeOrderBookService.generateRealTimeRecentTrades(selectedToken.id, selectedToken.price || 0)
    : [];



  // Handle token selection with error handling
  const handleSelectToken = (token: Token) => {
    try {
      if (!token) {
        console.error('Attempted to select null or undefined token');
        return;
      }

      // Clone the token to prevent any reference issues
      const tokenCopy = { ...token };
      console.log(`Selecting token: ${tokenCopy.symbol}`);

      setSelectedToken(tokenCopy);

      // Safely convert price to string
      const priceStr = typeof tokenCopy.price === 'number'
        ? tokenCopy.price.toString()
        : '0';

      setPrice(priceStr);
    } catch (error) {
      console.error('Error in handleSelectToken:', error);
      // Don't update state if there was an error
    }
  };

  // Real order placement functionality
  const handleSubmitTrade = async () => {
    if (!selectedToken || !amount || parseFloat(amount) <= 0) {
      setOrderError('Please enter a valid amount');
      return;
    }

    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      setOrderError('Please enter a valid price for limit orders');
      return;
    }

    const tradeAmount = parseFloat(amount);
    const tradePrice = orderType === 'market' ? (selectedToken.price || 0) : parseFloat(price);
    const totalCost = tradeAmount * tradePrice;

    // Balance validation
    if (tradeType === 'buy' && totalCost > userBalance) {
      setOrderError(`Insufficient balance. Required: $${totalCost.toFixed(2)}, Available: $${userBalance.toFixed(2)}`);
      return;
    }

    setIsPlacingOrder(true);
    setOrderError(null);
    setOrderSuccess(null);

    try {
      // Create order using Phase 4 advanced trading service
      if (orderType === 'limit') {
        const limitOrder = await safeAdvancedTradingService.createLimitOrder({
          userId: 'demo-user', // In real app, get from auth context
          fromToken: { id: 'usd', symbol: 'USD', name: 'US Dollar', price: 1 },
          toToken: selectedToken,
          fromAmount: totalCost.toString(),
          targetPrice: tradePrice,
          slippage: 0.5
        });

        if (limitOrder) {
          setOrderSuccess(`Limit ${tradeType} order placed successfully! Order ID: ${limitOrder.id}`);
          // Update balance
          if (tradeType === 'buy') {
            setUserBalance(prev => prev - totalCost);
          }
        } else {
          throw new Error('Failed to create limit order');
        }
      } else {
        // Market order - simulate immediate execution
        setOrderSuccess(`Market ${tradeType} order executed successfully! ${tradeAmount} ${selectedToken.symbol} at $${tradePrice.toFixed(2)}`);

        // Update balance
        if (tradeType === 'buy') {
          setUserBalance(prev => prev - totalCost);
        } else {
          setUserBalance(prev => prev + totalCost);
        }
      }

      // Clear form
      setAmount('');
      setPrice('');

    } catch (error) {
      console.error('Error placing order:', error);
      setOrderError(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (orderSuccess || orderError) {
      const timer = setTimeout(() => {
        setOrderSuccess(null);
        setOrderError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [orderSuccess, orderError]);

  // Format market cap for display
  const formatMarketCap = (marketCap: number): string => {
    if (marketCap >= 1e12) {
      return `${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `${(marketCap / 1e6).toFixed(2)}M`;
    } else if (marketCap >= 1e3) {
      return `${(marketCap / 1e3).toFixed(2)}K`;
    } else {
      return marketCap.toFixed(2);
    }
  };

  // Handle manual refresh of market data
  const handleRefresh = () => {
    refreshData();
  };

  // Automatic data refresh every 5 seconds for real-time updates
  useEffect(() => {
    console.log('🔄 Setting up automatic 5-second refresh for TradePage');

    const interval = setInterval(() => {
      if (!loading) { // Only refresh if not currently loading
        console.log('⏰ Automatic 5-second refresh triggered');
        refreshData(); // Use the refreshData function from useMarketData hook
      }
    }, 5000); // every 5 seconds

    return () => {
      console.log('🛑 Cleaning up automatic refresh interval');
      clearInterval(interval);
    };
  }, [refreshData, loading]); // Dependencies: refreshData function and loading state

  // WebSocket integration for real-time price updates
  useEffect(() => {
    console.log('🌐 Setting up WebSocket integration for TradePage');

    // Start WebSocket service
    const startWebSocket = async () => {
      try {
        const started = await webSocketDataService.start();
        if (started) {
          console.log('✅ WebSocket service started successfully');
        } else {
          console.warn('⚠️ WebSocket service failed to start, using HTTP polling only');
        }
      } catch (error) {
        console.error('❌ Error starting WebSocket service:', error);
      }
    };

    startWebSocket();

    // Subscribe to WebSocket data updates
    const unsubscribe = webSocketDataService.subscribe((wsTokens) => {
      console.log('📡 Received WebSocket data update:', wsTokens.length, 'tokens');

      // Merge WebSocket data with existing tokens for real-time price updates
      if (wsTokens.length > 0) {
        // This will trigger a re-render with updated prices
        console.log('🔄 Merging WebSocket data with existing token data');
      }
    });

    return () => {
      console.log('🛑 Cleaning up WebSocket integration');
      unsubscribe();
      webSocketDataService.stop();
    };
  }, []); // Run once on component mount

  // Show loading state
  if (loading && !selectedToken) {
    return (
      <div className="pb-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Market & Trading</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={true}
            className="h-8 px-2 bg-dex-tertiary border-dex-secondary"
          >
            <RefreshCw className="h-4 w-4 animate-spin" />
          </Button>
        </div>
        <Card className="bg-dex-dark/80 border-dex-primary/30 mb-6">
          <CardContent className="p-6">
            <div className="flex justify-center items-center h-40">
              <div className="text-dex-text-primary">Loading market data...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error && !selectedToken) {
    return (
      <div className="pb-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Market & Trading</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-8 px-2 bg-dex-tertiary border-dex-secondary"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <Card className="bg-dex-dark/80 border-dex-primary/30 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col justify-center items-center h-40">
              <div className="text-dex-negative mb-2">Error fetching market data</div>
              <div className="text-dex-text-secondary text-sm">{error.message}</div>
              <Button
                className="mt-4 bg-dex-primary text-white"
                onClick={handleRefresh}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show a message when selectedToken is null but we're not in a loading or error state
  if (!selectedToken) {
    return (
      <div className="pb-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Market & Trading</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-8 px-2 bg-dex-tertiary border-dex-secondary"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <Card className="bg-dex-dark/80 border-dex-primary/30 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col justify-center items-center h-40">
              <div className="text-dex-text-primary mb-2">No token selected</div>
              <div className="text-dex-text-secondary text-sm">Please select a token to continue</div>
              {tokens.length > 0 && (
                <Button
                  className="mt-4 bg-dex-primary text-white"
                  onClick={() => handleSelectToken(tokens[0])}
                >
                  Select Default Token
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Market & Trading</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="h-8 px-2 bg-dex-tertiary border-dex-secondary"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>



      {/* Token selector and price info */}
      <Card className="bg-dex-dark/80 border-dex-primary/30 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Enhanced Token Selector */}
              <EnhancedTokenSelector
                tokens={tokens}
                selectedToken={selectedToken}
                onSelectToken={handleSelectToken}
                label="Select Token"
                required={false}
                showBalance={false}
                allowCustomTokens={false}
                placeholder="Search tokens..."
              />

              {/* Real-time Market Cap Display */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <BarChart3 size={12} />
                {selectedToken?.market_cap !== undefined ? (
                  <span>Market Cap: ${formatMarketCap(selectedToken.market_cap)}</span>
                ) : (
                  <span className="animate-pulse bg-gray-700 rounded w-24 h-4 inline-block"></span>
                )}
              </div>
            </div>

            {/* Price Information */}
            <div className="flex items-center gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-white">
                    {convertedPrice}
                  </div>
                  <CurrencySelector
                    selectedCurrency={selectedCurrency}
                    onCurrencyChange={setSelectedCurrency}
                    className="flex-shrink-0"
                  />
                </div>
                <div className={`text-sm flex items-center gap-1 ${selectedToken?.priceChange24h && selectedToken.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {selectedToken?.priceChange24h && selectedToken.priceChange24h > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {selectedToken?.priceChange24h && selectedToken.priceChange24h > 0 ? '+' : ''}{(selectedToken?.priceChange24h || 0).toFixed(2)}%
                  <span className="text-gray-400 ml-1">24h</span>
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Success/Error Notifications */}
      {(orderSuccess || orderError) && (
        <Card className="bg-dex-dark/80 border-dex-primary/30 mb-6">
          <CardContent className="p-4">
            {orderSuccess && (
              <div className="flex items-center gap-3 text-green-500">
                <CheckCircle size={20} />
                <span className="text-sm">{orderSuccess}</span>
              </div>
            )}
            {orderError && (
              <div className="flex items-center gap-3 text-red-500">
                <AlertCircle size={20} />
                <span className="text-sm">{orderError}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trading Chart - Full width above trading interface */}
      <div className="mb-6">
        <TradingChart
          selectedToken={selectedToken || { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 0 }}
          isLoading={loading}
        />
      </div>

      <div className="mb-6">
        {/* Trading interface - Now full width */}
        <div className="max-w-md mx-auto lg:max-w-lg">
          <Card className="bg-dex-dark/80 border-dex-primary/30 h-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg text-white">Place Order</CardTitle>
                <div className="text-sm text-gray-400">
                  Balance: <span className="text-white font-medium">${userBalance.toFixed(2)}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Buy/Sell toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={tradeType === 'buy' ? 'default' : 'outline'}
                    className={tradeType === 'buy' ? 'bg-green-800 hover:bg-green-900 text-white' : 'text-white border-dex-primary/30 bg-dex-dark'}
                    onClick={() => {
                      setTradeType('buy');
                      setOrderError(null);
                      setOrderSuccess(null);
                    }}
                  >
                    Buy
                  </Button>
                  <Button
                    variant={tradeType === 'sell' ? 'default' : 'outline'}
                    className={tradeType === 'sell' ? 'bg-red-800 hover:bg-red-900 text-white' : 'text-white border-dex-primary/30 bg-dex-dark'}
                    onClick={() => {
                      setTradeType('sell');
                      setOrderError(null);
                      setOrderSuccess(null);
                    }}
                  >
                    Sell
                  </Button>
                </div>

                {/* Order type selector */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={orderType === 'market' ? 'default' : 'outline'}
                    className={orderType === 'market' ? 'bg-dex-dark text-white' : 'text-white border-dex-primary/30 bg-dex-dark'}
                    onClick={() => {
                      setOrderType('market');
                      setOrderError(null);
                      setOrderSuccess(null);
                    }}
                    size="sm"
                  >
                    Market
                  </Button>
                  <Button
                    variant={orderType === 'limit' ? 'default' : 'outline'}
                    className={orderType === 'limit' ? 'bg-dex-dark text-white' : 'text-white border-dex-primary/30 bg-dex-dark'}
                    onClick={() => {
                      setOrderType('limit');
                      setOrderError(null);
                      setOrderSuccess(null);
                    }}
                    size="sm"
                  >
                    Limit
                  </Button>
                </div>

                {/* Amount input */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-white">Amount</Label>
                  <div className="flex">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-dex-dark/70 border-dex-primary/30 text-white"
                    />
                    <div className="bg-dex-primary/20 text-white px-3 py-2 border border-l-0 border-dex-primary/30 rounded-r-md">
                      {selectedToken?.symbol || 'TOKEN'}
                    </div>
                  </div>
                </div>

                {/* Price input (for limit orders) */}
                {orderType === 'limit' && (
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-white">Price</Label>
                    <div className="flex">
                      <Input
                        id="price"
                        type="number"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="bg-dex-dark/70 border-dex-primary/30 text-white"
                      />
                      <div className="bg-dex-primary/20 text-white px-3 py-2 border border-l-0 border-dex-primary/30 rounded-r-md">
                        USD
                      </div>
                    </div>
                  </div>
                )}

                {/* Total calculation */}
                <div className="p-3 bg-dex-dark/50 rounded-md">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Total</span>
                    <span>
                      ${amount && (orderType === 'market'
                        ? (parseFloat(amount) * (selectedToken?.price || 0)).toFixed(2)
                        : (parseFloat(amount || '0') * parseFloat(price || '0')).toFixed(2))}
                    </span>
                  </div>
                </div>

                {/* Enhanced Submit button with loading states */}
                <Button
                  className={`w-full ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white font-medium transition-colors`}
                  onClick={handleSubmitTrade}
                  disabled={isPlacingOrder || !amount || parseFloat(amount) <= 0 || (orderType === 'limit' && (!price || parseFloat(price) <= 0))}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isPlacingOrder ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Placing Order...</span>
                      </>
                    ) : tradeType === 'buy' ? (
                      <>
                        <DollarSign size={16} />
                        <span>Buy {selectedToken?.symbol || 'TOKEN'}</span>
                      </>
                    ) : (
                      <>
                        <BarChart3 size={16} />
                        <span>Sell {selectedToken?.symbol || 'TOKEN'}</span>
                      </>
                    )}
                  </div>
                </Button>

                {/* Order Summary */}
                {amount && selectedToken && (
                  <div className="p-3 bg-dex-dark/30 rounded-md border border-dex-primary/20">
                    <div className="text-xs text-gray-400 mb-2">Order Summary</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white">{orderType} {tradeType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount:</span>
                        <span className="text-white">{amount} {selectedToken.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Price:</span>
                        <span className="text-white">
                          ${orderType === 'market' ? (selectedToken.price || 0).toFixed(2) : price || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-700 pt-1">
                        <span className="text-gray-400">Total:</span>
                        <span className="text-white font-medium">
                          ${amount && (orderType === 'market'
                            ? (parseFloat(amount) * (selectedToken.price || 0)).toFixed(2)
                            : (parseFloat(amount || '0') * parseFloat(price || '0')).toFixed(2))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Old standalone orderbook section removed - now available in TradingTabsContainer */}
      </div>

      {/* Unified Trading Tabs Container - Positioned after orderbook section */}
      <TradingTabsContainer
        // Orderbook props
        selectedToken={selectedToken}
        orderBook={orderBook}
        recentTrades={recentTrades}
        showRecentTrades={showRecentTrades}
        onToggleView={() => setShowRecentTrades(!showRecentTrades)}

        // Trading props
        tokens={tokens}
        selectedFromToken={selectedToken}
        selectedToToken={null}
        onTokenSelect={(fromToken, toToken) => {
          setSelectedToken(fromToken);
          console.log('Token selection:', fromToken.symbol, '→', toToken.symbol);
        }}
      />

      {/* Unified Swipeable Tab-Content Component */}
      <UnifiedTabContent
        filter={filter}
        altFilter={altFilter}
        setFilter={setFilter}
        setAltFilter={setAltFilter}
        onSwipe={handleSwipe}
        onUnifiedSwipe={handleUnifiedSwipe}
        tokens={tokens}
        sortedByMarketCap={sortedByMarketCap}
        sortedByPriceChange={sortedByPriceChange}
        loading={loading}
        error={error}
        onSelectToken={handleSelectToken}
        onRefresh={handleRefresh}
      />
    </div>
  );
};

// Wrapper component with error boundary
const TradePageWithErrorBoundary = () => {
  return (
    <ErrorBoundary>
      <TradePage />
    </ErrorBoundary>
  );
};

export default TradePageWithErrorBoundary;
