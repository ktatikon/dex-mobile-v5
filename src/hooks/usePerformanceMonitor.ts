import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  componentName: string;
  mountTime: number;
  renderTime: number;
  apiCallCount: number;
  memoryUsage?: number;
}

interface UsePerformanceMonitorOptions {
  componentName: string;
  enableLogging?: boolean;
  trackMemory?: boolean;
  trackApiCalls?: boolean;
}

export function usePerformanceMonitor({
  componentName,
  enableLogging = true,
  trackMemory = false,
  trackApiCalls = false
}: UsePerformanceMonitorOptions) {
  const mountTimeRef = useRef<number>(Date.now());
  const renderCountRef = useRef<number>(0);
  const apiCallCountRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(Date.now());

  // Track component mount time
  useEffect(() => {
    const mountTime = Date.now() - mountTimeRef.current;
    
    if (enableLogging) {
      console.log(`🚀 ${componentName} mounted in ${mountTime}ms`);
    }

    // Track memory usage if enabled
    if (trackMemory && 'memory' in performance) {
      const memoryInfo = (performance as any).memory;
      console.log(`💾 ${componentName} memory usage:`, {
        used: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB'
      });
    }

    return () => {
      if (enableLogging) {
        console.log(`🔄 ${componentName} unmounted after ${renderCountRef.current} renders`);
      }
    };
  }, [componentName, enableLogging, trackMemory]);

  // Track render performance
  useEffect(() => {
    renderCountRef.current++;
    const renderTime = Date.now() - lastRenderTimeRef.current;
    lastRenderTimeRef.current = Date.now();

    if (enableLogging && renderCountRef.current > 1) {
      console.log(`🎨 ${componentName} render #${renderCountRef.current} took ${renderTime}ms`);
    }

    // Warn about excessive re-renders
    if (renderCountRef.current > 10 && enableLogging) {
      console.warn(`⚠️ ${componentName} has rendered ${renderCountRef.current} times - check for unnecessary re-renders`);
    }
  });

  // API call tracker
  const trackApiCall = useCallback((apiName: string, startTime: number) => {
    if (trackApiCalls) {
      apiCallCountRef.current++;
      const duration = Date.now() - startTime;
      
      if (enableLogging) {
        console.log(`🌐 ${componentName} API call "${apiName}" completed in ${duration}ms (total calls: ${apiCallCountRef.current})`);
      }

      // Warn about excessive API calls
      if (apiCallCountRef.current > 5 && enableLogging) {
        console.warn(`⚠️ ${componentName} has made ${apiCallCountRef.current} API calls - consider caching or batching`);
      }
    }
  }, [componentName, enableLogging, trackApiCalls]);

  // Performance measurement utilities
  const measureAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      if (enableLogging) {
        console.log(`⏱️ ${componentName} "${operationName}" completed in ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (enableLogging) {
        console.error(`❌ ${componentName} "${operationName}" failed after ${duration}ms:`, error);
      }
      
      throw error;
    }
  }, [componentName, enableLogging]);

  const measureSync = useCallback(<T>(
    operation: () => T,
    operationName: string
  ): T => {
    const startTime = Date.now();
    
    try {
      const result = operation();
      const duration = Date.now() - startTime;
      
      if (enableLogging) {
        console.log(`⏱️ ${componentName} "${operationName}" completed in ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (enableLogging) {
        console.error(`❌ ${componentName} "${operationName}" failed after ${duration}ms:`, error);
      }
      
      throw error;
    }
  }, [componentName, enableLogging]);

  // Get current metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    const metrics: PerformanceMetrics = {
      componentName,
      mountTime: Date.now() - mountTimeRef.current,
      renderTime: renderCountRef.current,
      apiCallCount: apiCallCountRef.current
    };

    if (trackMemory && 'memory' in performance) {
      const memoryInfo = (performance as any).memory;
      metrics.memoryUsage = memoryInfo.usedJSHeapSize;
    }

    return metrics;
  }, [componentName, trackMemory]);

  // Log performance summary
  const logSummary = useCallback(() => {
    const metrics = getMetrics();
    
    console.group(`📊 ${componentName} Performance Summary`);
    console.log('Mount time:', metrics.mountTime + 'ms');
    console.log('Render count:', metrics.renderTime);
    console.log('API calls:', metrics.apiCallCount);
    
    if (metrics.memoryUsage) {
      console.log('Memory usage:', Math.round(metrics.memoryUsage / 1024 / 1024) + 'MB');
    }
    
    console.groupEnd();
  }, [componentName, getMetrics]);

  return {
    trackApiCall,
    measureAsync,
    measureSync,
    getMetrics,
    logSummary,
    renderCount: renderCountRef.current,
    apiCallCount: apiCallCountRef.current
  };
}

// Global performance monitoring utilities
export const PerformanceMonitor = {
  // Track page load performance
  trackPageLoad: (pageName: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      console.group(`📄 ${pageName} Page Load Performance`);
      console.log('DNS lookup:', navigation.domainLookupEnd - navigation.domainLookupStart + 'ms');
      console.log('TCP connection:', navigation.connectEnd - navigation.connectStart + 'ms');
      console.log('Request/Response:', navigation.responseEnd - navigation.requestStart + 'ms');
      console.log('DOM processing:', navigation.domContentLoadedEventEnd - navigation.responseEnd + 'ms');
      console.log('Total load time:', navigation.loadEventEnd - navigation.navigationStart + 'ms');
      console.groupEnd();
    }
  },

  // Track resource loading
  trackResourceLoading: () => {
    if (typeof window !== 'undefined' && window.performance) {
      const resources = performance.getEntriesByType('resource');
      const slowResources = resources.filter(resource => resource.duration > 1000);
      
      if (slowResources.length > 0) {
        console.warn('🐌 Slow loading resources (>1s):', slowResources.map(r => ({
          name: r.name,
          duration: Math.round(r.duration) + 'ms'
        })));
      }
    }
  },

  // Memory leak detection
  detectMemoryLeaks: (componentName: string) => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memoryInfo = (performance as any).memory;
      const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024);
      
      if (usedMB > 100) {
        console.warn(`🚨 ${componentName} high memory usage: ${usedMB}MB`);
      }
    }
  }
};
