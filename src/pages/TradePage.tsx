
import React, { useState } from 'react';
import { mockTokens, formatCurrency, generateOrderBook, generateRecentTrades } from '@/services/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, TrendingUp, TrendingDown, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TradePage = () => {
  const { toast } = useToast();
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedToken, setSelectedToken] = useState(mockTokens[0]);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [showOrderBook, setShowOrderBook] = useState(true);

  // Generate order book data for the selected token
  const orderBook = generateOrderBook(selectedToken.price || 0);

  // Generate recent trades for the selected token
  const recentTrades = generateRecentTrades(selectedToken.price || 0);

  // Sort tokens by market cap (using price as a proxy in this mock data)
  const sortedByMarketCap = [...mockTokens].sort((a, b) => {
    return (b.price || 0) - (a.price || 0);
  });

  // Sort tokens by price change
  const sortedByPriceChange = [...mockTokens].sort((a, b) => {
    return Math.abs(b.priceChange24h || 0) - Math.abs(a.priceChange24h || 0);
  });

  // Handle token selection
  const handleSelectToken = (token: any) => {
    setSelectedToken(token);
    setPrice(token.price?.toString() || '');
  };

  // Navigate to the appropriate page based on trade type and order type
  const handleSubmitTrade = () => {
    if (tradeType === 'buy') {
      navigate('/buy');
    } else if (tradeType === 'sell') {
      navigate('/sell');
    } else if (orderType === 'limit') {
      navigate('/limit');
    }
  };

  return (
    <div className="pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Market & Trading</h1>
        <div className="bg-dex-dark/50 rounded-lg p-1">
          <Button
            size="sm"
            variant={timeframe === '24h' ? 'default' : 'ghost'}
            className="text-xs"
            onClick={() => setTimeframe('24h')}
          >
            24H
          </Button>
          <Button
            size="sm"
            variant={timeframe === '7d' ? 'default' : 'ghost'}
            className="text-xs"
            onClick={() => setTimeframe('7d')}
          >
            7D
          </Button>
          <Button
            size="sm"
            variant={timeframe === '30d' ? 'default' : 'ghost'}
            className="text-xs"
            onClick={() => setTimeframe('30d')}
          >
            30D
          </Button>
        </div>
      </div>

      {/* Token selector and price info */}
      <Card className="bg-dex-dark/80 border-dex-primary/30 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <Select
                value={selectedToken.id}
                onValueChange={(value) => {
                  const token = mockTokens.find(t => t.id === value);
                  if (token) handleSelectToken(token);
                }}
              >
                <SelectTrigger className="w-[180px] bg-dex-dark border-dex-primary/30 text-white">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent className="bg-dex-dark border-dex-primary/30 text-white">
                  {mockTokens.map(token => (
                    <SelectItem key={token.id} value={token.id} className="text-white hover:bg-dex-primary/20 focus:text-white focus:bg-dex-primary/40">
                      <div className="flex items-center gap-2">
                        <img src={token.logo} alt={token.symbol} className="w-5 h-5 bg-white rounded-full p-0.5" />
                        <span>{token.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div>
                <div className="text-2xl font-bold text-white">
                  ${formatCurrency(selectedToken.price || 0)}
                </div>
                <div className={`text-sm flex items-center ${selectedToken.priceChange24h && selectedToken.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {selectedToken.priceChange24h && selectedToken.priceChange24h > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(selectedToken.priceChange24h || 0).toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={showOrderBook ? 'default' : 'outline'}
                onClick={() => setShowOrderBook(true)}
                className={`text-xs ${showOrderBook ? 'text-white' : 'text-white'}`}
              >
                Order Book
              </Button>
              <Button
                size="sm"
                variant={!showOrderBook ? 'default' : 'outline'}
                onClick={() => setShowOrderBook(false)}
                className={`text-xs ${!showOrderBook ? 'text-white' : 'text-white'}`}
              >
                Recent Trades
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Trading interface - Left column */}
        <div className="lg:col-span-1">
          <Card className="bg-dex-dark/80 border-dex-primary/30 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">Place Order</CardTitle>
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
                      navigate('/buy');
                    }}
                  >
                    Buy
                  </Button>
                  <Button
                    variant={tradeType === 'sell' ? 'default' : 'outline'}
                    className={tradeType === 'sell' ? 'bg-red-800 hover:bg-red-900 text-white' : 'text-white border-dex-primary/30 bg-dex-dark'}
                    onClick={() => {
                      setTradeType('sell');
                      navigate('/sell');
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
                    onClick={() => setOrderType('market')}
                    size="sm"
                  >
                    Market
                  </Button>
                  <Button
                    variant={orderType === 'limit' ? 'default' : 'outline'}
                    className={orderType === 'limit' ? 'bg-dex-dark text-white' : 'text-white border-dex-primary/30 bg-dex-dark'}
                    onClick={() => {
                      setOrderType('limit');
                      navigate('/limit');
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
                      {selectedToken.symbol}
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
                        ? (parseFloat(amount) * (selectedToken.price || 0)).toFixed(2)
                        : (parseFloat(amount || '0') * parseFloat(price || '0')).toFixed(2))}
                    </span>
                  </div>
                </div>

                {/* Submit button */}
                <Button
                  className={`w-full ${tradeType === 'buy' ? 'bg-green-800 hover:bg-green-900' : 'bg-red-800 hover:bg-red-900'} text-white`}
                  onClick={handleSubmitTrade}
                >
                  {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedToken.symbol}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order book or recent trades - Middle column */}
        <div className="lg:col-span-2">
          <Card className="bg-dex-dark/80 border-dex-primary/30 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">
                {showOrderBook ? 'Order Book' : 'Recent Trades'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {showOrderBook ? (
                <div className="grid grid-cols-1 md:grid-cols-2 h-[400px] overflow-hidden">
                  {/* Asks (Sell orders) */}
                  <div className="border-r border-dex-primary/20">
                    <div className="grid grid-cols-3 text-xs text-gray-400 p-2 border-b border-gray-800">
                      <div>Price (USD)</div>
                      <div className="text-right">Amount</div>
                      <div className="text-right">Total</div>
                    </div>
                    <div className="overflow-y-auto h-[360px]">
                      {orderBook.asks.map((ask, index) => (
                        <div key={`ask-${index}`} className="grid grid-cols-3 p-2 text-sm border-b border-gray-800 hover:bg-dex-dark/50">
                          <div className="text-red-500">${formatCurrency(ask.price)}</div>
                          <div className="text-right text-white">{ask.amount.toFixed(4)}</div>
                          <div className="text-right text-gray-400">{ask.total.toFixed(4)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bids (Buy orders) */}
                  <div>
                    <div className="grid grid-cols-3 text-xs text-gray-400 p-2 border-b border-gray-800">
                      <div>Price (USD)</div>
                      <div className="text-right">Amount</div>
                      <div className="text-right">Total</div>
                    </div>
                    <div className="overflow-y-auto h-[360px]">
                      {orderBook.bids.map((bid, index) => (
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
                <div className="h-[400px] overflow-y-auto">
                  <div className="grid grid-cols-4 text-xs text-gray-400 p-2 border-b border-gray-800">
                    <div>Price (USD)</div>
                    <div className="text-right">Amount</div>
                    <div className="text-right">Total</div>
                    <div className="text-right">Time</div>
                  </div>
                  {recentTrades.map((trade) => (
                    <div key={trade.id} className="grid grid-cols-4 p-2 text-sm border-b border-gray-800 hover:bg-dex-dark/50">
                      <div className={trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}>
                        ${formatCurrency(trade.price)}
                      </div>
                      <div className="text-right text-white">{trade.amount.toFixed(4)}</div>
                      <div className="text-right text-gray-400">${formatCurrency(trade.value)}</div>
                      <div className="text-right text-gray-400">
                        {trade.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-dex-dark/50 border border-dex-primary/30">
          <TabsTrigger value="all" className="text-white data-[state=active]:bg-dex-primary/50 data-[state=active]:text-white">All Assets</TabsTrigger>
          <TabsTrigger value="gainers" className="text-white data-[state=active]:bg-dex-primary/50 data-[state=active]:text-white">Top Gainers</TabsTrigger>
          <TabsTrigger value="losers" className="text-white data-[state=active]:bg-dex-primary/50 data-[state=active]:text-white">Top Losers</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card className="bg-dex-dark/80 border-dex-primary/30">
            <CardContent className="p-0">
              <div className="grid grid-cols-12 text-xs text-gray-400 p-3 border-b border-gray-800">
                <div className="col-span-4">Asset</div>
                <div className="col-span-3 text-right">Price</div>
                <div className="col-span-3 text-right">Change</div>
                <div className="col-span-2 text-right">Trade</div>
              </div>

              {sortedByMarketCap.map(token => (
                <div key={token.id} className="grid grid-cols-12 p-3 border-b border-gray-800 hover:bg-dex-dark/50">
                  <div className="col-span-4 flex items-center gap-2">
                    <img src={token.logo} alt={token.name} className="w-6 h-6 bg-white rounded-full p-0.5" />
                    <div>
                      <div className="font-medium text-white">{token.symbol}</div>
                      <div className="text-xs text-gray-400">{token.name}</div>
                    </div>
                  </div>
                  <div className="col-span-3 text-right text-white">
                    ${formatCurrency(token.price || 0)}
                  </div>
                  <div className={`col-span-3 text-right flex items-center justify-end gap-1 ${token.priceChange24h && token.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {token.priceChange24h && token.priceChange24h > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(token.priceChange24h || 0).toFixed(2)}%
                  </div>
                  <div className="col-span-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-dex-dark hover:bg-dex-dark/80 border-dex-primary/30 text-white"
                      onClick={() => handleSelectToken(token)}
                    >
                      Trade
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gainers" className="space-y-4">
          <Card className="bg-dex-dark/80 border-dex-primary/30">
            <CardContent className="p-0">
              <div className="grid grid-cols-12 text-xs text-gray-400 p-3 border-b border-gray-800">
                <div className="col-span-4">Asset</div>
                <div className="col-span-3 text-right">Price</div>
                <div className="col-span-3 text-right">Change</div>
                <div className="col-span-2 text-right">Trade</div>
              </div>

              {sortedByPriceChange
                .filter(token => (token.priceChange24h || 0) > 0)
                .map(token => (
                <div key={token.id} className="grid grid-cols-12 p-3 border-b border-gray-800 hover:bg-dex-dark/50">
                  <div className="col-span-4 flex items-center gap-2">
                    <img src={token.logo} alt={token.name} className="w-6 h-6 bg-white rounded-full p-0.5" />
                    <div>
                      <div className="font-medium text-white">{token.symbol}</div>
                      <div className="text-xs text-gray-400">{token.name}</div>
                    </div>
                  </div>
                  <div className="col-span-3 text-right text-white">
                    ${formatCurrency(token.price || 0)}
                  </div>
                  <div className="col-span-3 text-right flex items-center justify-end gap-1 text-green-500">
                    <TrendingUp size={14} />
                    {Math.abs(token.priceChange24h || 0).toFixed(2)}%
                  </div>
                  <div className="col-span-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-dex-dark hover:bg-dex-dark/80 border-dex-primary/30 text-white"
                      onClick={() => handleSelectToken(token)}
                    >
                      Trade
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="losers" className="space-y-4">
          <Card className="bg-dex-dark/80 border-dex-primary/30">
            <CardContent className="p-0">
              <div className="grid grid-cols-12 text-xs text-gray-400 p-3 border-b border-gray-800">
                <div className="col-span-4">Asset</div>
                <div className="col-span-3 text-right">Price</div>
                <div className="col-span-3 text-right">Change</div>
                <div className="col-span-2 text-right">Trade</div>
              </div>

              {sortedByPriceChange
                .filter(token => (token.priceChange24h || 0) < 0)
                .map(token => (
                <div key={token.id} className="grid grid-cols-12 p-3 border-b border-gray-800 hover:bg-dex-dark/50">
                  <div className="col-span-4 flex items-center gap-2">
                    <img src={token.logo} alt={token.name} className="w-6 h-6 bg-white rounded-full p-0.5" />
                    <div>
                      <div className="font-medium text-white">{token.symbol}</div>
                      <div className="text-xs text-gray-400">{token.name}</div>
                    </div>
                  </div>
                  <div className="col-span-3 text-right text-white">
                    ${formatCurrency(token.price || 0)}
                  </div>
                  <div className="col-span-3 text-right flex items-center justify-end gap-1 text-red-500">
                    <TrendingDown size={14} />
                    {Math.abs(token.priceChange24h || 0).toFixed(2)}%
                  </div>
                  <div className="col-span-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-dex-dark hover:bg-dex-dark/80 border-dex-primary/30 text-white"
                      onClick={() => handleSelectToken(token)}
                    >
                      Trade
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TradePage;
