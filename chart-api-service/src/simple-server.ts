import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 4000;

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`📊 ${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Simple logging
const log = (message: string) => console.log(`[${new Date().toISOString()}] ${message}`);

// Health endpoint
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    },
    timestamp: new Date().toISOString(),
    requestId: 'health_' + Date.now()
  });
});

// Chart data endpoint
app.get('/api/v1/chart/:tokenId/:days', async (req: Request, res: Response) => {
  const { tokenId, days } = req.params;
  const { force_refresh } = req.query;
  const requestId = `chart_${tokenId}_${days}_${Date.now()}`;
  const cacheKey = `${tokenId}_${days}`;

  try {
    // Check cache first (unless force refresh)
    if (force_refresh !== 'true') {
      const cached = cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
        log(`Cache hit for ${tokenId}, ${days} days`);

        res.json({
          success: true,
          data: {
            tokenId,
            symbol: tokenId.toUpperCase(),
            timeframe: days,
            data: cached.data,
            lastUpdated: new Date(cached.timestamp).toISOString(),
            source: 'cache',
            cacheHit: true,
            requestId
          },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }
    }

    log(`Fetching chart data for ${tokenId}, ${days} days`);

    const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/ohlc?vs_currency=usd&days=${days}`;
    const response = await axios.get(url, {
      headers: {
        'x-cg-demo-api-key': process.env.COINGECKO_API_KEY || ''
      },
      timeout: 10000
    });

    const ohlcData = response.data;
    const candlestickData = ohlcData.map((item: number[]) => ({
      time: Math.floor(item[0] / 1000),
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4]
    }));

    // Cache the data
    cache.set(cacheKey, {
      data: candlestickData,
      timestamp: Date.now(),
      ttl: CACHE_TTL
    });

    res.json({
      success: true,
      data: {
        tokenId,
        symbol: tokenId.toUpperCase(),
        timeframe: days,
        data: candlestickData,
        lastUpdated: new Date().toISOString(),
        source: 'api',
        cacheHit: false,
        requestId
      },
      timestamp: new Date().toISOString(),
      requestId
    });

    log(`Successfully served ${candlestickData.length} data points for ${tokenId}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Error fetching data for ${tokenId}: ${errorMessage}`);

    // Try to return cached data even if expired when API fails
    const cached = cache.get(cacheKey);
    if (cached) {
      log(`API failed, returning cached data for ${tokenId}`);

      res.json({
        success: true,
        data: {
          tokenId,
          symbol: tokenId.toUpperCase(),
          timeframe: days,
          data: cached.data,
          lastUpdated: new Date(cached.timestamp).toISOString(),
          source: 'cache',
          cacheHit: true,
          requestId
        },
        timestamp: new Date().toISOString(),
        requestId
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Chart Data Error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
      requestId
    });
  }
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      service: 'Chart API Microservice',
      version: '1.0.0',
      environment: 'development',
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString(),
    requestId: 'root_' + Date.now()
  });
});

// Start server
app.listen(PORT, () => {
  log(`Chart API Microservice started on port ${PORT}`);
  log(`Health check: http://localhost:${PORT}/api/v1/health`);
  log(`Chart endpoint: http://localhost:${PORT}/api/v1/chart/{tokenId}/{days}`);
});
