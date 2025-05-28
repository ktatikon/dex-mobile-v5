/**
 * PHASE 4 CONFIGURATION SERVICE
 *
 * Manages feature flags, configuration settings, and service availability for Phase 4 advanced features.
 * Provides comprehensive error handling and fallback mechanisms following established patterns.
 */

// Phase 4 Configuration - Controls advanced feature availability
export const PHASE4_CONFIG = {
  // Advanced Trading Features
  enableAdvancedTrading: true,
  enableLimitOrders: true,
  enableStopLoss: true,
  enableDCAAutomation: true,

  // DeFi Integration Features
  enableLiveStaking: true,
  enableYieldFarming: true,
  enableLiquidityProvision: true,
  enableDeFiAnalytics: true,

  // Cross-Chain Features
  enableCrossChainBridge: true,
  enableMultiNetworkPortfolio: true,
  enableCrossChainArbitrage: true,

  // Advanced Analytics & AI
  enableAIOptimization: false,
  enablePredictiveAnalytics: false,
  enableRiskAssessment: false,
  enablePerformanceMetrics: false,

  // Social Trading Features
  enableCopyTrading: false,
  enableSocialSignals: false,
  enableCommunityFeatures: false,
  enableTraderLeaderboards: false,

  // Technical Configuration
  maxConcurrentOrders: 10,
  orderExpirationHours: 24,
  maxStakingPositions: 5,
  maxLiquidityPools: 3,
  riskToleranceDefault: 'medium' as 'low' | 'medium' | 'high',

  // Network Configuration
  supportedNetworks: ['ethereum', 'polygon', 'bsc', 'arbitrum'],
  defaultNetwork: 'ethereum',
  bridgeSlippageTolerance: 0.5, // 0.5%

  // Performance Settings
  cacheExpirationMinutes: 5,
  maxRetryAttempts: 3,
  timeoutSeconds: 30,

  // Feature Rollout Control
  betaFeatures: false,
  experimentalFeatures: false,
  debugMode: false
};

// Phase 4 Service Status Interface
export interface Phase4ServiceStatus {
  serviceName: string;
  isEnabled: boolean;
  isHealthy: boolean;
  lastUpdate: Date | null;
  consecutiveFailures: number;
  phase1FallbackActive: boolean;
  currentMode: 'Phase 4 Active' | 'Phase 3 Fallback' | 'Phase 2 Fallback' | 'Phase 1 Fallback';
  errorCount: number;
  uptime: number;
}

// Advanced Trading Configuration
export interface AdvancedTradingConfig {
  enableLimitOrders: boolean;
  enableStopLoss: boolean;
  enableTakeProfit: boolean;
  enableDCAAutomation: boolean;
  maxOrderSize: number;
  minOrderSize: number;
  defaultSlippage: number;
  maxSlippage: number;
  orderBookDepth: number;
  priceUpdateInterval: number;
}

// DeFi Integration Configuration
export interface DeFiIntegrationConfig {
  enableStaking: boolean;
  enableYieldFarming: boolean;
  enableLiquidityProvision: boolean;
  supportedProtocols: string[];
  maxStakingAmount: number;
  minStakingAmount: number;
  stakingRewardUpdateInterval: number;
  yieldFarmingUpdateInterval: number;
  liquidityPoolUpdateInterval: number;
}

// Cross-Chain Configuration
export interface CrossChainConfig {
  enableBridge: boolean;
  supportedBridges: string[];
  maxBridgeAmount: number;
  minBridgeAmount: number;
  bridgeSlippageTolerance: number;
  bridgeTimeoutMinutes: number;
  gasOptimizationEnabled: boolean;
}

// AI Analytics Configuration
export interface AIAnalyticsConfig {
  enablePortfolioOptimization: boolean;
  enablePredictiveAnalytics: boolean;
  enableRiskAssessment: boolean;
  modelUpdateInterval: number;
  predictionConfidenceThreshold: number;
  riskCalculationMethod: 'var' | 'cvar' | 'sharpe' | 'sortino';
  optimizationObjective: 'return' | 'risk' | 'sharpe';
}

// Social Trading Configuration
export interface SocialTradingConfig {
  enableCopyTrading: boolean;
  enableSocialSignals: boolean;
  maxCopyTraders: number;
  maxCopyAmount: number;
  copyTradingFee: number;
  signalConfidenceThreshold: number;
  leaderboardUpdateInterval: number;
}

/**
 * Phase 4 Configuration Manager
 * Provides centralized configuration management with runtime updates and validation
 */
class Phase4ConfigManager {
  private config: typeof PHASE4_CONFIG;
  private listeners: Set<(config: typeof PHASE4_CONFIG) => void> = new Set();

  constructor() {
    this.config = { ...PHASE4_CONFIG };
  }

  /**
   * Get current Phase 4 configuration
   */
  getConfig(): typeof PHASE4_CONFIG {
    return { ...this.config };
  }

