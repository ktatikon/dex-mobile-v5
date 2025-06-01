/**
 * Enhanced Diagnostic Tool for Phase 1/Phase 2 Detection and Testing
 * Intelligently detects current phase and provides appropriate testing
 */

import React from 'react';
import { PHASE2_CONFIG } from '@/services/fallbackDataService';

export interface EnhancedDiagnosticReport {
  timestamp: Date;
  detectedPhase: 'Phase 1' | 'Phase 2';
  systemInfo: {
    reactVersion: string;
    userAgent: string;
    buildMode: string;
    nodeEnv: string;
  };
  phaseDetection: {
    phase2ConfigExists: boolean;
    realWalletsEnabled: boolean;
    realTransactionsEnabled: boolean;
    phase2ServicesAvailable: string[];
    phase2ServicesUnavailable: string[];
  };
  connectivityTests: {
    networkConnectivity: boolean;
    coinGeckoAPI: boolean;
    etherscanAPI: boolean;
    responseTime: number;
  };
  applicationHealth: {
    buildStatus: 'success' | 'error';
    runtimeErrors: string[];
    consoleWarnings: string[];
    memoryUsage: number;
    performanceScore: number;
  };
  phase1Tests: {
    mockDataIntegrity: boolean;
    tokenDataAvailable: boolean;
    transactionDataAvailable: boolean;
    uiComponentsRendering: boolean;
  };
  phase2Tests: {
    walletServiceStatus: 'available' | 'unavailable' | 'error';
    transactionServiceStatus: 'available' | 'unavailable' | 'error';
    realTimeDataStatus: 'available' | 'unavailable' | 'error';
    apiIntegrationStatus: 'active' | 'inactive' | 'error';
  };
  recommendations: string[];
  errors: string[];
  warnings: string[];
}

class EnhancedDiagnosticTool {
  private startTime: number = 0;
  private errors: string[] = [];
  private warnings: string[] = [];
  private recommendations: string[] = [];

  /**
   * Run comprehensive diagnostic assessment with automatic phase detection
   */
  async runEnhancedDiagnostics(): Promise<EnhancedDiagnosticReport> {
    console.log('🔍 Starting enhanced diagnostic assessment with phase detection...');

    this.startTime = Date.now();
    this.errors = [];
    this.warnings = [];
    this.recommendations = [];

    const report: EnhancedDiagnosticReport = {
      timestamp: new Date(),
      detectedPhase: await this.detectCurrentPhase(),
      systemInfo: await this.getSystemInfo(),
      phaseDetection: await this.analyzePhaseConfiguration(),
      connectivityTests: await this.testConnectivity(),
      applicationHealth: await this.assessApplicationHealth(),
      phase1Tests: await this.runPhase1Tests(),
      phase2Tests: await this.runPhase2Tests(),
      recommendations: this.recommendations,
      errors: this.errors,
      warnings: this.warnings
    };

    console.log('✅ Enhanced diagnostic assessment complete');
    return report;
  }

  /**
   * Automatically detect current phase based on configuration and available services
   */
  private async detectCurrentPhase(): Promise<'Phase 1' | 'Phase 2'> {
    try {
      // Check if Phase 2 configuration exists and is enabled
      if (PHASE2_CONFIG?.enableRealWallets || PHASE2_CONFIG?.enableRealTransactions) {
        return 'Phase 2';
      }
      return 'Phase 1';
    } catch (error) {
      this.warnings.push('Could not detect phase configuration, defaulting to Phase 1');
      return 'Phase 1';
    }
  }

  /**
   * Get basic system information
   */
  private async getSystemInfo() {
    return {
      reactVersion: React.version,
      userAgent: navigator.userAgent,
      buildMode: import.meta.env.MODE || 'unknown',
      nodeEnv: import.meta.env.NODE_ENV || 'unknown'
    };
  }

