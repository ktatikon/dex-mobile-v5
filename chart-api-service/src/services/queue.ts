/**
 * REQUEST QUEUE MANAGEMENT SERVICE
 * 
 * Enterprise-level request queue with debouncing, priority handling,
 * and intelligent request deduplication for rapid token switching
 */

const Bull = require('bull');
import { Queue, Job, JobOptions } from 'bull';
import { config } from '../config/environment';
import { log } from '../utils/logger';
import { coinGeckoService } from './coingecko';
import { QueueJob, QueueStats, CandlestickData } from '../types/index';

/**
 * Job data interface
 */
interface ChartJobData {
  tokenId: string;
  days: string;
  forceRefresh: boolean;
  requestId: string;
  priority: number;
  timestamp: number;
}

/**
 * Job result interface
 */
interface ChartJobResult {
  success: boolean;
  data?: CandlestickData[];
  error?: string;
  requestId: string;
  duration: number;
  source: 'api' | 'cache' | 'fallback';
}

/**
 * Request Queue Service
 */
class QueueService {
  private chartQueue!: Queue<ChartJobData>;
  private pendingRequests: Map<string, Promise<ChartJobResult>> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private stats: QueueStats = {
    pending: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
  };

  constructor() {
    this.initializeQueue();
    this.setupEventHandlers();
    this.startStatsMonitoring();
  }

  /**
   * Initialize Bull queue
   */
  private initializeQueue(): void {
    try {
      this.chartQueue = new Bull('chart-data', config.redis.url, {
        redis: {
          password: config.redis.password,
          db: config.redis.db,
        },
        defaultJobOptions: {
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50,      // Keep last 50 failed jobs
          attempts: config.queue.maxRetries,
          backoff: {
            type: 'exponential',
            delay: config.queue.backoffDelay,
          },
        },
      });

      // Process jobs with concurrency control
      this.chartQueue.process(config.queue.concurrency, this.processChartJob.bind(this));

      log.info('Queue service initialized', {
        concurrency: config.queue.concurrency,
        debounceDelay: config.queue.debounceDelay,
      });
    } catch (error) {
      log.error('Failed to initialize queue service', { error: error instanceof Error ? error : new Error(String(error)) });
      throw error;
    }
  }

  /**
   * Setup event handlers for queue monitoring
   */
  private setupEventHandlers(): void {
    this.chartQueue.on('completed', (job: Job<ChartJobData>, result: ChartJobResult) => {
      log.queue('complete', job.id?.toString() || 'unknown', {
        tokenId: job.data.tokenId,
        days: job.data.days,
        duration: result.duration,
        source: result.source,
      });
      this.stats.completed++;
    });

    this.chartQueue.on('failed', (job: Job<ChartJobData>, error: Error) => {
      log.queue('fail', job.id?.toString() || 'unknown', {
        tokenId: job.data.tokenId,
        days: job.data.days,
        error: error,
        attempts: job.attemptsMade,
      });
      this.stats.failed++;
    });

    this.chartQueue.on('active', (job: Job<ChartJobData>) => {
      log.queue('process', job.id?.toString() || 'unknown', {
        tokenId: job.data.tokenId,
        days: job.data.days,
      });
    });

    this.chartQueue.on('stalled', (job: Job<ChartJobData>) => {
      log.warn('Job stalled', {
        jobId: job.id,
        tokenId: job.data.tokenId,
        days: job.data.days,
      });
    });

    this.chartQueue.on('error', (error: Error) => {
      log.error('Queue error', { error });
    });
  }

  /**
   * Add chart data request to queue with debouncing
   */
  async addChartRequest(
    tokenId: string,
    days: string,
    forceRefresh: boolean = false,
    priority: number = 0
  ): Promise<CandlestickData[]> {
    const requestKey = `${tokenId}_${days}`;
    const requestId = `${requestKey}_${Date.now()}`;

    log.queue('add', requestId, {
      tokenId,
      days,
      forceRefresh,
      priority,
    });

    // Check if there's already a pending request for this token/timeframe
    if (this.pendingRequests.has(requestKey) && !forceRefresh) {
      log.info('Request already pending, waiting for existing request', {
        tokenId,
        days,
        requestId,
      });
      
      const existingRequest = this.pendingRequests.get(requestKey)!;
      const result = await existingRequest;
      
      if (result.success && result.data) {
        return result.data;
      }
    }

    // Clear existing debounce timer
    if (this.debounceTimers.has(requestKey)) {
      clearTimeout(this.debounceTimers.get(requestKey)!);
      this.debounceTimers.delete(requestKey);
    }

    // Create debounced request promise
    const requestPromise = new Promise<ChartJobResult>((resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          this.debounceTimers.delete(requestKey);
          
          const jobData: ChartJobData = {
            tokenId,
            days,
            forceRefresh,
            requestId,
            priority,
            timestamp: Date.now(),
          };

          const jobOptions: JobOptions = {
            priority: -priority, // Bull uses negative values for higher priority
            delay: config.queue.delay,
            jobId: requestId, // Prevent duplicate jobs
          };

          const job = await this.chartQueue.add(jobData, jobOptions);
          const result = await job.finished();
          
          resolve(result as ChartJobResult);
        } catch (error) {
          reject(error);
        } finally {
          this.pendingRequests.delete(requestKey);
        }
      }, config.queue.debounceDelay);