  /**
   * Update Phase 4 configuration with validation
   */
  updateConfig(updates: Partial<typeof PHASE4_CONFIG>): boolean {
    try {
      // Validate configuration updates
      const newConfig = { ...this.config, ...updates };

      // Validate network configuration
      if (updates.supportedNetworks) {
        if (!Array.isArray(updates.supportedNetworks) || updates.supportedNetworks.length === 0) {
          throw new Error('supportedNetworks must be a non-empty array');
        }
      }

      // Validate numeric values
      if (updates.maxConcurrentOrders !== undefined && updates.maxConcurrentOrders < 1) {
        throw new Error('maxConcurrentOrders must be at least 1');
      }

      if (updates.bridgeSlippageTolerance !== undefined &&
          (updates.bridgeSlippageTolerance < 0 || updates.bridgeSlippageTolerance > 100)) {
        throw new Error('bridgeSlippageTolerance must be between 0 and 100');
      }

      // Apply updates
      this.config = newConfig;

      // Notify listeners
      this.notifyListeners();

      console.log('✅ Phase 4 configuration updated successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to update Phase 4 configuration:', error);
      return false;
    }
  }

  /**
   * Enable specific Phase 4 feature with validation
   */
  enableFeature(featureName: keyof typeof PHASE4_CONFIG): boolean {
    try {
      if (typeof this.config[featureName] === 'boolean') {
        (this.config as any)[featureName] = true;
        this.notifyListeners();
        console.log(`✅ Phase 4 feature '${featureName}' enabled`);
        return true;
      } else {
        throw new Error(`Feature '${featureName}' is not a boolean flag`);
      }
    } catch (error) {
      console.error(`❌ Failed to enable Phase 4 feature '${featureName}':`, error);
      return false;
    }
  }

  /**
   * Disable specific Phase 4 feature
   */
  disableFeature(featureName: keyof typeof PHASE4_CONFIG): boolean {
    try {
      if (typeof this.config[featureName] === 'boolean') {
        (this.config as any)[featureName] = false;
        this.notifyListeners();
        console.log(`🔄 Phase 4 feature '${featureName}' disabled`);
        return true;
      } else {
        throw new Error(`Feature '${featureName}' is not a boolean flag`);
      }
    } catch (error) {
      console.error(`❌ Failed to disable Phase 4 feature '${featureName}':`, error);
      return false;
    }
  }

  /**
   * Check if Phase 4 is enabled (any Phase 4 feature is active)
   */
  isPhase4Enabled(): boolean {
    return this.config.enableAdvancedTrading ||
           this.config.enableLiveStaking ||
           this.config.enableCrossChainBridge ||
           this.config.enableAIOptimization ||
           this.config.enableCopyTrading;
  }

  /**
   * Get Phase 4 service status summary
   */
  getServiceStatus(): { [key: string]: boolean } {
    return {
      advancedTrading: this.config.enableAdvancedTrading,
      defiIntegration: this.config.enableLiveStaking,
      crossChain: this.config.enableCrossChainBridge,
      aiAnalytics: this.config.enableAIOptimization,
      socialTrading: this.config.enableCopyTrading,
      betaFeatures: this.config.betaFeatures,
      experimentalFeatures: this.config.experimentalFeatures
    };
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(callback: (config: typeof PHASE4_CONFIG) => void): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of configuration changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.config);
      } catch (error) {
        console.error('Error notifying Phase 4 config listener:', error);
      }
    });
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): void {
    this.config = { ...PHASE4_CONFIG };
    this.notifyListeners();
    console.log('🔄 Phase 4 configuration reset to defaults');
  }

  /**
   * Validate current configuration
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Validate network configuration
      if (!Array.isArray(this.config.supportedNetworks) || this.config.supportedNetworks.length === 0) {
        errors.push('supportedNetworks must be a non-empty array');
      }

      // Validate numeric ranges
      if (this.config.maxConcurrentOrders < 1) {
        errors.push('maxConcurrentOrders must be at least 1');
      }

      if (this.config.bridgeSlippageTolerance < 0 || this.config.bridgeSlippageTolerance > 100) {
        errors.push('bridgeSlippageTolerance must be between 0 and 100');
      }

      if (this.config.timeoutSeconds < 1 || this.config.timeoutSeconds > 300) {
        errors.push('timeoutSeconds must be between 1 and 300');
      }

      // Validate risk tolerance
      if (!['low', 'medium', 'high'].includes(this.config.riskToleranceDefault)) {
        errors.push('riskToleranceDefault must be low, medium, or high');
      }

      return {
        isValid: errors.length === 0,
        errors
      };

    } catch (error) {
      errors.push(`Configuration validation error: ${error}`);
      return {
        isValid: false,
        errors
      };
    }
  }
}

// Export singleton instance
export const phase4ConfigManager = new Phase4ConfigManager();

// Export configuration for direct access (backward compatibility)
export { PHASE4_CONFIG as default };

// Utility functions for feature checking
export const isAdvancedTradingEnabled = () => phase4ConfigManager.getConfig().enableAdvancedTrading;
export const isDeFiIntegrationEnabled = () => phase4ConfigManager.getConfig().enableLiveStaking;
export const isCrossChainEnabled = () => phase4ConfigManager.getConfig().enableCrossChainBridge;
export const isAIAnalyticsEnabled = () => phase4ConfigManager.getConfig().enableAIOptimization;
export const isSocialTradingEnabled = () => phase4ConfigManager.getConfig().enableCopyTrading;