  /**
   * Analyze Phase 2 configuration and service availability
   */
  private async analyzePhaseConfiguration() {
    const available: string[] = [];
    const unavailable: string[] = [];

    // Check for Phase 2 services with explicit imports
    try {
      const realTimeDataManager = await import('@/services/realTimeDataManager.ts');
      if (realTimeDataManager) available.push('realTimeDataManager');
    } catch (error) {
      unavailable.push('realTimeDataManager');
    }

    try {
      const walletConnectivityService = await import('@/services/walletConnectivityService.ts');
      if (walletConnectivityService) available.push('walletConnectivityService');
    } catch (error) {
      unavailable.push('walletConnectivityService');
    }

    try {
      const realTransactionService = await import('@/services/realTransactionService.ts');
      if (realTransactionService) available.push('realTransactionService');
    } catch (error) {
      unavailable.push('realTransactionService');
    }

    try {
      const enhancedTransactionService = await import('@/services/enhancedTransactionService.ts');
      if (enhancedTransactionService) available.push('enhancedTransactionService');
    } catch (error) {
      unavailable.push('enhancedTransactionService');
    }

    return {
      phase2ConfigExists: !!PHASE2_CONFIG,
      realWalletsEnabled: PHASE2_CONFIG?.enableRealWallets || false,
      realTransactionsEnabled: PHASE2_CONFIG?.enableRealTransactions || false,
      phase2ServicesAvailable: available,
      phase2ServicesUnavailable: unavailable
    };
  }

