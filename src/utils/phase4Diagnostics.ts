/**
 * PHASE 4 DIAGNOSTICS AND STATUS TRACKER
 * 
 * Comprehensive diagnostic tools for Phase 4 advanced features including
 * service health monitoring, feature availability checking, and performance metrics.
 */

import { phase4ConfigManager, Phase4ServiceStatus } from '@/services/phase4/phase4ConfigService';
import { advancedTradingService } from '@/services/phase4/advancedTradingService';

// Phase 4 Feature Status Interface
export interface Phase4FeatureStatus {
  featureName: string;
  isEnabled: boolean;
  isHealthy: boolean;
  lastCheck: Date;
  errorCount: number;
  successRate: number;
  averageResponseTime: number;
  fallbackActive: boolean;
  currentPhase: 'Phase 4 Active' | 'Phase 3 Fallback' | 'Phase 2 Fallback' | 'Phase 1 Fallback';
}

// Phase 4 System Health Report
export interface Phase4HealthReport {
  overallHealth: 'healthy' | 'degraded' | 'critical' | 'offline';
  timestamp: Date;
  features: {
    advancedTrading: Phase4FeatureStatus;
    defiIntegration: Phase4FeatureStatus;
    crossChain: Phase4FeatureStatus;
    aiAnalytics: Phase4FeatureStatus;
    socialTrading: Phase4FeatureStatus;
  };
  performance: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    uptime: number;
  };
  configuration: {
    enabledFeatures: string[];
    disabledFeatures: string[];
    betaFeatures: boolean;
    experimentalFeatures: boolean;
    debugMode: boolean;
  };
  recommendations: string[];
}

/**
 * Phase 4 Diagnostics Manager
 * Provides comprehensive monitoring and health checking for Phase 4 features
 */
class Phase4DiagnosticsManager {
  private healthHistory: Phase4HealthReport[] = [];
  private performanceMetrics: Map<string, number[]> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private lastHealthCheck: Date | null = null;
  
  // Configuration
  private readonly MAX_HISTORY_ENTRIES = 100;
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute
  private readonly PERFORMANCE_WINDOW = 10; // Keep last 10 measurements

  constructor() {
    this.initializeDiagnostics();
  }

  /**
   * Initialize Phase 4 diagnostics system
   */
  private initializeDiagnostics(): void {
    try {
      console.log('🔍 Initializing Phase 4 Diagnostics...');
      
      // Start periodic health checks
      this.startPeriodicHealthChecks();
      
      console.log('✅ Phase 4 Diagnostics initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Phase 4 Diagnostics:', error);
    }
  }

