/**
 * WEBSOCKET REAL-TIME DATA SERVICE
 * 
 * Provides live cryptocurrency data feeds using WebSocket connections
 * to supplement CoinGecko API with real-time price updates
 */

import { Token } from '@/types';

interface WebSocketMessage {
  type: 'price_update' | 'market_cap_update' | 'volume_update';
  symbol: string;
  data: {
    price?: number;
    market_cap?: number;
    volume_24h?: number;
    price_change_24h?: number;
    timestamp: number;
  };
}

interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

/**
 * WebSocket Real-Time Data Service
 * Manages live data feeds from multiple cryptocurrency WebSocket providers
 */
class WebSocketDataService {
  private connections: Map<string, WebSocket> = new Map();
  private subscribers: Set<(tokens: Token[]) => void> = new Set();
  private tokenData: Map<string, Token> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isEnabled = false;

  // Configuration for different WebSocket providers
  private readonly configs: Record<string, WebSocketConfig> = {
    binance: {
      url: 'wss://stream.binance.com:9443/ws/!ticker@arr',
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000
    },
    coinbase: {
      url: 'wss://ws-feed.pro.coinbase.com',
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000
    }
  };

  constructor() {
    this.initialize();
  }

  /**
   * Initialize WebSocket connections
   */
  private async initialize() {
    try {
      console.log('🌐 Initializing WebSocket Data Service...');
      
      // Check if WebSocket is available
      if (typeof WebSocket === 'undefined') {
        console.warn('⚠️ WebSocket not available, falling back to HTTP polling');
        return;
      }

      this.isEnabled = true;
      console.log('✅ WebSocket Data Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket Data Service:', error);
    }
  }

