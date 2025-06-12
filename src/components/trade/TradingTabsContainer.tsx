/**
 * UNIFIED TRADING TABS CONTAINER
 * 
 * Combines orderbook and advanced trading functionality in a unified swipeable tab interface
 * positioned under the existing orderbook section in TradePage.tsx
 */

import React, { useState, useRef, useCallback, memo } from 'react';
import { Token } from '@/types';
import { OrderbookTab } from './OrderbookTab';
import { AdvancedTradingTab } from './AdvancedTradingTab';

interface TradingTabsContainerProps {
  // Orderbook props
  selectedToken: Token | null;
  orderBook: any;
  recentTrades: any[];
  showRecentTrades: boolean;
  onToggleView: () => void;
  
  // Trading props
  tokens: Token[];
  selectedFromToken?: Token;
  selectedToToken?: Token;
  onTokenSelect?: (fromToken: Token, toToken: Token) => void;
}

// Enhanced Tab Trigger with Gradient Styling
interface EnhancedTabTriggerProps {
  value: string;
  isActive: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}

const EnhancedTabTrigger: React.FC<EnhancedTabTriggerProps> = memo(({
  value,
  isActive,
  children,
  onClick,
  className = ""
}) => {
  return (
    <button
      className={`
        flex-1 px-4 py-3 text-center transition-all duration-300 ease-in-out rounded-md min-h-[44px] relative
        ${isActive 
          ? 'text-lg font-semibold bg-gradient-to-r from-[#F66F13] to-[#E5E7E8] bg-clip-text text-transparent' 
          : 'text-sm font-medium text-white/70 hover:text-white hover:bg-dex-secondary/10'
        }
        ${className}
      `}
      onClick={onClick}
    >
      {children}
      {isActive && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-[#F66F13] to-[#E5E7E8] rounded-full transition-all duration-300 ease-in-out" />
      )}
    </button>
  );
});

// Enhanced Tabs List with Swipe Support
interface EnhancedTabsListProps {
  children: React.ReactNode;
  className?: string;
  onSwipe: (direction: 'left' | 'right') => void;
}

const EnhancedTabsList: React.FC<EnhancedTabsListProps> = memo(({
  children,
  className = "",
  onSwipe
}) => {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [mouseStart, setMouseStart] = useState<number | null>(null);
  const [mouseEnd, setMouseEnd] = useState<number | null>(null);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      onSwipe('left');
    } else if (isRightSwipe) {
      onSwipe('right');
    }
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseEnd(null);
    setMouseStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mouseStart !== null) {
      setMouseEnd(e.clientX);
    }
  };

  const handleMouseUp = () => {
    if (!mouseStart || !mouseEnd) {
      setMouseStart(null);
      setMouseEnd(null);
      return;
    }
    
    const distance = mouseStart - mouseEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      onSwipe('left');
    } else if (isRightSwipe) {
      onSwipe('right');
    }

    setMouseStart(null);
    setMouseEnd(null);
  };

  return (
    <div
      ref={tabsRef}
      className={`flex ${className} cursor-pointer select-none`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {children}
    </div>
  );
});

export const TradingTabsContainer: React.FC<TradingTabsContainerProps> = memo(({
  // Orderbook props
  selectedToken,
  orderBook,
  recentTrades,
  showRecentTrades,
  onToggleView,
  
  // Trading props
  tokens,
  selectedFromToken,
  selectedToToken,
  onTokenSelect
}) => {
  const [activeTab, setActiveTab] = useState<'orderbook' | 'trading'>('orderbook');

  // Handle swipe navigation
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'left' && activeTab === 'orderbook') {
      setActiveTab('trading');
    } else if (direction === 'right' && activeTab === 'trading') {
      setActiveTab('orderbook');
    }
  }, [activeTab]);

  return (
    <div className="w-full mb-6">
      {/* Enhanced Tab Navigation - No background highlights */}
      <EnhancedTabsList
        className="w-full mb-6 px-2 py-2 rounded-lg"
        onSwipe={handleSwipe}
      >
        <EnhancedTabTrigger
          value="orderbook"
          isActive={activeTab === 'orderbook'}
          onClick={() => setActiveTab('orderbook')}
          className="min-h-[44px]"
        >
          Orderbook
        </EnhancedTabTrigger>
        <EnhancedTabTrigger
          value="trading"
          isActive={activeTab === 'trading'}
          onClick={() => setActiveTab('trading')}
          className="min-h-[44px]"
        >
          Advanced Trading
        </EnhancedTabTrigger>
      </EnhancedTabsList>

      {/* Tab Content - Single unified content block */}
      <div className="transition-all duration-300 ease-in-out">
        {activeTab === 'orderbook' && (
          <OrderbookTab
            selectedToken={selectedToken}
            orderBook={orderBook}
            recentTrades={recentTrades}
            showRecentTrades={showRecentTrades}
            onToggleView={onToggleView}
          />
        )}
        {activeTab === 'trading' && (
          <AdvancedTradingTab
            tokens={tokens}
            selectedFromToken={selectedFromToken || selectedToken}
            selectedToToken={selectedToToken}
            onTokenSelect={onTokenSelect}
          />
        )}
      </div>
    </div>
  );
});

TradingTabsContainer.displayName = 'TradingTabsContainer';

export default TradingTabsContainer;
