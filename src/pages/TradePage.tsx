
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/services/realTimeData';
import { realTimeOrderBookService } from '@/services/realTimeOrderBook';
import { Token } from '@/types';
import { useMarketData } from '@/hooks/useMarketData';
import { MarketFilterType, AltFilterType } from '@/types/api';
import ErrorBoundary from '@/components/ErrorBoundary';
import TokenIcon from '@/components/TokenIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { TrendingUp, TrendingDown, ChevronDown, RefreshCw, Activity, DollarSign, BarChart3 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

// Wrapper component with error boundary
const TradePageWithErrorBoundary = () => {
  return (
    <ErrorBoundary>
      <TradePage />
    </ErrorBoundary>
  );
};

// Main component
const TradePage = () => {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [showOrderBook, setShowOrderBook] = useState(true);

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

  // Set default selected token (first token when data is loaded)
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

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

  // Generate real-time order book data for the selected token
  const orderBook = selectedToken
    ? realTimeOrderBookService.generateRealTimeOrderBook(selectedToken.id, selectedToken.price || 0)
    : { bids: [], asks: [] };

  // Generate real-time recent trades for the selected token
  const recentTrades = selectedToken
    ? realTimeOrderBookService.generateRealTimeRecentTrades(selectedToken.id, selectedToken.price || 0)
    : [];

  // Format the last updated time
  const formattedLastUpdated = lastUpdated
    ? new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        day: 'numeric',
        month: 'short'
      }).format(lastUpdated)
    : 'Never';

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

  // Handle manual refresh of market data
  const handleRefresh = () => {
    refreshData();
  };

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
        <div className="flex items-center gap-4">
          <div className="text-xs text-dex-text-secondary">
            Last updated: {formattedLastUpdated}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-8 px-2 bg-dex-tertiary border-dex-secondary"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
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
      </div>



      {/* Token selector and price info */}
      <Card className="bg-dex-dark/80 border-dex-primary/30 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Enhanced Token Display */}
              <div className="flex items-center gap-3">
                <TokenIcon token={selectedToken} size="lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white">{selectedToken?.symbol}</span>
                    <span className="text-sm text-gray-400">{selectedToken?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <BarChart3 size={12} />
                    <span>Market Cap: ${formatCurrency((selectedToken?.price || 0) * 1000000)}</span>
                  </div>
                </div>
              </div>

              {/* Price Information */}
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-2xl font-bold text-white">
                    ${formatCurrency(selectedToken?.price || 0)}
                  </div>
                  <div className={`text-sm flex items-center gap-1 ${selectedToken?.priceChange24h && selectedToken.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedToken?.priceChange24h && selectedToken.priceChange24h > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {selectedToken?.priceChange24h && selectedToken.priceChange24h > 0 ? '+' : ''}{(selectedToken?.priceChange24h || 0).toFixed(2)}%
                    <span className="text-gray-400 ml-1">24h</span>
                  </div>
                </div>

                {/* Token Selector Dropdown */}
                <Select
                  value={selectedToken?.id || ''}
                  onValueChange={(value) => {
                    const token = tokens.find(t => t.id === value);
                    if (token) handleSelectToken(token);
                  }}
                >
                  <SelectTrigger className="w-[200px] bg-dex-dark border-dex-primary/30 text-white">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} />
                      <span>Change Token</span>
                    </div>
                    <ChevronDown size={16} />
                  </SelectTrigger>
                  <SelectContent className="bg-dex-dark border-dex-primary/30 text-white max-h-[300px]">
                    {tokens.map(token => (
                      <SelectItem key={token.id} value={token.id} className="text-white hover:bg-dex-primary/20 focus:text-white focus:bg-dex-primary/40">
                        <div className="flex items-center gap-3 w-full">
                          <TokenIcon token={token} size="xs" />
                          <div className="flex flex-col flex-1">
                            <span className="font-medium">{token.symbol}</span>
                            <span className="text-xs text-gray-400">{token.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">${formatCurrency(token.price || 0)}</div>
                            <div className={`text-xs ${(token.priceChange24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {(token.priceChange24h || 0) >= 0 ? '+' : ''}{(token.priceChange24h || 0).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  disabled={!amount || parseFloat(amount) <= 0 || (orderType === 'limit' && (!price || parseFloat(price) <= 0))}
                >
                  <div className="flex items-center justify-center gap-2">
                    {tradeType === 'buy' ? (
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order book or recent trades - Middle column */}
        <div className="lg:col-span-2">
          <Card className="bg-dex-dark/80 border-dex-primary/30 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">
                  {showOrderBook ? 'Order Book' : 'Recent Trades'}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-dex-text-secondary">
                  <Activity size={12} className="text-green-500" />
                  <span>Live Data</span>
                </div>
              </div>
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

      <Tabs value={filter} onValueChange={(value) => setFilter(value as MarketFilterType)} className="w-full">
        <TabsList className="grid w-full grid-cols-7 mb-6 bg-dex-dark/50 border border-dex-primary/30">
          <TabsTrigger
            value="all"
            className="text-white text-xs h-11 min-h-[44px] py-2 px-1 data-[state=active]:bg-dex-primary data-[state=active]:text-white"
          >
            All Assets
          </TabsTrigger>
          <TabsTrigger
            value="gainers"
            className="text-white text-xs h-11 min-h-[44px] py-2 px-1 data-[state=active]:bg-dex-primary data-[state=active]:text-white"
          >
            Top Gainers
          </TabsTrigger>
          <TabsTrigger
            value="losers"
            className="text-white text-xs h-11 min-h-[44px] py-2 px-1 data-[state=active]:bg-dex-primary data-[state=active]:text-white"
          >
            Top Losers
          </TabsTrigger>
          <TabsTrigger
            value="inr"
            className="text-white text-xs h-11 min-h-[44px] py-2 px-1 data-[state=active]:bg-dex-primary data-[state=active]:text-white"
          >
            INR
          </TabsTrigger>
          <TabsTrigger
            value="usdt"
            className="text-white text-xs h-11 min-h-[44px] py-2 px-1 data-[state=active]:bg-dex-primary data-[state=active]:text-white"
          >
            USDT
          </TabsTrigger>
          <TabsTrigger
            value="btc"
            className="text-white text-xs h-11 min-h-[44px] py-2 px-1 data-[state=active]:bg-dex-primary data-[state=active]:text-white"
          >
            BTC
          </TabsTrigger>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <TabsTrigger
                value="alts"
                className="text-white text-xs h-11 min-h-[44px] py-2 px-1 data-[state=active]:bg-dex-primary data-[state=active]:text-white flex items-center gap-1"
              >
                ALTs <ChevronDown className="h-3 w-3 ml-0.5" />
              </TabsTrigger>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="bg-dex-dark border-dex-secondary/30 text-white rounded-lg shadow-lg min-w-[180px]"
              align="center"
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-white font-semibold px-4 py-3 sticky top-0 bg-dex-dark z-10">
                Filter ALTs
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-dex-secondary/20" />
              <DropdownMenuRadioGroup value={altFilter} onValueChange={(value) => setAltFilter(value as AltFilterType)}>
                <DropdownMenuRadioItem
                  value="all"
                  className="text-white h-11 min-h-[44px] py-2 px-4 hover:bg-dex-primary/10 focus:bg-dex-primary/10 cursor-pointer"
                >
                  All ALTs
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="usdc"
                  className="text-white h-11 min-h-[44px] py-2 px-4 hover:bg-dex-primary/10 focus:bg-dex-primary/10 cursor-pointer"
                >
                  USDC
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="bnb"
                  className="text-white h-11 min-h-[44px] py-2 px-4 hover:bg-dex-primary/10 focus:bg-dex-primary/10 cursor-pointer"
                >
                  BNB
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="eth"
                  className="text-white h-11 min-h-[44px] py-2 px-4 hover:bg-dex-primary/10 focus:bg-dex-primary/10 cursor-pointer"
                >
                  ETH
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="xrp"
                  className="text-white h-11 min-h-[44px] py-2 px-4 hover:bg-dex-primary/10 focus:bg-dex-primary/10 cursor-pointer"
                >
                  XRP
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="dai"
                  className="text-white h-11 min-h-[44px] py-2 px-4 hover:bg-dex-primary/10 focus:bg-dex-primary/10 cursor-pointer"
                >
                  DAI
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="tusd"
                  className="text-white h-11 min-h-[44px] py-2 px-4 hover:bg-dex-primary/10 focus:bg-dex-primary/10 cursor-pointer"
                >
                  TUSD
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="trx"
                  className="text-white h-11 min-h-[44px] py-2 px-4 hover:bg-dex-primary/10 focus:bg-dex-primary/10 cursor-pointer"
                >
                  TRX
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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

              {loading && tokens.length === 0 ? (
                <div className="p-6 text-center text-dex-text-secondary">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading market data...
                </div>
              ) : error && tokens.length === 0 ? (
                <div className="p-6 text-center text-dex-negative">
                  <div className="mb-2">Failed to load market data</div>
                  <Button
                    size="sm"
                    onClick={handleRefresh}
                    className="bg-dex-primary text-white"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                sortedByMarketCap.map(token => (
                  <div key={token.id} className="grid grid-cols-12 p-3 border-b border-gray-800 hover:bg-dex-dark/50 cursor-pointer transition-colors" onClick={() => handleSelectToken(token)}>
                    <div className="col-span-4 flex items-center gap-3">
                      <TokenIcon token={token} size="sm" />
                      <div>
                        <div className="font-medium text-white">{token.symbol}</div>
                        <div className="text-xs text-gray-400">{token.name}</div>
                      </div>
                    </div>
                    <div className="col-span-3 text-right text-white font-medium">
                      ${formatCurrency(token.price || 0)}
                    </div>
                    <div className={`col-span-3 text-right flex items-center justify-end gap-1 font-medium ${token.priceChange24h && token.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {token.priceChange24h && token.priceChange24h > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {token.priceChange24h && token.priceChange24h > 0 ? '+' : ''}{(token.priceChange24h || 0).toFixed(2)}%
                    </div>
                    <div className="col-span-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs bg-dex-primary/10 hover:bg-dex-primary/20 border-dex-primary/30 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectToken(token);
                        }}
                      >
                        Trade
                      </Button>
                    </div>
                  </div>
                ))
              )}
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

              {loading && tokens.length === 0 ? (
                <div className="p-6 text-center text-dex-text-secondary">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading market data...
                </div>
              ) : error && tokens.length === 0 ? (
                <div className="p-6 text-center text-dex-negative">
                  <div className="mb-2">Failed to load market data</div>
                  <Button
                    size="sm"
                    onClick={handleRefresh}
                    className="bg-dex-primary text-white"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                sortedByPriceChange
                  .filter(token => (token.priceChange24h || 0) > 0)
                  .slice(0, 20) // Show top 20 gainers
                  .map(token => (
                  <div key={token.id} className="grid grid-cols-12 p-3 border-b border-gray-800 hover:bg-dex-dark/50 cursor-pointer transition-colors" onClick={() => handleSelectToken(token)}>
                    <div className="col-span-4 flex items-center gap-3">
                      <TokenIcon token={token} size="sm" />
                      <div>
                        <div className="font-medium text-white">{token.symbol}</div>
                        <div className="text-xs text-gray-400">{token.name}</div>
                      </div>
                    </div>
                    <div className="col-span-3 text-right text-white font-medium">
                      ${formatCurrency(token.price || 0)}
                    </div>
                    <div className="col-span-3 text-right flex items-center justify-end gap-1 text-green-500 font-medium">
                      <TrendingUp size={14} />
                      +{(token.priceChange24h || 0).toFixed(2)}%
                    </div>
                    <div className="col-span-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectToken(token);
                        }}
                      >
                        Trade
                      </Button>
                    </div>
                  </div>
                ))
              )}
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

              {loading && tokens.length === 0 ? (
                <div className="p-6 text-center text-dex-text-secondary">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Loading market data...
                </div>
              ) : error && tokens.length === 0 ? (
                <div className="p-6 text-center text-dex-negative">
                  <div className="mb-2">Failed to load market data</div>
                  <Button
                    size="sm"
                    onClick={handleRefresh}
                    className="bg-dex-primary text-white"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                sortedByPriceChange
                  .filter(token => (token.priceChange24h || 0) < 0)
                  .slice(0, 20) // Show top 20 losers
                  .map(token => (
                  <div key={token.id} className="grid grid-cols-12 p-3 border-b border-gray-800 hover:bg-dex-dark/50 cursor-pointer transition-colors" onClick={() => handleSelectToken(token)}>
                    <div className="col-span-4 flex items-center gap-3">
                      <TokenIcon token={token} size="sm" />
                      <div>
                        <div className="font-medium text-white">{token.symbol}</div>
                        <div className="text-xs text-gray-400">{token.name}</div>
                      </div>
                    </div>
                    <div className="col-span-3 text-right text-white font-medium">
                      ${formatCurrency(token.price || 0)}
                    </div>
                    <div className="col-span-3 text-right flex items-center justify-end gap-1 text-red-500 font-medium">
                      <TrendingDown size={14} />
                      {(token.priceChange24h || 0).toFixed(2)}%
                    </div>
                    <div className="col-span-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectToken(token);
                        }}
                      >
                        Trade
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inr" className="space-y-4">
          <Card className="bg-dex-dark/80 border-dex-primary/30">
            <CardContent className="p-0">
              <div className="grid grid-cols-12 text-xs text-gray-400 p-3 border-b border-gray-800">
                <div className="col-span-4">Asset</div>
                <div className="col-span-3 text-right">Price</div>
                <div className="col-span-3 text-right">Change</div>
                <div className="col-span-2 text-right">Trade</div>
              </div>

              {/* Filter tokens that can be traded with INR (show top 10 by market cap) */}
              {sortedByMarketCap.slice(0, 10).map(token => (
                <div key={token.id} className="grid grid-cols-12 p-3 border-b border-gray-800 hover:bg-dex-dark/50 cursor-pointer transition-colors" onClick={() => handleSelectToken(token)}>
                  <div className="col-span-4 flex items-center gap-3">
                    <TokenIcon token={token} size="sm" />
                    <div>
                      <div className="font-medium text-white">{token.symbol}/INR</div>
                      <div className="text-xs text-gray-400">{token.name}</div>
                    </div>
                  </div>
                  <div className="col-span-3 text-right text-white font-medium">
                    ₹{formatCurrency(token.price ? token.price * 83.5 : 0)} {/* Approximate INR conversion */}
                  </div>
                  <div className={`col-span-3 text-right flex items-center justify-end gap-1 font-medium ${token.priceChange24h && token.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {token.priceChange24h && token.priceChange24h > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {token.priceChange24h && token.priceChange24h > 0 ? '+' : ''}{(token.priceChange24h || 0).toFixed(2)}%
                  </div>
                  <div className="col-span-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectToken(token);
                      }}
                    >
                      Trade
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usdt" className="space-y-4">
          <Card className="bg-dex-dark/80 border-dex-primary/30">
            <CardContent className="p-0">
              <div className="grid grid-cols-12 text-xs text-gray-400 p-3 border-b border-gray-800">
                <div className="col-span-4">Asset</div>
                <div className="col-span-3 text-right">Price</div>
                <div className="col-span-3 text-right">Change</div>
                <div className="col-span-2 text-right">Trade</div>
              </div>

              {/* Filter tokens that can be paired with USDT (excluding USDT itself) */}
              {sortedByMarketCap
                .filter(token => token.symbol !== 'USDT')
                .slice(0, 50) // Show top 50 USDT pairs
                .map(token => (
                <div key={token.id} className="grid grid-cols-12 p-3 border-b border-gray-800 hover:bg-dex-dark/50 cursor-pointer transition-colors" onClick={() => handleSelectToken(token)}>
                  <div className="col-span-4 flex items-center gap-3">
                    <TokenIcon token={token} size="sm" />
                    <div>
                      <div className="font-medium text-white">{token.symbol}/USDT</div>
                      <div className="text-xs text-gray-400">{token.name}</div>
                    </div>
                  </div>
                  <div className="col-span-3 text-right text-white font-medium">
                    ${formatCurrency(token.price || 0)}
                  </div>
                  <div className={`col-span-3 text-right flex items-center justify-end gap-1 font-medium ${token.priceChange24h && token.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {token.priceChange24h && token.priceChange24h > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {token.priceChange24h && token.priceChange24h > 0 ? '+' : ''}{(token.priceChange24h || 0).toFixed(2)}%
                  </div>
                  <div className="col-span-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectToken(token);
                      }}
                    >
                      Trade
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="btc" className="space-y-4">
          <Card className="bg-dex-dark/80 border-dex-primary/30">
            <CardContent className="p-0">
              <div className="grid grid-cols-12 text-xs text-gray-400 p-3 border-b border-gray-800">
                <div className="col-span-4">Asset</div>
                <div className="col-span-3 text-right">Price</div>
                <div className="col-span-3 text-right">Change</div>
                <div className="col-span-2 text-right">Trade</div>
              </div>

              {/* Filter tokens that can be paired with BTC (excluding BTC itself) */}
              {sortedByMarketCap
                .filter(token => token.symbol !== 'BTC')
                .slice(0, 30) // Show top 30 BTC pairs
                .map(token => {
                  // Get BTC price from the tokens list for accurate conversion
                  const btcToken = sortedByMarketCap.find(t => t.symbol === 'BTC');
                  const btcPrice = btcToken?.price || 56231.42; // Fallback to approximate price

                  return (
                    <div key={token.id} className="grid grid-cols-12 p-3 border-b border-gray-800 hover:bg-dex-dark/50 cursor-pointer transition-colors" onClick={() => handleSelectToken(token)}>
                      <div className="col-span-4 flex items-center gap-3">
                        <TokenIcon token={token} size="sm" />
                        <div>
                          <div className="font-medium text-white">{token.symbol}/BTC</div>
                          <div className="text-xs text-gray-400">{token.name}</div>
                        </div>
                      </div>
                      <div className="col-span-3 text-right text-white font-medium">
                        {formatCurrency((token.price || 0) / btcPrice, 8)} BTC
                      </div>
                      <div className={`col-span-3 text-right flex items-center justify-end gap-1 font-medium ${token.priceChange24h && token.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {token.priceChange24h && token.priceChange24h > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {token.priceChange24h && token.priceChange24h > 0 ? '+' : ''}{(token.priceChange24h || 0).toFixed(2)}%
                      </div>
                      <div className="col-span-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectToken(token);
                          }}
                        >
                          Trade
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alts" className="space-y-4">
          <Card className="bg-dex-dark/80 border-dex-primary/30">
            <CardContent className="p-0">
              <div className="grid grid-cols-12 text-xs text-gray-400 p-3 border-b border-gray-800">
                <div className="col-span-4">Asset</div>
                <div className="col-span-3 text-right">Price</div>
                <div className="col-span-3 text-right">Change</div>
                <div className="col-span-2 text-right">Trade</div>
              </div>

              {/* Enhanced altcoin filtering with comprehensive exclusions */}
              {sortedByMarketCap
                .filter(token => {
                  // Enhanced altcoin filter: exclude major coins and stablecoins
                  const majorCoins = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'AVAX', 'MATIC', 'LINK'];
                  const stablecoins = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDD', 'FRAX', 'LUSD'];
                  const wrappedTokens = ['WBTC', 'WETH', 'WBNB'];
                  const excludedTokens = [...majorCoins, ...stablecoins, ...wrappedTokens];

                  const isAltcoin = !excludedTokens.includes(token.symbol) &&
                                   !token.symbol.includes('USD') && // Exclude other USD-pegged tokens
                                   !token.symbol.startsWith('W'); // Exclude other wrapped tokens

                  // Apply additional filters based on selected option
                  if (altFilter === 'all') {
                    return isAltcoin;
                  } else if (altFilter === 'usdc') {
                    return token.symbol !== 'USDC'; // Show trading pairs with USDC
                  } else if (altFilter === 'bnb') {
                    return token.symbol !== 'BNB'; // Show trading pairs with BNB
                  } else if (altFilter === 'eth') {
                    return token.symbol !== 'ETH'; // Show trading pairs with ETH
                  } else if (altFilter === 'xrp') {
                    return token.symbol !== 'XRP'; // Show trading pairs with XRP
                  } else if (altFilter === 'dai') {
                    return token.symbol !== 'DAI'; // Show trading pairs with DAI
                  } else if (altFilter === 'tusd') {
                    return token.symbol !== 'TUSD'; // Show trading pairs with TUSD
                  } else if (altFilter === 'trx') {
                    return token.symbol !== 'TRX'; // Show trading pairs with TRX
                  }

                  return isAltcoin;
                })
                .slice(0, 50) // Show top 50 altcoins
                .map(token => {
                  // Determine if we need to show trading pair format
                  const showAsPair = altFilter !== 'all';
                  const pairSymbol = showAsPair ? altFilter.toUpperCase() : '';

                  return (
                    <div key={token.id} className="grid grid-cols-12 p-3 border-b border-gray-800 hover:bg-dex-dark/50 cursor-pointer transition-colors" onClick={() => handleSelectToken(token)}>
                      <div className="col-span-4 flex items-center gap-3">
                        <TokenIcon token={token} size="sm" />
                        <div>
                          <div className="font-medium text-white">
                            {showAsPair ? `${token.symbol}/${pairSymbol}` : token.symbol}
                          </div>
                          <div className="text-xs text-gray-400">{token.name}</div>
                        </div>
                      </div>
                      <div className="col-span-3 text-right text-white font-medium">
                        {showAsPair && pairSymbol === 'BNB' ? (
                          `${formatCurrency((token.price || 0) / 304.12, 6)} BNB`
                        ) : showAsPair && pairSymbol === 'ETH' ? (
                          `${formatCurrency((token.price || 0) / 2845.23, 6)} ETH`
                        ) : showAsPair && pairSymbol === 'USDC' ? (
                          `${formatCurrency(token.price || 0)} USDC`
                        ) : (
                          `$${formatCurrency(token.price || 0)}`
                        )}
                      </div>
                      <div className={`col-span-3 text-right flex items-center justify-end gap-1 font-medium ${token.priceChange24h && token.priceChange24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {token.priceChange24h && token.priceChange24h > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {token.priceChange24h && token.priceChange24h > 0 ? '+' : ''}{(token.priceChange24h || 0).toFixed(2)}%
                      </div>
                      <div className="col-span-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectToken(token);
                          }}
                        >
                          Trade
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Export the wrapped component
export default TradePageWithErrorBoundary;
