/**
 * CIRCUIT BREAKER SERVICE
 * 
 * Enterprise-level circuit breaker implementation for API failure recovery
 * with exponential backoff and intelligent health monitoring
 */

import { config } from '../config/environment';
import { log } from '../utils/logger';
import { CircuitBreakerState, CircuitBreakerConfig } from '../types/index';

/**
 * Circuit Breaker States
 */
enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

/**
 * Circuit Breaker Service
 */
class CircuitBreakerService {
  private states: Map<string, CircuitBreakerState> = new Map();
  private config: CircuitBreakerConfig;

  constructor(circuitConfig?: CircuitBreakerConfig) {
    this.config = circuitConfig || config.circuitBreaker;
    this.startMonitoring();
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    serviceId: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const state = this.getState(serviceId);
    
    // Check if circuit is open
    if (this.isOpen(state)) {
      if (this.shouldAttemptReset(state)) {
        // Transition to half-open
        this.transitionToHalfOpen(serviceId, state);
      } else {
        // Circuit is open, use fallback or throw error
        if (fallback) {
          log.circuitBreaker('open', serviceId, { 
            action: 'fallback_used',
            failures: state.failures 
          });
          return await fallback();
        } else {
          throw new Error(`Circuit breaker is open for service: ${serviceId}`);
        }
      }
    }

    // Execute the operation
    try {
      const result = await operation();
      this.recordSuccess(serviceId);
      return result;
    } catch (error) {
      this.recordFailure(serviceId, error as Error);
      
      // If we have a fallback and circuit just opened, use it
      if (fallback && this.isOpen(this.getState(serviceId))) {
        log.circuitBreaker('open', serviceId, {
          action: 'fallback_after_failure',
          error: error instanceof Error ? error : new Error(String(error))
        });
        return await fallback();
      }
      
      throw error;
    }
  }

  /**
   * Record successful operation
   */
  recordSuccess(serviceId: string): void {
    const state = this.getState(serviceId);
    
    if (state.isOpen) {
      // Circuit was half-open, transition to closed
      this.transitionToClosed(serviceId, state);
    } else {
      // Reset failure count on success
      state.failures = 0;
      state.successCount++;
    }
    
    this.setState(serviceId, state);
  }

  /**
   * Record failed operation
   */
  recordFailure(serviceId: string, error: Error): void {
    const state = this.getState(serviceId);
    state.failures++;
    state.lastFailure = Date.now();
    
    log.error(`Circuit breaker recorded failure for ${serviceId}`, {
      serviceId,
      failures: state.failures,
      threshold: this.config.threshold,
      error: error instanceof Error ? error : new Error(String(error)),
    });
    
    // Check if we should open the circuit
    if (state.failures >= this.config.threshold && !state.isOpen) {
      this.transitionToOpen(serviceId, state);
    }
    
    this.setState(serviceId, state);
  }

  /**
   * Get circuit breaker state for service
   */
  private getState(serviceId: string): CircuitBreakerState {
    if (!this.states.has(serviceId)) {
      const newState: CircuitBreakerState = {
        failures: 0,
        lastFailure: 0,
        isOpen: false,
        nextAttempt: 0,
        successCount: 0,
      };
      this.states.set(serviceId, newState);
      return newState;
    }
    
    return this.states.get(serviceId)!;
  }

  /**
   * Set circuit breaker state for service
   */
  private setState(serviceId: string, state: CircuitBreakerState): void {
    this.states.set(serviceId, state);
  }

  /**
   * Check if circuit is open
   */
  private isOpen(state: CircuitBreakerState): boolean {
    return state.isOpen && Date.now() < state.nextAttempt;
  }

  /**
   * Check if we should attempt to reset the circuit
   */
  private shouldAttemptReset(state: CircuitBreakerState): boolean {
    return state.isOpen && Date.now() >= state.nextAttempt;
  }

  /**
   * Transition circuit to open state
   */
  private transitionToOpen(serviceId: string, state: CircuitBreakerState): void {
    state.isOpen = true;
    state.nextAttempt = Date.now() + this.config.resetTimeout;
    
    log.circuitBreaker('open', serviceId, {
      failures: state.failures,
      nextAttempt: new Date(state.nextAttempt).toISOString(),
      resetTimeout: this.config.resetTimeout,
    });
  }

