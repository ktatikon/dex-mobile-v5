/**
 * CHART DATA ROUTES
 *
 * RESTful API endpoints for chart data
 */

import { Router, Request, Response } from 'express';
import { queueService } from '../services/queue';
import { log } from '../utils/logger';
import { ApiResponse, ChartDataResponse } from '../types/index';

const router = Router();

/**
 * GET /api/v1/chart/status
 * Status endpoint for frontend integration
 */
router.get('/status', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ONLINE',
    timestamp: Date.now(),
    uptime: process.uptime(),
    version: '1.0.0',
    microservice: 'chart-api'
  });
});

/**
 * GET /api/v1/chart/:tokenId/:days
 * Fetch chart data for a specific token and timeframe
 */
router.get('/:tokenId/:days', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { tokenId, days } = req.params;
  const { force_refresh } = req.query;
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    log.info('Chart data request received', {
      tokenId,
      days,
      forceRefresh: force_refresh,
      requestId,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    // Add request to queue
    const chartData = await queueService.addChartRequest(
      tokenId,
      days,
      force_refresh === 'true',
      0
    );

    const duration = Date.now() - startTime;

    // Prepare response
    const response: ApiResponse<ChartDataResponse> = {
      success: true,
      data: {
        tokenId,
        symbol: tokenId.toUpperCase(),
        timeframe: days,
        data: chartData,
        lastUpdated: new Date().toISOString(),
        source: 'api' as const,
        cacheHit: false,
        requestId,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };

    log.info('Chart data request completed', {
      tokenId,
      days,
      dataPoints: chartData.length,
      duration,
      requestId,
    });

    res.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    log.error('Chart data request failed', {
      tokenId,
      days,
      duration,
      requestId,
      error: error instanceof Error ? error : new Error(errorMessage),
    });

    const response: ApiResponse = {
      success: false,
      error: 'Chart Data Error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
      requestId,
    };

    res.status(500).json(response);
  }
});

export default router;