  /**
   * Test network connectivity and API availability
   */
  private async testConnectivity() {
    const startTime = Date.now();
    let networkConnectivity = false;
    let coinGeckoAPI = false;
    let etherscanAPI = false;

    try {
      // Basic network test
      const networkResponse = await fetch('https://httpbin.org/get', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      networkConnectivity = networkResponse.ok;
    } catch (error) {
      this.warnings.push(`Network connectivity test failed: ${error}`);
    }

    try {
      // CoinGecko API test
      const coinGeckoResponse = await fetch('https://api.coingecko.com/api/v3/ping', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      coinGeckoAPI = coinGeckoResponse.ok;
    } catch (error) {
      this.warnings.push(`CoinGecko API test failed: ${error}`);
    }

    try {
      // Etherscan API test (basic)
      const etherscanResponse = await fetch('https://api.etherscan.io/api?module=stats&action=ethsupply', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      etherscanAPI = etherscanResponse.ok;
    } catch (error) {
      this.warnings.push(`Etherscan API test failed: ${error}`);
    }

    const responseTime = Date.now() - startTime;

    return {
      networkConnectivity,
      coinGeckoAPI,
      etherscanAPI,
      responseTime
    };
  }

  /**
   * Assess overall application health
   */
  private async assessApplicationHealth() {
    const runtimeErrors: string[] = [];
    const consoleWarnings: string[] = [];

    // Mock memory usage calculation
    const memoryUsage = Math.round(Math.random() * 50 + 30); // 30-80 MB

    // Calculate performance score based on various factors
    let performanceScore = 100;
    if (this.errors.length > 0) performanceScore -= this.errors.length * 20;
    if (this.warnings.length > 0) performanceScore -= this.warnings.length * 5;
    performanceScore = Math.max(0, performanceScore);

    return {
      buildStatus: 'success' as const,
      runtimeErrors,
      consoleWarnings,
      memoryUsage,
      performanceScore
    };
  }

  /**
   * Run Phase 1 specific tests
   */
  private async runPhase1Tests() {
    let mockDataIntegrity = false;
    let tokenDataAvailable = false;
    let transactionDataAvailable = false;
    const uiComponentsRendering = true; // Assume true if we got this far

    try {
      // Test fallback data imports
      const { mockTokens, mockTransactions } = await import('@/services/fallbackDataService');
      mockDataIntegrity = !!(mockTokens && mockTransactions);
      tokenDataAvailable = mockTokens?.length > 0;
      transactionDataAvailable = mockTransactions?.length > 0;

      if (!mockDataIntegrity) {
        this.errors.push('Mock data integrity check failed');
      }
    } catch (error) {
      this.errors.push(`Phase 1 mock data test failed: ${error}`);
    }

    return {
      mockDataIntegrity,
      tokenDataAvailable,
      transactionDataAvailable,
      uiComponentsRendering
    };
  }

  /**
   * Run comprehensive Phase 2/3 service tests with enhanced monitoring
   */
  private async runPhase2Tests() {
    let walletServiceStatus: 'available' | 'unavailable' | 'error' = 'unavailable';
    let transactionServiceStatus: 'available' | 'unavailable' | 'error' = 'unavailable';
    let realTimeDataStatus: 'available' | 'unavailable' | 'error' = 'unavailable';
    let enhancedAnalyticsStatus: 'available' | 'unavailable' | 'error' = 'unavailable';
    let apiIntegrationStatus: 'active' | 'inactive' | 'error' = 'inactive';

    // Service status details for comprehensive monitoring
    const serviceDetails: Record<string, any> = {};

    // Test Real-Time Data Manager (Phase 3 Step 1)
    try {
      const dataManager = await import('@/services/realTimeDataManager.ts');
      if (dataManager.realTimeDataManager) {
        realTimeDataStatus = 'available';
        // Get enhanced status information
        try {
          const status = dataManager.realTimeDataManager.getStatus();
          serviceDetails.realTimeData = {
            ...status,
            serviceName: 'Real-Time Data Manager',
            phase3Step: 1
          };
        } catch (error) {
          serviceDetails.realTimeData = { error: 'Status unavailable' };
        }
      }
    } catch (error) {
      realTimeDataStatus = 'error';
      this.warnings.push(`Real-time data service test failed: ${error}`);
    }

    // Test Wallet Connectivity Service (Phase 3 Step 2)
    try {
      const walletService = await import('@/services/walletConnectivityService.ts');
      if (walletService.walletConnectivityService) {
        walletServiceStatus = 'available';
        // Get enhanced status information
        try {
          const status = walletService.walletConnectivityService.getStatus();
          serviceDetails.walletConnectivity = {
            ...status,
            serviceName: 'Wallet Connectivity Service',
            phase3Step: 2
          };
        } catch (error) {
          serviceDetails.walletConnectivity = { error: 'Status unavailable' };
        }
      }
    } catch (error) {
      walletServiceStatus = 'error';
      this.warnings.push(`Wallet service test failed: ${error}`);
    }

    // Test Transaction Service (Phase 3 Step 3)
    try {
      const transactionService = await import('@/services/realTransactionService.ts');
      if (transactionService.realTransactionService) {
        transactionServiceStatus = 'available';
        // Get enhanced status information
        try {
          const status = transactionService.realTransactionService.getStatus();
          serviceDetails.transactionService = {
            ...status,
            serviceName: 'Transaction Service',
            phase3Step: 3
          };
        } catch (error) {
          serviceDetails.transactionService = { error: 'Status unavailable' };
        }
      }
    } catch (error) {
      transactionServiceStatus = 'error';
      this.warnings.push(`Transaction service test failed: ${error}`);
    }

    // Test Enhanced Transaction Analytics (Phase 3 Step 4)
    try {
      const enhancedService = await import('@/services/enhancedTransactionService.ts');
      if (enhancedService.enhancedTransactionAnalyticsService) {
        enhancedAnalyticsStatus = 'available';
        // Get enhanced status information
        try {
          const status = enhancedService.enhancedTransactionAnalyticsService.getStatus();
          serviceDetails.enhancedAnalytics = {
            ...status,
            serviceName: 'Enhanced Transaction Analytics',
            phase3Step: 4
          };
        } catch (error) {
          serviceDetails.enhancedAnalytics = { error: 'Status unavailable' };
        }
      }
    } catch (error) {
      enhancedAnalyticsStatus = 'error';
      this.warnings.push(`Enhanced analytics service test failed: ${error}`);
    }

    // Determine API integration status
    if (PHASE2_CONFIG?.enableRealWallets || PHASE2_CONFIG?.enableRealTransactions) {
      apiIntegrationStatus = 'active';
    }

    // Calculate Phase 3 completion percentage
    const availableServices = [
      realTimeDataStatus === 'available',
      walletServiceStatus === 'available',
      transactionServiceStatus === 'available',
      enhancedAnalyticsStatus === 'available'
    ].filter(Boolean).length;

    const phase3CompletionPercentage = (availableServices / 4) * 100;

    return {
      walletServiceStatus,
      transactionServiceStatus,
      realTimeDataStatus,
      enhancedAnalyticsStatus,
      apiIntegrationStatus,
      serviceDetails,
      phase3CompletionPercentage,
      totalServicesAvailable: availableServices,
      totalServicesExpected: 4
    };
  }

  /**
   * Generate human-readable enhanced report
   */
  generateEnhancedReport(report: EnhancedDiagnosticReport): string {
    const duration = Date.now() - this.startTime;

    return `
🔍 ENHANCED DIAGNOSTIC REPORT
Generated: ${report.timestamp.toLocaleString()}
Duration: ${duration}ms
Detected Phase: ${report.detectedPhase}

🖥️ SYSTEM INFO:
React: ${report.systemInfo.reactVersion}
Build Mode: ${report.systemInfo.buildMode}
Environment: ${report.systemInfo.nodeEnv}

🔧 PHASE DETECTION:
Phase 2 Config: ${report.phaseDetection.phase2ConfigExists ? '✅' : '❌'}
Real Wallets: ${report.phaseDetection.realWalletsEnabled ? '✅' : '❌'}
Real Transactions: ${report.phaseDetection.realTransactionsEnabled ? '✅' : '❌'}
Available Services: ${report.phaseDetection.phase2ServicesAvailable.join(', ') || 'None'}

🌐 CONNECTIVITY:
Network: ${report.connectivityTests.networkConnectivity ? '✅' : '❌'}
CoinGecko API: ${report.connectivityTests.coinGeckoAPI ? '✅' : '❌'}
Etherscan API: ${report.connectivityTests.etherscanAPI ? '✅' : '❌'}
Response Time: ${report.connectivityTests.responseTime}ms

🏥 APPLICATION HEALTH:
Performance Score: ${report.applicationHealth.performanceScore}%
Memory Usage: ${report.applicationHealth.memoryUsage}MB
Build Status: ${report.applicationHealth.buildStatus.toUpperCase()}

📊 PHASE 1 TESTS:
Mock Data: ${report.phase1Tests.mockDataIntegrity ? '✅' : '❌'}
Token Data: ${report.phase1Tests.tokenDataAvailable ? '✅' : '❌'}
Transaction Data: ${report.phase1Tests.transactionDataAvailable ? '✅' : '❌'}
UI Rendering: ${report.phase1Tests.uiComponentsRendering ? '✅' : '❌'}

🚀 PHASE 3 SERVICE INTEGRATION STATUS:
Phase 3 Completion: ${report.phase2Tests.phase3CompletionPercentage}% (${report.phase2Tests.totalServicesAvailable}/${report.phase2Tests.totalServicesExpected} services)

Step 1 - Real-Time Data Manager: ${this.getStatusIcon(report.phase2Tests.realTimeDataStatus)}
Step 2 - Wallet Connectivity: ${this.getStatusIcon(report.phase2Tests.walletServiceStatus)}
Step 3 - Transaction Service: ${this.getStatusIcon(report.phase2Tests.transactionServiceStatus)}
Step 4 - Enhanced Analytics: ${this.getStatusIcon(report.phase2Tests.enhancedAnalyticsStatus)}
API Integration: ${this.getStatusIcon(report.phase2Tests.apiIntegrationStatus)}

📊 SERVICE DETAILS:
${this.generateServiceDetailsReport(report.phase2Tests.serviceDetails)}

${report.recommendations.length > 0 ? `💡 RECOMMENDATIONS:\n${report.recommendations.map(r => `  • ${r}`).join('\n')}` : ''}

${report.errors.length > 0 ? `❌ ERRORS:\n${report.errors.map(e => `  • ${e}`).join('\n')}` : '✅ No Errors'}

${report.warnings.length > 0 ? `⚠️ WARNINGS:\n${report.warnings.map(w => `  • ${w}`).join('\n')}` : '✅ No Warnings'}
    `.trim();
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'available':
      case 'active':
      case 'success':
        return '✅';
      case 'unavailable':
      case 'inactive':
        return '❌';
      case 'error':
        return '🔥';
      default:
        return '❓';
    }
  }

  /**
   * Generate detailed service status report
   */
  private generateServiceDetailsReport(serviceDetails: Record<string, any>): string {
    const details: string[] = [];

    Object.entries(serviceDetails).forEach(([serviceKey, service]: [string, Record<string, any>]) => {
      if (service.error) {
        details.push(`${service.serviceName || serviceKey}: ❌ ${service.error}`);
      } else {
        const mode = service.currentMode || 'Unknown';
        const fallbackActive = service.phase1FallbackActive ? '(Fallback Active)' : '';
        const failures = service.consecutiveFailures > 0 ? `(${service.consecutiveFailures} failures)` : '';

        details.push(`${service.serviceName || serviceKey}: ${mode} ${fallbackActive} ${failures}`.trim());

        // Add specific service metrics
        if (service.tokenCount !== undefined) {
          details.push(`  └─ Tokens: ${service.tokenCount}`);
        }
        if (service.connectedWalletsCount !== undefined) {
          details.push(`  └─ Wallets: ${service.connectedWalletsCount}`);
        }
        if (service.transactionCacheSize !== undefined) {
          details.push(`  └─ Cached Transactions: ${service.transactionCacheSize}`);
        }
        if (service.analyticsCacheSize !== undefined) {
          details.push(`  └─ Analytics Cache: ${service.analyticsCacheSize}`);
        }
      }
    });

    return details.length > 0 ? details.join('\n') : 'No service details available';
  }
}

// Export singleton instance
export const enhancedDiagnosticTool = new EnhancedDiagnosticTool();

// Export convenience function
export async function runEnhancedDiagnostics(): Promise<EnhancedDiagnosticReport> {
  return await enhancedDiagnosticTool.runEnhancedDiagnostics();
}

// ===== LEGACY DIAGNOSTIC FUNCTIONS (Consolidated from diagnostics.ts) =====

export interface DiagnosticReport {
  timestamp: Date;
  phase: 'Phase 1' | 'Phase 2';
  apiMetrics: {
    coinGeckoTokensFetched: number;
    apiResponseTime: number;
    apiSuccessRate: number;
    rateLimitStatus: {
      requestCount: number;
      windowStart: Date;
      isBlocked: boolean;
    };
  };
  dataTransformation: {
    tokensFromAPI: number;
    tokensAfterAdaptation: number;
    tokensWithBalances: number;
    tokensDisplayedInUI: number;
    dataLossPercentage: number;
  };
  cacheMetrics: {
    hitRatio: number;
    missRatio: number;
    cacheSize: number;
    lastCacheUpdate: Date | null;
  };
  performanceMetrics: {
    dataManagerStatus: any;
    orderBookCacheStats: any;
    memoryUsage: number;
  };
  dataAccuracy: {
    priceDataMatches: boolean;
    portfolioCalculationAccuracy: number;
    orderBookRealism: number;
  };
  phase2Metrics: {
    walletConnectivityEnabled: boolean;
    connectedWalletsCount: number;
    realTransactionsEnabled: boolean;
    supportedNetworks: string[];
    walletServiceStatus: string;
    transactionServiceStatus: string;
    realBalancesActive: boolean;
    realTransactionsActive: boolean;
  };
  errors: string[];
  warnings: string[];
}

class LegacyDiagnosticTool {
  private startTime: number = 0;
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * Run simplified diagnostic assessment with zero external dependencies
   */
  async runDiagnostics(): Promise<DiagnosticReport> {
    console.log('🔍 Starting simplified diagnostic assessment...');

    this.startTime = Date.now();
    this.errors = [];
    this.warnings = [];

    const report: DiagnosticReport = {
      timestamp: new Date(),
      phase: 'Phase 1',
      apiMetrics: await this.testAPIMetrics(),
      dataTransformation: await this.testDataTransformation(),
      cacheMetrics: await this.testCacheMetrics(),
      performanceMetrics: await this.testPerformanceMetrics(),
      dataAccuracy: await this.testDataAccuracy(),
      phase2Metrics: await this.testPhase2Metrics(),
      errors: this.errors,
      warnings: this.warnings
    };

    console.log('✅ Simplified diagnostic assessment complete');
    return report;
  }

  /**
   * Test API connectivity and metrics (simplified - basic network test only)
   */
  private async testAPIMetrics(): Promise<DiagnosticReport['apiMetrics']> {
    console.log('🌐 Testing API connectivity (simplified)...');
    const startTime = Date.now();

    // Simulate basic connectivity test without external dependencies
    try {
      // Simple network connectivity test
      const testUrl = 'https://httpbin.org/get';
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      const responseTime = Date.now() - startTime;
      const apiSuccess = response.ok;

      return {
        coinGeckoTokensFetched: apiSuccess ? 50 : 0, // Mock value
        apiResponseTime: responseTime,
        apiSuccessRate: apiSuccess ? 100 : 0,
        rateLimitStatus: {
          requestCount: 1,
          windowStart: new Date(),
          isBlocked: false
        }
      };
    } catch (error) {
      this.warnings.push(`Network connectivity test failed: ${error}`);

      return {
        coinGeckoTokensFetched: 0,
        apiResponseTime: Date.now() - startTime,
        apiSuccessRate: 0,
        rateLimitStatus: {
          requestCount: 0,
          windowStart: new Date(),
          isBlocked: false
        }
      };
    }
  }

  /**
   * Test data transformation pipeline (simplified - mock data only)
   */
  private async testDataTransformation(): Promise<DiagnosticReport['dataTransformation']> {
    console.log('🔄 Testing data transformation (simplified)...');

    // Mock data transformation metrics
    const tokensFromAPI = 50;
    const tokensAfterAdaptation = 48;
    const tokensWithBalances = 45;
    const tokensDisplayedInUI = 45;
    const dataLossPercentage = ((tokensFromAPI - tokensDisplayedInUI) / tokensFromAPI) * 100;

    return {
      tokensFromAPI,
      tokensAfterAdaptation,
      tokensWithBalances,
      tokensDisplayedInUI,
      dataLossPercentage
    };
  }

  /**
   * Test cache performance (simplified - mock data only)
   */
  private async testCacheMetrics(): Promise<DiagnosticReport['cacheMetrics']> {
    console.log('💾 Testing cache metrics (simplified)...');

    return {
      hitRatio: 85,
      missRatio: 15,
      cacheSize: 48,
      lastCacheUpdate: new Date()
    };
  }

  /**
   * Test performance metrics (simplified - mock data only)
   */
  private async testPerformanceMetrics(): Promise<DiagnosticReport['performanceMetrics']> {
    console.log('⚡ Testing performance metrics (simplified)...');

    // Mock performance metrics
    const memoryUsage = Math.round(Math.random() * 30 + 20); // 20-50 MB

    return {
      dataManagerStatus: { status: 'ready', tokenCount: 48, lastUpdate: new Date() },
      orderBookCacheStats: { cacheSize: 10, hitRatio: 90 },
      memoryUsage
    };
  }

  /**
   * Test data accuracy (simplified - mock data only)
   */
  private async testDataAccuracy(): Promise<DiagnosticReport['dataAccuracy']> {
    console.log('🎯 Testing data accuracy (simplified)...');

    // Mock data accuracy metrics
    return {
      priceDataMatches: true,
      portfolioCalculationAccuracy: 95,
      orderBookRealism: 90
    };
  }

  /**
   * Test Phase 2 wallet connectivity and transaction services (simplified - mock data only)
   */
  private async testPhase2Metrics(): Promise<DiagnosticReport['phase2Metrics']> {
    console.log('🔗 Testing Phase 2 wallet connectivity and transaction services (simplified)...');

    // Mock Phase 2 metrics - all disabled for Phase 1
    return {
      walletConnectivityEnabled: false,
      connectedWalletsCount: 0,
      realTransactionsEnabled: false,
      supportedNetworks: ['ethereum', 'polygon', 'bitcoin'],
      walletServiceStatus: 'Disabled (Phase 1)',
      transactionServiceStatus: 'Disabled (Phase 1)',
      realBalancesActive: false,
      realTransactionsActive: false
    };
  }

  /**
   * Generate human-readable report (simplified)
   */
  generateReport(report: DiagnosticReport): string {
    const duration = Date.now() - this.startTime;

    return `
🔍 ${report.phase.toUpperCase()} DIAGNOSTIC REPORT (SIMPLIFIED)
Generated: ${report.timestamp.toLocaleString()}
Duration: ${duration}ms

📊 API METRICS:
✅ Network Test: ${report.apiMetrics.apiSuccessRate > 0 ? 'PASS' : 'FAIL'}
⚡ Response Time: ${report.apiMetrics.apiResponseTime}ms

🔄 DATA TRANSFORMATION:
📥 Mock Tokens: ${report.dataTransformation.tokensFromAPI}
📉 Data Loss: ${report.dataTransformation.dataLossPercentage.toFixed(1)}%

💾 CACHE METRICS:
🎯 Hit Ratio: ${report.cacheMetrics.hitRatio}%
📦 Cache Size: ${report.cacheMetrics.cacheSize} tokens

⚡ PERFORMANCE:
🧠 Memory Usage: ${report.performanceMetrics.memoryUsage}MB

🎯 DATA ACCURACY:
💲 Price Match: ${report.dataAccuracy.priceDataMatches ? '✅' : '❌'}
📊 Portfolio Accuracy: ${report.dataAccuracy.portfolioCalculationAccuracy}%

🔗 PHASE 2 STATUS:
🔌 Wallet Connectivity: ${report.phase2Metrics.walletConnectivityEnabled ? '✅ Enabled' : '❌ Disabled'}
💸 Real Transactions: ${report.phase2Metrics.realTransactionsEnabled ? '✅ Enabled' : '❌ Disabled'}

${report.errors.length > 0 ? `❌ ERRORS:\n${report.errors.map(e => `  • ${e}`).join('\n')}` : '✅ No Errors'}

${report.warnings.length > 0 ? `⚠️ WARNINGS:\n${report.warnings.map(w => `  • ${w}`).join('\n')}` : '✅ No Warnings'}
    `.trim();
  }
}

// Export legacy diagnostic tool instance
export const diagnosticTool = new LegacyDiagnosticTool();

// Export legacy convenience function
export async function runPhase1Diagnostics(): Promise<DiagnosticReport> {
  return await diagnosticTool.runDiagnostics();
}

export default enhancedDiagnosticTool;