      this.debounceTimers.set(requestKey, timer);
    });

    // Store pending request
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || 'Unknown queue processing error');
      }
    } catch (error) {
      log.error('Queue request failed', {
        tokenId,
        days,
        requestId,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  /**
   * Process chart data job
   */
  private async processChartJob(job: Job<ChartJobData>): Promise<ChartJobResult> {
    const { tokenId, days, forceRefresh, requestId } = job.data;
    const startTime = Date.now();

    try {
      log.info('Processing chart job', {
        jobId: job.id,
        tokenId,
        days,
        forceRefresh,
        requestId,
      });

      // Fetch data from CoinGecko service
      const data = await coinGeckoService.fetchOHLCData(tokenId, days, forceRefresh);
      const duration = Date.now() - startTime;

      const result: ChartJobResult = {
        success: true,
        data,
        requestId,
        duration,
        source: 'api', // CoinGecko service handles cache internally
      };

      log.info('Chart job completed successfully', {
        jobId: job.id,
        tokenId,
        days,
        dataPoints: data.length,
        duration,
        requestId,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      log.error('Chart job failed', {
        jobId: job.id,
        tokenId,
        days,
        duration,
        requestId,
        error: error instanceof Error ? error : new Error(errorMessage),
        attempts: job.attemptsMade,
      });

      const result: ChartJobResult = {
        success: false,
        error: errorMessage,
        requestId,
        duration,
        source: 'api',
      };

      return result;
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    try {
      const waiting = await this.chartQueue.getWaiting();
      const active = await this.chartQueue.getActive();
      const completed = await this.chartQueue.getCompleted();
      const failed = await this.chartQueue.getFailed();
      const delayed = await this.chartQueue.getDelayed();

      this.stats = {
        pending: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      };

      return { ...this.stats };
    } catch (error) {
      log.error('Failed to get queue stats', { error: error instanceof Error ? error : new Error(String(error)) });
      return this.stats;
    }
  }

  /**
   * Clear all pending requests for a token
   */
  async clearTokenRequests(tokenId: string): Promise<void> {
    try {
      // Clear debounce timers
      for (const [key, timer] of this.debounceTimers) {
        if (key.startsWith(tokenId)) {
          clearTimeout(timer);
          this.debounceTimers.delete(key);
        }
      }

      // Remove pending requests
      for (const key of this.pendingRequests.keys()) {
        if (key.startsWith(tokenId)) {
          this.pendingRequests.delete(key);
        }
      }

      // Remove jobs from queue
      const jobs = await this.chartQueue.getJobs(['waiting', 'delayed']);
      const tokenJobs = jobs.filter(job => job.data.tokenId === tokenId);
      
      for (const job of tokenJobs) {
        await job.remove();
      }

      log.info('Cleared token requests', {
        tokenId,
        clearedJobs: tokenJobs.length,
      });
    } catch (error) {
      log.error('Failed to clear token requests', { tokenId, error: error instanceof Error ? error : new Error(String(error)) });
    }
  }

  /**
   * Get queue health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    stats: QueueStats;
    pendingRequests: number;
    debounceTimers: number;
  }> {
    try {
      const stats = await this.getStats();
      const totalJobs = stats.pending + stats.active + stats.delayed;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (totalJobs < 10) {
        status = 'healthy';
      } else if (totalJobs < 50) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        stats,
        pendingRequests: this.pendingRequests.size,
        debounceTimers: this.debounceTimers.size,
      };
    } catch (error) {
      log.error('Failed to get queue health status', { error: error instanceof Error ? error : new Error(String(error)) });
      return {
        status: 'unhealthy',
        stats: this.stats,
        pendingRequests: this.pendingRequests.size,
        debounceTimers: this.debounceTimers.size,
      };
    }
  }

  /**
   * Start monitoring queue statistics
   */
  private startStatsMonitoring(): void {
    setInterval(async () => {
      try {
        const stats = await this.getStats();
        const totalActive = stats.pending + stats.active + stats.delayed;
        
        if (totalActive > 0) {
          log.info('Queue monitoring report', {
            ...stats,
            pendingRequests: this.pendingRequests.size,
            debounceTimers: this.debounceTimers.size,
          });
        }
      } catch (error) {
        log.error('Queue monitoring error', { error: error instanceof Error ? error : new Error(String(error)) });
      }
    }, 30000); // Monitor every 30 seconds
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    try {
      // Clear all debounce timers
      for (const timer of this.debounceTimers.values()) {
        clearTimeout(timer);
      }
      this.debounceTimers.clear();

      // Close queue
      await this.chartQueue.close();
      
      log.info('Queue service closed gracefully');
    } catch (error) {
      log.error('Error closing queue service', { error: error instanceof Error ? error : new Error(String(error)) });
    }
  }
}

// Export singleton instance
export const queueService = new QueueService();

// Export class for testing
export { QueueService };
