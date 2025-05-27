import React, { createContext, useContext, ReactNode } from 'react';
import { useMarketData } from '@/hooks/useMarketData';
import { Token } from '@/types';
import { MarketFilterType, AltFilterType } from '@/types/api';

interface MarketDataContextType {
  tokens: Token[];
  sortedByMarketCap: Token[];
  sortedByPriceChange: Token[];
  loading: boolean;
  error: Error | null;
  filter: MarketFilterType;
  setFilter: (filter: MarketFilterType) => void;
  altFilter: AltFilterType;
  setAltFilter: (filter: AltFilterType) => void;
  refreshData: () => Promise<void>;
  lastUpdated: Date | null;
}

const MarketDataContext = createContext<MarketDataContextType | undefined>(undefined);

export function MarketDataProvider({ children }: { children: ReactNode }) {
  const marketData = useMarketData('usd');
  
  return (
    <MarketDataContext.Provider value={marketData}>
      {children}
    </MarketDataContext.Provider>
  );
}

export function useGlobalMarketData() {
  const context = useContext(MarketDataContext);
  if (context === undefined) {
    throw new Error('useGlobalMarketData must be used within a MarketDataProvider');
  }
  return context;
}