  /**
   * Transition circuit to half-open state
   */
  private transitionToHalfOpen(serviceId: string, state: CircuitBreakerState): void {
    state.isOpen = true; // Still considered open, but allowing one attempt
    state.nextAttempt = Date.now() + this.config.timeout;
    
    log.circuitBreaker('half-open', serviceId, {
      failures: state.failures,
      attempt: 'single_test_request',
    });
  }

  /**
   * Transition circuit to closed state
   */
  private transitionToClosed(serviceId: string, state: CircuitBreakerState): void {
    state.isOpen = false;
    state.failures = 0;
    state.nextAttempt = 0;
    state.successCount++;
    
    log.circuitBreaker('close', serviceId, {
      successCount: state.successCount,
      resetReason: 'successful_recovery',
    });
  }

  /**
   * Get circuit breaker status for service
   */
  getStatus(serviceId: string): {
    state: string;
    failures: number;
    isOpen: boolean;
    nextAttempt: number;
    successCount: number;
  } {
    const state = this.getState(serviceId);
    
    let circuitState: string;
    if (!state.isOpen) {
      circuitState = CircuitState.CLOSED;
    } else if (this.shouldAttemptReset(state)) {
      circuitState = CircuitState.HALF_OPEN;
    } else {
      circuitState = CircuitState.OPEN;
    }
    
    return {
      state: circuitState,
      failures: state.failures,
      isOpen: state.isOpen,
      nextAttempt: state.nextAttempt,
      successCount: state.successCount,
    };
  }

  /**
   * Get all circuit breaker statuses
   */
  getAllStatuses(): Record<string, any> {
    const statuses: Record<string, any> = {};
    
    for (const [serviceId] of this.states) {
      statuses[serviceId] = this.getStatus(serviceId);
    }
    
    return statuses;
  }

  /**
   * Reset circuit breaker for service
   */
  reset(serviceId: string): void {
    const state = this.getState(serviceId);
    this.transitionToClosed(serviceId, state);
    this.setState(serviceId, state);
    
    log.circuitBreaker('close', serviceId, {
      resetReason: 'manual_reset',
    });
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const [serviceId] of this.states) {
      this.reset(serviceId);
    }
    
    log.info('All circuit breakers reset');
  }

  /**
   * Start monitoring circuit breakers
   */
  private startMonitoring(): void {
    setInterval(() => {
      this.monitorCircuits();
    }, this.config.monitoringPeriod);
  }

  /**
   * Monitor circuit breaker health
   */
  private monitorCircuits(): void {
    const now = Date.now();
    let openCircuits = 0;
    let totalFailures = 0;
    
    for (const [serviceId, state] of this.states) {
      if (state.isOpen) {
        openCircuits++;
      }
      totalFailures += state.failures;
      
      // Auto-reset circuits that have been open too long
      if (state.isOpen && now - state.lastFailure > this.config.resetTimeout * 2) {
        log.circuitBreaker('close', serviceId, {
          resetReason: 'auto_reset_timeout',
          timeSinceLastFailure: now - state.lastFailure,
        });
        this.reset(serviceId);
      }
    }
    
    if (openCircuits > 0) {
      log.warn('Circuit breaker monitoring report', {
        openCircuits,
        totalCircuits: this.states.size,
        totalFailures,
      });
    }
  }

  /**
   * Get circuit breaker metrics
   */
  getMetrics(): {
    totalCircuits: number;
    openCircuits: number;
    closedCircuits: number;
    totalFailures: number;
    totalSuccesses: number;
  } {
    let openCircuits = 0;
    let totalFailures = 0;
    let totalSuccesses = 0;
    
    for (const [, state] of this.states) {
      if (state.isOpen) {
        openCircuits++;
      }
      totalFailures += state.failures;
      totalSuccesses += state.successCount;
    }
    
    return {
      totalCircuits: this.states.size,
      openCircuits,
      closedCircuits: this.states.size - openCircuits,
      totalFailures,
      totalSuccesses,
    };
  }
}

// Export singleton instance
export const circuitBreakerService = new CircuitBreakerService();

// Export class for testing
export { CircuitBreakerService };
