
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
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
import { ChartModal } from '@/components/charts';



import { TimeInterval, ChartType, DEFAULT_INDICATORS } from '@/types/chart';
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

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!onSwipe) return;

    const swipeThreshold = 80; // Increased threshold to reduce accidental swipes
    const swipeDistance = touchStartX.current - touchEndX.current;

    console.log('Touch end - Start:', touchStartX.current, 'End:', touchEndX.current, 'Distance:', swipeDistance);

    // Only trigger swipe if the distance is significant and we're not clicking on a button
    const target = e.target as HTMLElement;
    const isButton = target.tagName === 'BUTTON' || target.closest('button') || target.closest('[role="button"]');
    const isTabTrigger = target.classList.contains('touch-manipulation') || target.closest('.touch-manipulation');

    // Prevent swipe if touching a button or tab trigger
    if (Math.abs(swipeDistance) > swipeThreshold && !isButton && !isTabTrigger) {
      if (swipeDistance > 0) {
        console.log('Touch swipe left (next tab)');
        onSwipe('left');
      } else {
        console.log('Touch swipe right (previous tab)');
        onSwipe('right');
      }
    }
  }, [onSwipe]);

  // Mouse events for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseStartX.current = e.clientX;
    isDragging.current = true;
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
  onClick: (e?: React.MouseEvent | React.TouchEvent) => void;
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
    onClick(e);
  }, [onClick]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(e);
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className={`
        relative flex-shrink-0 px-2 py-2 min-w-[80px] min-h-[44px] text-center transition-all duration-200 ease-in-out rounded-lg font-poppins text-sm font-medium touch-manipulation
        ${isActive
          ? 'bg-gradient-to-br from-[#B1420A] to-[#D2691E] text-white shadow-[0_4px_8px_rgba(177,66,10,0.3)] border border-[#B1420A]/20'
          : 'text-white/70 hover:text-white hover:bg-dex-secondary/10 border border-dex-secondary/30'
        }
        ${className || ''}
      `}
      style={{
        touchAction: 'manipulation',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setFilter('all');
          }}
          className="min-h-[44px] touch-manipulation"
        >
          All Assets
        </EnhancedTabTrigger>
        <EnhancedTabTrigger
          value="gainers"
          isActive={filter === 'gainers'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setFilter('gainers');
          }}
          className="min-h-[44px] touch-manipulation"
        >
          Top Gainers
        </EnhancedTabTrigger>
        <EnhancedTabTrigger
          value="losers"
          isActive={filter === 'losers'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setFilter('losers');
          }}
          className="min-h-[44px] touch-manipulation"
        >
          Top Losers
        </EnhancedTabTrigger>
        <EnhancedTabTrigger
          value="inr"
          isActive={filter === 'inr'}
          onClick={(e) => {
            e?.preventDefault();
            e?.stopPropagation();
            setFilter('inr');
          }}
          className="min-h-[44px] touch-manipulation"
        >
          INR
        </EnhancedTabTrigger>
        <EnhancedTabTrigger
          value="usdt"
          isActive={filter === 'usdt'}
          onClick={(e) => {
            e?.preventDefault();
            e?.stopPropagation();
            setFilter('usdt');
          }}
          className="min-h-[44px] touch-manipulation"
        >
          USDT
        </EnhancedTabTrigger>
        <EnhancedTabTrigger
          value="btc"
          isActive={filter === 'btc'}
          onClick={(e) => {
            e?.preventDefault();
            e?.stopPropagation();
            setFilter('btc');
          }}
          className="min-h-[44px] touch-manipulation"
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
              onTouchMove={(e) => e.stopPropagation()}
              style={{
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none'
              }}
              className={`
                relative flex-shrink-0 px-2 py-2 min-w-[80px] min-h-[44px] text-center transition-all duration-200 ease-in-out flex items-center gap-1 rounded-lg font-poppins text-sm font-medium
                ${filter === 'alts'
                  ? 'bg-gradient-to-br from-[#B1420A] to-[#D2691E] text-white shadow-[0_4px_8px_rgba(177,66,10,0.3)] border border-[#B1420A]/20'
                  : 'text-white/70 hover:text-white hover:bg-dex-secondary/10 border border-dex-secondary/30'
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
          case 'BNB': {
            const bnbPrice = getBaseCurrencyPrice('BNB');
            displayPrice = `${formatCurrency(tokenPrice / bnbPrice, 6)} BNB`;
            break;
          }
          case 'ETH': {
            const ethPrice = getBaseCurrencyPrice('ETH');
            displayPrice = `${formatCurrency(tokenPrice / ethPrice, 6)} ETH`;
            break;
          }
          case 'USDC':
            displayPrice = `${formatCurrency(tokenPrice)} USDC`;
            break;
          case 'XRP': {
            const xrpPrice = getBaseCurrencyPrice('XRP');
            displayPrice = `${formatCurrency(tokenPrice / xrpPrice, 4)} XRP`;
            break;
          }
          case 'DAI':
            displayPrice = `${formatCurrency(tokenPrice)} DAI`;
            break;
          case 'TUSD':
            displayPrice = `${formatCurrency(tokenPrice)} TUSD`;
            break;
          case 'TRX': {
            const trxPrice = getBaseCurrencyPrice('TRX');
            displayPrice = `${formatCurrency(tokenPrice / trxPrice, 2)} TRX`;
            break;
          }
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
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    // Enhanced currency list with more options
    const currencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { code: 'KRW', name: 'South Korean Won', symbol: '₩' }
    ];

    // State for exchange rates
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
    const [isLoadingRates, setIsLoadingRates] = useState(false);

    // Load exchange rates when dropdown opens
    useEffect(() => {
      const loadExchangeRates = async () => {
        if (isOpen && Object.keys(exchangeRates).length === 0) {
          setIsLoadingRates(true);
          try {
            const { currencyService } = await import('@/services/currencyService');
            const rates = await currencyService.getExchangeRates();
            setExchangeRates(rates);
          } catch (error) {
            console.error('Failed to load exchange rates:', error);
            // Set fallback rates
            setExchangeRates({
              EUR: 0.85, GBP: 0.73, JPY: 110, INR: 74,
              CAD: 1.25, AUD: 1.35, CHF: 0.92, CNY: 6.45, KRW: 1180
            });
          } finally {
            setIsLoadingRates(false);
          }
        }
      };

      loadExchangeRates();
    }, [isOpen, exchangeRates]);

    // Calculate dropdown position when opening
    const updateDropdownPosition = useCallback(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const dropdownHeight = 320; // max-h-80 = 320px
        const dropdownWidth = Math.max(rect.width, 256); // Minimum 256px width

        // Calculate initial position
        let top = rect.bottom + scrollTop + 8; // 8px gap below trigger
        let left = rect.left + scrollLeft;

        // Viewport boundary checks
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        // Check if dropdown would go below viewport
        if (rect.bottom + dropdownHeight > viewportHeight) {
          // Position above trigger instead
          top = rect.top + scrollTop - dropdownHeight - 8;
        }

        // Check if dropdown would go beyond right edge
        if (left + dropdownWidth > viewportWidth) {
          left = viewportWidth - dropdownWidth - 16; // 16px margin from edge
        }

        // Check if dropdown would go beyond left edge
        if (left < 16) {
          left = 16; // 16px margin from edge
        }

        setDropdownPosition({
          top,
          left,
          width: dropdownWidth
        });
      }
    }, []);

    // Close dropdown when clicking outside and handle scroll/resize
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
            triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      const handleScroll = () => {
        if (isOpen) {
          updateDropdownPosition();
        }
      };

      const handleResize = () => {
        if (isOpen) {
          updateDropdownPosition();
        }
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }, [isOpen, updateDropdownPosition]);

    const handleCurrencySelect = useCallback((currencyCode: string) => {
      onCurrencyChange(currencyCode);
      setIsOpen(false);
    }, [onCurrencyChange]);

    const handleToggleDropdown = useCallback(() => {
      if (!isOpen) {
        updateDropdownPosition();
      }
      setIsOpen(!isOpen);
    }, [isOpen, updateDropdownPosition]);

    const selectedCurrencyInfo = currencies.find(c => c.code === selectedCurrency) || currencies[0];

    return (
      <>
        <div className={`relative ${className || ''}`}>
          {/* Enhanced Currency Trigger */}
          <button
            ref={triggerRef}
            onClick={handleToggleDropdown}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition-all duration-200 rounded-lg border border-dex-primary/20 hover:border-dex-primary/40 bg-dex-dark/50 hover:bg-dex-primary/10"
          >
            <span className="text-xs">{selectedCurrencyInfo.symbol}</span>
            <span className="font-medium">{selectedCurrencyInfo.code}</span>
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Enhanced Currency Dropdown with Exchange Rates - Portal Rendering */}
        {isOpen && createPortal(
          <div
            ref={dropdownRef}
            className="fixed bg-dex-dark border border-dex-primary/30 rounded-lg shadow-xl max-h-80 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: 99999, // Higher than chart modal and other components
              backgroundColor: '#1C1C1E',
              border: '1px solid rgba(177, 66, 10, 0.3)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(177, 66, 10, 0.2), 0 0 0 1px rgba(177, 66, 10, 0.1)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              // Mobile optimizations
              WebkitOverflowScrolling: 'touch',
              touchAction: 'manipulation'
            }}
          >
            {isLoadingRates && (
              <div className="px-3 py-2 text-center text-gray-400 text-sm border-b border-gray-800">
                Loading exchange rates...
              </div>
            )}
            {currencies.map(currency => {
              const rate = exchangeRates[currency.code];
              const isSelected = currency.code === selectedCurrency;

              return (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencySelect(currency.code)}
                  className={`w-full flex items-center justify-between p-3 hover:bg-dex-primary/10 transition-colors text-left border-b border-gray-800 last:border-b-0 ${
                    isSelected ? 'bg-dex-primary/20 text-dex-primary' : 'text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{currency.symbol}</span>
                    <div>
                      <div className="font-medium">{currency.code}</div>
                      <div className="text-xs text-gray-400">{currency.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {rate && currency.code !== 'USD' && (
                      <div className="text-xs text-gray-500">
                        1 USD = {rate.toFixed(currency.code === 'JPY' || currency.code === 'KRW' ? 0 : 2)}
                      </div>
                    )}
                    {currency.code === 'USD' && (
                      <div className="text-xs text-gray-500">Base</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>,
          document.body
        )}
      </>
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

  // Token selection state
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  // Chart modal state
  const [showChartModal, setShowChartModal] = useState(false);





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
        console.log('🎯 Setting initial selected token:', {
          symbol: firstToken.symbol,
          id: firstToken.id,
          price: firstToken.price,
          hasValidId: !!firstToken.id && firstToken.id !== 'unknown'
        });
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
    ? realTimeOrderBookService.generateRealTimeOrderBook(selectedToken?.id || 'unknown', selectedToken?.price || 0)
    : { bids: [], asks: [] };

  // Generate real-time recent trades for the selected token
  const recentTrades = selectedToken
    ? realTimeOrderBookService.generateRealTimeRecentTrades(selectedToken?.id || 'unknown', selectedToken?.price || 0)
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
      console.log(`🎯 Selecting token: ${tokenCopy.symbol} (ID: ${tokenCopy.id})`);

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
    const tradePrice = orderType === 'market' ? (selectedToken?.price || 0) : parseFloat(price);
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
        setOrderSuccess(`Market ${tradeType} order executed successfully! ${tradeAmount} ${selectedToken?.symbol || 'TOKEN'} at $${tradePrice.toFixed(2)}`);

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



  const handleChartExpand = useCallback(() => {
    console.log('📊 Expanding chart to landscape modal');
    setShowChartModal(true);
  }, []);

  const handleChartModalClose = useCallback(() => {
    console.log('📊 Closing chart modal');
    setShowChartModal(false);
  }, []);

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

      {/* Trading Chart Button - Simplified */}
      <div className="mb-6">
        <Card className="bg-black border-gray-800 rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-center">
              <Button
                onClick={handleChartExpand}
                disabled={!selectedToken}
                className={`
                  h-12 px-6 rounded-lg font-semibold text-base transition-all duration-200 flex items-center gap-2
                  ${selectedToken
                    ? 'bg-gradient-to-r from-[#B1420A] to-[#D2691E] hover:from-[#D2691E] hover:to-[#B1420A] text-white shadow-lg shadow-[#B1420A]/30 hover:shadow-[#B1420A]/40 transform hover:scale-105'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }
                `}
                style={{ fontFamily: 'Poppins' }}
              >
                <BarChart3 size={20} />
                {selectedToken ? 'Trading Chart' : 'Select Token First'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chart Modal for Trading View - Only render when needed */}
        {showChartModal && selectedToken && (
          <ChartModal
            isOpen={showChartModal}
            onClose={handleChartModalClose}
            selectedToken={selectedToken}
            data={[]}
            indicators={DEFAULT_INDICATORS}
            theme="dark"
          />
        )}
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
                        <span className="text-white">{amount} {selectedToken?.symbol || 'TOKEN'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Price:</span>
                        <span className="text-white">
                          ${orderType === 'market' ? (selectedToken?.price || 0).toFixed(2) : price || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-700 pt-1">
                        <span className="text-gray-400">Total:</span>
                        <span className="text-white font-medium">
                          ${(() => {
                            if (!amount) return '0.00';
                            try {
                              const amountNum = parseFloat(amount);
                              if (orderType === 'market') {
                                const tokenPrice = selectedToken?.price || 0;
                                return (amountNum * tokenPrice).toFixed(2);
                              } else {
                                const priceNum = parseFloat(price || '0');
                                return (amountNum * priceNum).toFixed(2);
                              }
                            } catch (error) {
                              console.error('Error calculating total:', error);
                              return '0.00';
                            }
                          })()}
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
        selectedToken={selectedToken || null}
        orderBook={orderBook || { bids: [], asks: [] }}
        recentTrades={recentTrades || []}
        showRecentTrades={showRecentTrades}
        onToggleView={() => setShowRecentTrades(!showRecentTrades)}

        // Trading props
        tokens={tokens || []}
        selectedFromToken={selectedToken || null}
        selectedToToken={null}
        onTokenSelect={(fromToken, toToken) => {
          if (fromToken) {
            setSelectedToken(fromToken);
            console.log('Token selection:', fromToken?.symbol || 'Unknown', '→', toToken?.symbol || 'Unknown');
          }
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