  /**
   * Connect to a WebSocket provider
   */
  private connectToProvider(provider: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const config = this.configs[provider];
        if (!config) {
          console.error(`❌ Unknown WebSocket provider: ${provider}`);
          resolve(false);
          return;
        }

        console.log(`🔌 Connecting to ${provider} WebSocket...`);
        
        const ws = new WebSocket(config.url);
        
        ws.onopen = () => {
          console.log(`✅ Connected to ${provider} WebSocket`);
          this.connections.set(provider, ws);
          this.reconnectAttempts.set(provider, 0);
          
          // Setup heartbeat
          this.setupHeartbeat(provider, ws, config.heartbeatInterval);
          
          // Subscribe to relevant channels
          this.subscribeToChannels(provider, ws);
          
          resolve(true);
        };

        ws.onmessage = (event) => {
          this.handleMessage(provider, event.data);
        };

        ws.onclose = (event) => {
          console.log(`🔌 ${provider} WebSocket closed:`, event.code, event.reason);
          this.handleDisconnection(provider, config);
        };

        ws.onerror = (error) => {
          console.error(`❌ ${provider} WebSocket error:`, error);
          resolve(false);
        };

      } catch (error) {
        console.error(`❌ Failed to connect to ${provider}:`, error);
        resolve(false);
      }
    });
  }

  /**
   * Setup heartbeat to keep connection alive
   */
  private setupHeartbeat(provider: string, ws: WebSocket, interval: number) {
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        // Send ping based on provider
        if (provider === 'binance') {
          ws.send(JSON.stringify({ method: 'ping' }));
        } else if (provider === 'coinbase') {
          ws.send(JSON.stringify({ type: 'heartbeat' }));
        }
      } else {
        clearInterval(heartbeat);
      }
    }, interval);

    this.heartbeatIntervals.set(provider, heartbeat);
  }

  /**
   * Subscribe to relevant data channels
   */
  private subscribeToChannels(provider: string, ws: WebSocket) {
    if (provider === 'binance') {
      // Binance ticker stream provides all symbols
      console.log('📡 Subscribed to Binance ticker stream');
    } else if (provider === 'coinbase') {
      // Subscribe to ticker channel for major cryptocurrencies
      const subscription = {
        type: 'subscribe',
        product_ids: ['BTC-USD', 'ETH-USD', 'ADA-USD', 'DOT-USD', 'SOL-USD'],
        channels: ['ticker']
      };
      ws.send(JSON.stringify(subscription));
      console.log('📡 Subscribed to Coinbase ticker channels');
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(provider: string, data: string) {
    try {
      const message = JSON.parse(data);
      
      if (provider === 'binance') {
        this.handleBinanceMessage(message);
      } else if (provider === 'coinbase') {
        this.handleCoinbaseMessage(message);
      }
    } catch (error) {
      console.error(`❌ Error parsing ${provider} message:`, error);
    }
  }

  /**
   * Handle Binance WebSocket messages
   */
  private handleBinanceMessage(message: any) {
    if (Array.isArray(message)) {
      // Ticker array from Binance
      message.forEach((ticker: any) => {
        if (ticker.s && ticker.c) { // symbol and current price
          const symbol = ticker.s.replace('USDT', '').toUpperCase();
          this.updateTokenData(symbol, {
            price: parseFloat(ticker.c),
            price_change_24h: parseFloat(ticker.P),
            volume_24h: parseFloat(ticker.v),
            timestamp: Date.now()
          });
        }
      });
    }
  }

  /**
   * Handle Coinbase WebSocket messages
   */
  private handleCoinbaseMessage(message: any) {
    if (message.type === 'ticker' && message.product_id && message.price) {
      const symbol = message.product_id.split('-')[0].toUpperCase();
      this.updateTokenData(symbol, {
        price: parseFloat(message.price),
        volume_24h: parseFloat(message.volume_24h),
        timestamp: Date.now()
      });
    }
  }

  /**
   * Update token data and notify subscribers
   */
  private updateTokenData(symbol: string, data: WebSocketMessage['data']) {
    const existingToken = this.tokenData.get(symbol);
    
    if (existingToken) {
      // Update existing token
      const updatedToken: Token = {
        ...existingToken,
        price: data.price ?? existingToken.price,
        priceChange24h: data.price_change_24h ?? existingToken.priceChange24h,
      };
      
      this.tokenData.set(symbol, updatedToken);
    } else {
      // Create new token entry
      const newToken: Token = {
        id: symbol.toLowerCase(),
        symbol: symbol,
        name: symbol,
        logo: `/crypto-icons/${symbol.toLowerCase()}.svg`,
        decimals: 8,
        balance: "0",
        price: data.price,
        priceChange24h: data.price_change_24h,
      };
      
      this.tokenData.set(symbol, newToken);
    }

    // Notify subscribers with updated data
    this.notifySubscribers();
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnection(provider: string, config: WebSocketConfig) {
    this.connections.delete(provider);
    
    // Clear heartbeat
    const heartbeat = this.heartbeatIntervals.get(provider);
    if (heartbeat) {
      clearInterval(heartbeat);
      this.heartbeatIntervals.delete(provider);
    }

    // Attempt reconnection
    const attempts = this.reconnectAttempts.get(provider) || 0;
    if (attempts < config.maxReconnectAttempts) {
      console.log(`🔄 Attempting to reconnect to ${provider} (${attempts + 1}/${config.maxReconnectAttempts})`);
      this.reconnectAttempts.set(provider, attempts + 1);
      
      setTimeout(() => {
        this.connectToProvider(provider);
      }, config.reconnectInterval);
    } else {
      console.error(`❌ Max reconnection attempts reached for ${provider}`);
    }
  }

  /**
   * Notify all subscribers of data updates
   */
  private notifySubscribers() {
    const tokens = Array.from(this.tokenData.values());
    this.subscribers.forEach(callback => {
      try {
        callback(tokens);
      } catch (error) {
        console.error('❌ Error notifying WebSocket subscriber:', error);
      }
    });
  }

  /**
   * Start WebSocket connections
   */
  public async start(): Promise<boolean> {
    if (!this.isEnabled) {
      console.warn('⚠️ WebSocket service not enabled');
      return false;
    }

    console.log('🚀 Starting WebSocket connections...');
    
    // Connect to primary providers
    const binanceConnected = await this.connectToProvider('binance');
    const coinbaseConnected = await this.connectToProvider('coinbase');
    
    const success = binanceConnected || coinbaseConnected;
    
    if (success) {
      console.log('✅ WebSocket service started successfully');
    } else {
      console.error('❌ Failed to start any WebSocket connections');
    }
    
    return success;
  }

  /**
   * Stop all WebSocket connections
   */
  public stop() {
    console.log('🛑 Stopping WebSocket connections...');
    
    this.connections.forEach((ws, provider) => {
      ws.close();
      console.log(`🔌 Closed ${provider} connection`);
    });
    
    this.heartbeatIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    
    this.connections.clear();
    this.heartbeatIntervals.clear();
    this.reconnectAttempts.clear();
    
    console.log('✅ WebSocket service stopped');
  }

  /**
   * Subscribe to real-time data updates
   */
  public subscribe(callback: (tokens: Token[]) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately call with current data if available
    if (this.tokenData.size > 0) {
      callback(Array.from(this.tokenData.values()));
    }
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get current connection status
   */
  public getStatus() {
    const connections = Array.from(this.connections.entries()).map(([provider, ws]) => ({
      provider,
      readyState: ws.readyState,
      connected: ws.readyState === WebSocket.OPEN
    }));
    
    return {
      enabled: this.isEnabled,
      connections,
      tokenCount: this.tokenData.size,
      subscriberCount: this.subscribers.size
    };
  }

  /**
   * Merge WebSocket data with existing token data
   */
  public mergeWithExistingData(existingTokens: Token[]): Token[] {
    return existingTokens.map(token => {
      const wsData = this.tokenData.get(token.symbol);
      if (wsData && wsData.price) {
        return {
          ...token,
          price: wsData.price,
          priceChange24h: wsData.priceChange24h ?? token.priceChange24h,
        };
      }
      return token;
    });
  }
}

// Export singleton instance
export const webSocketDataService = new WebSocketDataService();