  /**
   * Perform comprehensive Phase 4 health check
   */
  async performHealthCheck(): Promise<Phase4HealthReport> {
    try {
      console.log('🔍 Performing Phase 4 health check...');
      
      const timestamp = new Date();
      const config = phase4ConfigManager.getConfig();
      
      // Check individual feature health
      const features = {
        advancedTrading: await this.checkAdvancedTradingHealth(),
        defiIntegration: await this.checkDeFiIntegrationHealth(),
        crossChain: await this.checkCrossChainHealth(),
        aiAnalytics: await this.checkAIAnalyticsHealth(),
        socialTrading: await this.checkSocialTradingHealth()
      };

      // Calculate overall health
      const healthyFeatures = Object.values(features).filter(f => f.isHealthy).length;
      const totalFeatures = Object.values(features).length;
      const healthPercentage = (healthyFeatures / totalFeatures) * 100;

      let overallHealth: 'healthy' | 'degraded' | 'critical' | 'offline';
      if (healthPercentage >= 90) overallHealth = 'healthy';
      else if (healthPercentage >= 70) overallHealth = 'degraded';
      else if (healthPercentage >= 30) overallHealth = 'critical';
      else overallHealth = 'offline';

      // Calculate performance metrics
      const performance = this.calculatePerformanceMetrics();

      // Generate configuration summary
      const enabledFeatures = Object.entries(config)
        .filter(([key, value]) => typeof value === 'boolean' && value && key.startsWith('enable'))
        .map(([key]) => key);

      const disabledFeatures = Object.entries(config)
        .filter(([key, value]) => typeof value === 'boolean' && !value && key.startsWith('enable'))
        .map(([key]) => key);

      // Generate recommendations
      const recommendations = this.generateRecommendations(features, performance, config);

      const healthReport: Phase4HealthReport = {
        overallHealth,
        timestamp,
        features,
        performance,
        configuration: {
          enabledFeatures,
          disabledFeatures,
          betaFeatures: config.betaFeatures,
          experimentalFeatures: config.experimentalFeatures,
          debugMode: config.debugMode
        },
        recommendations
      };

      // Store in history
      this.addToHealthHistory(healthReport);
      this.lastHealthCheck = timestamp;

      console.log(`✅ Phase 4 health check completed - Overall health: ${overallHealth}`);
      return healthReport;

    } catch (error) {
      console.error('❌ Error performing Phase 4 health check:', error);
      
      // Return minimal health report on error
      return {
        overallHealth: 'critical',
        timestamp: new Date(),
        features: {
          advancedTrading: this.createErrorFeatureStatus('Advanced Trading'),
          defiIntegration: this.createErrorFeatureStatus('DeFi Integration'),
          crossChain: this.createErrorFeatureStatus('Cross-Chain'),
          aiAnalytics: this.createErrorFeatureStatus('AI Analytics'),
          socialTrading: this.createErrorFeatureStatus('Social Trading')
        },
        performance: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          uptime: 0
        },
        configuration: {
          enabledFeatures: [],
          disabledFeatures: [],
          betaFeatures: false,
          experimentalFeatures: false,
          debugMode: false
        },
        recommendations: ['System health check failed - investigate immediately']
      };
    }
  }

  /**
   * Check Advanced Trading service health
   */
  private async checkAdvancedTradingHealth(): Promise<Phase4FeatureStatus> {
    try {
      const config = phase4ConfigManager.getConfig();
      const startTime = Date.now();
      
      // Simulate health check (in real implementation, this would test actual service)
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate async operation
      
      const responseTime = Date.now() - startTime;
      this.recordPerformanceMetric('advancedTrading', responseTime);

      return {
        featureName: 'Advanced Trading',
        isEnabled: config.enableAdvancedTrading,
        isHealthy: config.enableAdvancedTrading,
        lastCheck: new Date(),
        errorCount: this.errorCounts.get('advancedTrading') || 0,
        successRate: this.calculateSuccessRate('advancedTrading'),
        averageResponseTime: this.getAverageResponseTime('advancedTrading'),
        fallbackActive: !config.enableAdvancedTrading,
        currentPhase: config.enableAdvancedTrading ? 'Phase 4 Active' : 'Phase 3 Fallback'
      };

    } catch (error) {
      this.incrementErrorCount('advancedTrading');
      return this.createErrorFeatureStatus('Advanced Trading');
    }
  }

  /**
   * Check DeFi Integration service health
   */
  private async checkDeFiIntegrationHealth(): Promise<Phase4FeatureStatus> {
    try {
      const config = phase4ConfigManager.getConfig();
      const startTime = Date.now();
      
      await new Promise(resolve => setTimeout(resolve, 15));
      
      const responseTime = Date.now() - startTime;
      this.recordPerformanceMetric('defiIntegration', responseTime);

      return {
        featureName: 'DeFi Integration',
        isEnabled: config.enableLiveStaking,
        isHealthy: config.enableLiveStaking,
        lastCheck: new Date(),
        errorCount: this.errorCounts.get('defiIntegration') || 0,
        successRate: this.calculateSuccessRate('defiIntegration'),
        averageResponseTime: this.getAverageResponseTime('defiIntegration'),
        fallbackActive: !config.enableLiveStaking,
        currentPhase: config.enableLiveStaking ? 'Phase 4 Active' : 'Phase 3 Fallback'
      };

    } catch (error) {
      this.incrementErrorCount('defiIntegration');
      return this.createErrorFeatureStatus('DeFi Integration');
    }
  }

  /**
   * Check Cross-Chain service health
   */
  private async checkCrossChainHealth(): Promise<Phase4FeatureStatus> {
    try {
      const config = phase4ConfigManager.getConfig();
      const startTime = Date.now();
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const responseTime = Date.now() - startTime;
      this.recordPerformanceMetric('crossChain', responseTime);

      return {
        featureName: 'Cross-Chain',
        isEnabled: config.enableCrossChainBridge,
        isHealthy: config.enableCrossChainBridge,
        lastCheck: new Date(),
        errorCount: this.errorCounts.get('crossChain') || 0,
        successRate: this.calculateSuccessRate('crossChain'),
        averageResponseTime: this.getAverageResponseTime('crossChain'),
        fallbackActive: !config.enableCrossChainBridge,
        currentPhase: config.enableCrossChainBridge ? 'Phase 4 Active' : 'Phase 3 Fallback'
      };

    } catch (error) {
      this.incrementErrorCount('crossChain');
      return this.createErrorFeatureStatus('Cross-Chain');
    }
  }

  /**
   * Check AI Analytics service health
   */
  private async checkAIAnalyticsHealth(): Promise<Phase4FeatureStatus> {
    try {
      const config = phase4ConfigManager.getConfig();
      const startTime = Date.now();
      
      await new Promise(resolve => setTimeout(resolve, 25));
      
      const responseTime = Date.now() - startTime;
      this.recordPerformanceMetric('aiAnalytics', responseTime);

      return {
        featureName: 'AI Analytics',
        isEnabled: config.enableAIOptimization,
        isHealthy: config.enableAIOptimization,
        lastCheck: new Date(),
        errorCount: this.errorCounts.get('aiAnalytics') || 0,
        successRate: this.calculateSuccessRate('aiAnalytics'),
        averageResponseTime: this.getAverageResponseTime('aiAnalytics'),
        fallbackActive: !config.enableAIOptimization,
        currentPhase: config.enableAIOptimization ? 'Phase 4 Active' : 'Phase 3 Fallback'
      };

    } catch (error) {
      this.incrementErrorCount('aiAnalytics');
      return this.createErrorFeatureStatus('AI Analytics');
    }
  }

  /**
   * Check Social Trading service health
   */
  private async checkSocialTradingHealth(): Promise<Phase4FeatureStatus> {
    try {
      const config = phase4ConfigManager.getConfig();
      const startTime = Date.now();
      
      await new Promise(resolve => setTimeout(resolve, 12));
      
      const responseTime = Date.now() - startTime;
      this.recordPerformanceMetric('socialTrading', responseTime);

      return {
        featureName: 'Social Trading',
        isEnabled: config.enableCopyTrading,
        isHealthy: config.enableCopyTrading,
        lastCheck: new Date(),
        errorCount: this.errorCounts.get('socialTrading') || 0,
        successRate: this.calculateSuccessRate('socialTrading'),
        averageResponseTime: this.getAverageResponseTime('socialTrading'),
        fallbackActive: !config.enableCopyTrading,
        currentPhase: config.enableCopyTrading ? 'Phase 4 Active' : 'Phase 3 Fallback'
      };

    } catch (error) {
      this.incrementErrorCount('socialTrading');
      return this.createErrorFeatureStatus('Social Trading');
    }
  }

  /**
   * Generate system recommendations based on health status
   */
  private generateRecommendations(
    features: any, 
    performance: any, 
    config: any
  ): string[] {
    const recommendations: string[] = [];

    // Check for unhealthy features
    Object.values(features).forEach((feature: any) => {
      if (!feature.isHealthy && feature.isEnabled) {
        recommendations.push(`${feature.featureName} is enabled but unhealthy - investigate service status`);
      }
    });

    // Performance recommendations
    if (performance.averageResponseTime > 1000) {
      recommendations.push('Average response time is high - consider performance optimization');
    }

    if (performance.successRate < 95) {
      recommendations.push('Success rate is below 95% - review error handling and service reliability');
    }

    // Configuration recommendations
    if (!config.enableAdvancedTrading && !config.enableLiveStaking) {
      recommendations.push('No Phase 4 features are enabled - consider enabling advanced features for enhanced user experience');
    }

    if (config.experimentalFeatures) {
      recommendations.push('Experimental features are enabled - monitor closely for stability issues');
    }

    // Default recommendation if all is well
    if (recommendations.length === 0) {
      recommendations.push('All Phase 4 systems are operating normally');
    }

    return recommendations;
  }

  /**
   * Get Phase 4 feature availability summary
   */
  getFeatureAvailability(): { [key: string]: boolean } {
    const config = phase4ConfigManager.getConfig();
    
    return {
      'Advanced Trading': config.enableAdvancedTrading,
      'Limit Orders': config.enableLimitOrders,
      'Stop-Loss Orders': config.enableStopLoss,
      'DCA Automation': config.enableDCAAutomation,
      'Live Staking': config.enableLiveStaking,
      'Yield Farming': config.enableYieldFarming,
      'Liquidity Provision': config.enableLiquidityProvision,
      'Cross-Chain Bridge': config.enableCrossChainBridge,
      'Multi-Network Portfolio': config.enableMultiNetworkPortfolio,
      'AI Optimization': config.enableAIOptimization,
      'Predictive Analytics': config.enablePredictiveAnalytics,
      'Copy Trading': config.enableCopyTrading,
      'Social Signals': config.enableSocialSignals,
      'Beta Features': config.betaFeatures,
      'Experimental Features': config.experimentalFeatures
    };
  }

  /**
   * Get Phase 4 health history
   */
  getHealthHistory(): Phase4HealthReport[] {
    return [...this.healthHistory];
  }

  /**
   * Get last health check result
   */
  getLastHealthCheck(): Phase4HealthReport | null {
    return this.healthHistory.length > 0 ? this.healthHistory[this.healthHistory.length - 1] : null;
  }

  // Helper methods
  private createErrorFeatureStatus(featureName: string): Phase4FeatureStatus {
    return {
      featureName,
      isEnabled: false,
      isHealthy: false,
      lastCheck: new Date(),
      errorCount: 1,
      successRate: 0,
      averageResponseTime: 0,
      fallbackActive: true,
      currentPhase: 'Phase 1 Fallback'
    };
  }

  private recordPerformanceMetric(service: string, responseTime: number): void {
    if (!this.performanceMetrics.has(service)) {
      this.performanceMetrics.set(service, []);
    }
    
    const metrics = this.performanceMetrics.get(service)!;
    metrics.push(responseTime);
    
    // Keep only last N measurements
    if (metrics.length > this.PERFORMANCE_WINDOW) {
      metrics.shift();
    }
  }

  private getAverageResponseTime(service: string): number {
    const metrics = this.performanceMetrics.get(service) || [];
    if (metrics.length === 0) return 0;
    
    return metrics.reduce((sum, time) => sum + time, 0) / metrics.length;
  }

  private incrementErrorCount(service: string): void {
    const current = this.errorCounts.get(service) || 0;
    this.errorCounts.set(service, current + 1);
  }

  private calculateSuccessRate(service: string): number {
    const metrics = this.performanceMetrics.get(service) || [];
    const errors = this.errorCounts.get(service) || 0;
    const total = metrics.length + errors;
    
    if (total === 0) return 100;
    return ((total - errors) / total) * 100;
  }

  private calculatePerformanceMetrics(): any {
    const allMetrics = Array.from(this.performanceMetrics.values()).flat();
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    const totalRequests = allMetrics.length + totalErrors;
    
    return {
      totalRequests,
      successfulRequests: allMetrics.length,
      failedRequests: totalErrors,
      averageResponseTime: allMetrics.length > 0 ? 
        allMetrics.reduce((sum, time) => sum + time, 0) / allMetrics.length : 0,
      uptime: totalRequests > 0 ? (allMetrics.length / totalRequests) * 100 : 100
    };
  }

  private addToHealthHistory(report: Phase4HealthReport): void {
    this.healthHistory.push(report);
    
    // Keep only last N entries
    if (this.healthHistory.length > this.MAX_HISTORY_ENTRIES) {
      this.healthHistory.shift();
    }
  }

  private startPeriodicHealthChecks(): void {
    setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Error in periodic health check:', error);
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }
}

// Export singleton instance
export const phase4DiagnosticsManager = new Phase4DiagnosticsManager();

// Utility functions for easy access
export const getPhase4Health = () => phase4DiagnosticsManager.performHealthCheck();
export const getPhase4Features = () => phase4DiagnosticsManager.getFeatureAvailability();
export const getPhase4History = () => phase4DiagnosticsManager.getHealthHistory();

export default phase4DiagnosticsManager;
