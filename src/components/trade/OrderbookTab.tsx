/**
 * ORDERBOOK TAB COMPONENT
 * 
 * Extracted orderbook functionality from TradePage.tsx for use in the unified trading tabs
 */

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, BarChart3, Clock } from 'lucide-react';
import { Token } from '@/types';
import { formatCurrency } from '@/services/realTimeData';

interface OrderbookTabProps {
  selectedToken: Token | null;
  orderBook: any;
  recentTrades: any[];
  showRecentTrades: boolean;
  onToggleView: () => void;
}

export const OrderbookTab: React.FC<OrderbookTabProps> = memo(({
  selectedToken,
  orderBook,
  recentTrades,
  showRecentTrades,
  onToggleView
}) => {
  return (
    <Card className="bg-dex-dark/80 border-dex-primary/30 h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="text-lg text-white">
            {showRecentTrades ? 'Recent Trades' : 'Order Book'}
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-dex-text-secondary">
            <Activity size={12} className="text-green-500" />
            <span>Live Data</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {selectedToken ? `${selectedToken.symbol}/USD` : 'Select a token'}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleView}
              className={`text-xs px-2 py-1 h-7 ${
                !showRecentTrades 
                  ? 'bg-dex-primary/20 text-dex-primary' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 size={12} className="mr-1" />
              Order Book
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleView}
              className={`text-xs px-2 py-1 h-7 ${
                showRecentTrades 
                  ? 'bg-dex-primary/20 text-dex-primary' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Clock size={12} className="mr-1" />
              Recent Trades
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {!showRecentTrades ? (
          <div className="space-y-4">
            {/* Asks (Sell orders) */}
            <div>
              <div className="grid grid-cols-3 text-xs text-gray-400 p-2 border-b border-gray-800">
                <div>Price (USD)</div>
                <div className="text-right">Amount</div>
                <div className="text-right">Total</div>
              </div>
              <div className="overflow-y-auto h-[360px]">
                {orderBook.asks.map((ask: any, index: number) => (
                  <div key={`ask-${index}`} className="grid grid-cols-3 p-2 text-sm border-b border-gray-800 hover:bg-dex-dark/50">
                    <div className="text-red-500">${formatCurrency(ask.price)}</div>
                    <div className="text-right text-white">{ask.amount.toFixed(4)}</div>
                    <div className="text-right text-gray-400">{ask.total.toFixed(4)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Spread */}
            {orderBook.asks.length > 0 && orderBook.bids.length > 0 && (
              <div className="text-center py-2 border-y border-gray-800">
                <div className="text-xs text-gray-400">Spread</div>
                <div className="text-sm text-white">
                  ${formatCurrency(orderBook.asks[0]?.price - orderBook.bids[0]?.price || 0)}
                </div>
              </div>
            )}

            {/* Bids (Buy orders) */}
            <div>
              <div className="grid grid-cols-3 text-xs text-gray-400 p-2 border-b border-gray-800">
                <div>Price (USD)</div>
                <div className="text-right">Amount</div>
                <div className="text-right">Total</div>
              </div>
              <div className="overflow-y-auto h-[360px]">
                {orderBook.bids.map((bid: any, index: number) => (
                  <div key={`bid-${index}`} className="grid grid-cols-3 p-2 text-sm border-b border-gray-800 hover:bg-dex-dark/50">
                    <div className="text-green-500">${formatCurrency(bid.price)}</div>
                    <div className="text-right text-white">{bid.amount.toFixed(4)}</div>
                    <div className="text-right text-gray-400">{bid.total.toFixed(4)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto h-[400px]">
            {recentTrades.map((trade: any, index: number) => (
              <div key={`trade-${index}`} className="flex justify-between items-center p-2 border-b border-gray-800 hover:bg-dex-dark/50">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${trade.type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div className="text-sm text-white">${formatCurrency(trade.price)}</div>
                </div>
                <div className="text-sm text-gray-400">{trade.amount.toFixed(4)}</div>
                <div className="text-xs text-gray-500">
                  {trade.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

OrderbookTab.displayName = 'OrderbookTab';

export default OrderbookTab;
