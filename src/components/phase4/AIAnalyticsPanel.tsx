/**
 * Phase 4.4 AI Analytics Panel Component
 * Main dashboard interface for AI-powered portfolio optimization, risk assessment,
 * performance metrics, and predictive analytics using real blockchain data
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, Brain, Target, BarChart3, Activity } from 'lucide-react';

// Import Phase 4.4 services
import { aiAnalyticsService, PortfolioOptimization, RiskAssessment, MarketSentiment } from '@/services/phase4/aiAnalyticsService';
import { predictiveAnalyticsService, PricePrediction, MarketTrendAnalysis } from '@/services/phase4/predictiveAnalyticsService';
import { performanceMetricsService, AdvancedMetrics, CorrelationAnalysis } from '@/services/phase4/performanceMetricsService';

// Component interfaces
interface AIAnalyticsPanelProps {
  userId: string;
  className?: string;
}

interface LoadingState {
  optimization: boolean;
  riskAssessment: boolean;
  performance: boolean;
  predictions: boolean;
}

interface ErrorState {
  optimization: string | null;
  riskAssessment: string | null;
  performance: string | null;
  predictions: string | null;
}

/**
 * AI Analytics Panel Component
 * Provides comprehensive AI-powered portfolio analytics and insights
 */
export const AIAnalyticsPanel: React.FC<AIAnalyticsPanelProps> = ({ userId, className = '' }) => {
  // State management
  const [activeTab, setActiveTab] = useState<'optimization' | 'risk' | 'performance' | 'predictions'>('optimization');
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '1y'>('30d');

  // Data state
  const [portfolioOptimization, setPortfolioOptimization] = useState<PortfolioOptimization | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<AdvancedMetrics | null>(null);
  const [marketSentiment, setMarketSentiment] = useState<MarketSentiment | null>(null);
  const [pricePredictions, setPricePredictions] = useState<PricePrediction[]>([]);
  const [marketTrend, setMarketTrend] = useState<MarketTrendAnalysis | null>(null);
  const [correlationAnalysis, setCorrelationAnalysis] = useState<CorrelationAnalysis | null>(null);

  // Loading and error states
  const [loading, setLoading] = useState<LoadingState>({
    optimization: false,
    riskAssessment: false,
    performance: false,
    predictions: false
  });

  const [errors, setErrors] = useState<ErrorState>({
    optimization: null,
    riskAssessment: null,
    performance: null,
    predictions: null
  });

  const [servicesInitialized, setServicesInitialized] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);

  /**
   * Initialize AI Analytics services
   */
  const initializeServices = useCallback(async () => {
    try {
      console.log('🔄 Initializing AI Analytics services...');

      const [aiInit, predictiveInit, performanceInit] = await Promise.all([
        aiAnalyticsService.initialize(),
        predictiveAnalyticsService.initialize(),
        performanceMetricsService.initialize()
      ]);

      const allServicesReady = aiInit && predictiveInit && performanceInit;

      if (!allServicesReady) {
        console.warn('⚠️ Some AI services failed to initialize, activating fallback mode');
        setFallbackMode(true);
      }

      setServicesInitialized(true);
      console.log('✅ AI Analytics services initialized');

    } catch (error) {
      console.error('❌ Failed to initialize AI Analytics services:', error);
      setFallbackMode(true);
      setServicesInitialized(true);
    }
  }, []);

  /**
   * Load portfolio optimization data
   */
  const loadPortfolioOptimization = useCallback(async () => {
    if (!servicesInitialized) return;

    setLoading(prev => ({ ...prev, optimization: true }));
    setErrors(prev => ({ ...prev, optimization: null }));

    try {
      const optimization = await aiAnalyticsService.getPortfolioOptimization(userId);
      setPortfolioOptimization(optimization);
    } catch (error) {
      console.error('❌ Error loading portfolio optimization:', error);
      setErrors(prev => ({ ...prev, optimization: 'Failed to load portfolio optimization' }));
    } finally {
      setLoading(prev => ({ ...prev, optimization: false }));
    }
  }, [userId, servicesInitialized]);

  /**
   * Load risk assessment data
   */
  const loadRiskAssessment = useCallback(async () => {
    if (!servicesInitialized) return;

    setLoading(prev => ({ ...prev, riskAssessment: true }));
    setErrors(prev => ({ ...prev, riskAssessment: null }));

    try {
      const [risk, sentiment] = await Promise.all([
        aiAnalyticsService.getRiskAssessment(userId),
        aiAnalyticsService.getMarketSentiment()
      ]);

      setRiskAssessment(risk);
      setMarketSentiment(sentiment);
    } catch (error) {
      console.error('❌ Error loading risk assessment:', error);
      setErrors(prev => ({ ...prev, riskAssessment: 'Failed to load risk assessment' }));
    } finally {
      setLoading(prev => ({ ...prev, riskAssessment: false }));
    }
  }, [userId, servicesInitialized]);

  /**
   * Load performance metrics data
   */
  const loadPerformanceMetrics = useCallback(async () => {
    if (!servicesInitialized) return;

    setLoading(prev => ({ ...prev, performance: true }));
    setErrors(prev => ({ ...prev, performance: null }));

    try {
      const [metrics, correlation] = await Promise.all([
        performanceMetricsService.calculateAdvancedMetrics(userId, timeframe),
        performanceMetricsService.analyzeCorrelations(userId)
      ]);

      setPerformanceMetrics(metrics);
      setCorrelationAnalysis(correlation);
    } catch (error) {
      console.error('❌ Error loading performance metrics:', error);
      setErrors(prev => ({ ...prev, performance: 'Failed to load performance metrics' }));
    } finally {
      setLoading(prev => ({ ...prev, performance: false }));
    }
  }, [userId, timeframe, servicesInitialized]);

  /**
   * Load predictive analytics data
   */
  const loadPredictiveAnalytics = useCallback(async () => {
    if (!servicesInitialized) return;

    setLoading(prev => ({ ...prev, predictions: true }));
    setErrors(prev => ({ ...prev, predictions: null }));

    try {
      const [predictions, trend] = await Promise.all([
        predictiveAnalyticsService.getPricePredictions(['BTC', 'ETH', 'MATIC', 'USDC'], timeframe),
        predictiveAnalyticsService.getMarketTrendAnalysis()
      ]);

      setPricePredictions(predictions);
      setMarketTrend(trend);
    } catch (error) {
      console.error('❌ Error loading predictive analytics:', error);
      setErrors(prev => ({ ...prev, predictions: 'Failed to load predictive analytics' }));
    } finally {
      setLoading(prev => ({ ...prev, predictions: false }));
    }
  }, [timeframe, servicesInitialized]);

  /**
   * Refresh all data
   */
  const refreshAllData = useCallback(async () => {
    await Promise.all([
      loadPortfolioOptimization(),
      loadRiskAssessment(),
      loadPerformanceMetrics(),
      loadPredictiveAnalytics()
    ]);
  }, [loadPortfolioOptimization, loadRiskAssessment, loadPerformanceMetrics, loadPredictiveAnalytics]);

  // Initialize services on mount
  useEffect(() => {
    initializeServices();
  }, [initializeServices]);

  // Load data when services are ready
  useEffect(() => {
    if (servicesInitialized) {
      refreshAllData();
    }
  }, [servicesInitialized, refreshAllData]);

  // Refresh data when timeframe changes
  useEffect(() => {
    if (servicesInitialized) {
      loadPerformanceMetrics();
      loadPredictiveAnalytics();
    }
  }, [timeframe, loadPerformanceMetrics, loadPredictiveAnalytics]);

  /**
   * Get risk level color
   */
  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'extreme': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  /**
   * Get trend icon
   */
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish':
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'bearish':
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  /**
   * Format percentage
   */
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };

  /**
   * Format currency
   */
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  if (!servicesInitialized) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF3B30] mx-auto mb-4" />
          <p className="text-white">Initializing AI Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-[#FF3B30]" />
          <h2 className="text-2xl font-bold text-white">AI Analytics</h2>
          {fallbackMode && (
            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
              Fallback Mode
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Timeframe Selector */}
          <div className="flex space-x-2">
            {(['24h', '7d', '30d', '1y'] as const).map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe(tf)}
                className={timeframe === tf ? 'bg-[#FF3B30] text-white' : 'text-gray-400 border-gray-600'}
              >
                {tf}
              </Button>
            ))}
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAllData}
            disabled={Object.values(loading).some(Boolean)}
            className="text-gray-400 border-gray-600 hover:text-white"
          >
            {Object.values(loading).some(Boolean) ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Refresh'
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[#1C1C1E]">
          <TabsTrigger value="optimization" className="data-[state=active]:bg-[#FF3B30] data-[state=active]:text-white">
            <Target className="w-4 h-4 mr-2" />
            Optimization
          </TabsTrigger>
          <TabsTrigger value="risk" className="data-[state=active]:bg-[#FF3B30] data-[state=active]:text-white">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Risk Analysis
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-[#FF3B30] data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="predictions" className="data-[state=active]:bg-[#FF3B30] data-[state=active]:text-white">
            <Activity className="w-4 h-4 mr-2" />
            Predictions
          </TabsTrigger>
        </TabsList>

        {/* Portfolio Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          {errors.optimization && (
            <Alert className="border-red-500 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                {errors.optimization}
              </AlertDescription>
            </Alert>
          )}

          {loading.optimization ? (
            <Card className="bg-[#1C1C1E] border-gray-700">
              <CardContent className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF3B30] mr-2" />
                <span className="text-white">Loading portfolio optimization...</span>
              </CardContent>
            </Card>
          ) : portfolioOptimization ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Current vs Recommended Allocation */}
              <Card className="bg-[#1C1C1E] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Target className="w-5 h-5 mr-2 text-[#FF3B30]" />
                    Portfolio Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {Object.entries(portfolioOptimization.currentAllocation).map(([token, current]) => {
                      const recommended = portfolioOptimization.recommendedAllocation[token] || 0;
                      const difference = recommended - current;

                      return (
                        <div key={token} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-medium">{token}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">{current}%</span>
                              <span className="text-gray-500">→</span>
                              <span className="text-[#FF3B30]">{recommended}%</span>
                              {difference !== 0 && (
                                <span className={`text-sm ${difference > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  ({difference > 0 ? '+' : ''}{difference.toFixed(1)}%)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-[#FF3B30] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${recommended}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Optimization Metrics */}
              <Card className="bg-[#1C1C1E] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Optimization Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-gray-400 text-sm">Expected Return</p>
                      <p className="text-white font-semibold">{formatPercentage(portfolioOptimization.expectedReturn)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400 text-sm">Expected Risk</p>
                      <p className="text-white font-semibold">{formatPercentage(portfolioOptimization.expectedRisk)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400 text-sm">Sharpe Ratio</p>
                      <p className="text-white font-semibold">{portfolioOptimization.sharpeRatio.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400 text-sm">Confidence</p>
                      <p className="text-white font-semibold">{formatPercentage(portfolioOptimization.confidence)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-[#1C1C1E] border-gray-700">
              <CardContent className="text-center p-8">
                <p className="text-gray-400">No optimization data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Risk Analysis Tab */}
        <TabsContent value="risk" className="space-y-4">
          {errors.riskAssessment && (
            <Alert className="border-red-500 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                {errors.riskAssessment}
              </AlertDescription>
            </Alert>
          )}

          {loading.riskAssessment ? (
            <Card className="bg-[#1C1C1E] border-gray-700">
              <CardContent className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF3B30] mr-2" />
                <span className="text-white">Loading risk assessment...</span>
              </CardContent>
            </Card>
          ) : riskAssessment ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Risk Overview */}
              <Card className="bg-[#1C1C1E] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-[#FF3B30]" />
                    Risk Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-2">
                      {riskAssessment.overallRiskScore}
                    </div>
                    <div className={`text-lg font-semibold ${getRiskLevelColor(riskAssessment.riskLevel)}`}>
                      {riskAssessment.riskLevel.toUpperCase()} RISK
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Diversification</span>
                      <span className="text-white">{riskAssessment.diversificationScore}/100</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Volatility</span>
                      <span className="text-white">{riskAssessment.volatilityScore}/100</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Correlation Risk</span>
                      <span className="text-white">{riskAssessment.correlationRisk}/100</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Market Sentiment */}
              {marketSentiment && (
                <Card className="bg-[#1C1C1E] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-[#FF3B30]" />
                      Market Sentiment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Overall Sentiment</span>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(marketSentiment.overallSentiment)}
                        <span className="text-white capitalize">{marketSentiment.overallSentiment}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Fear & Greed Index</span>
                      <span className="text-white">{marketSentiment.fearGreedIndex}/100</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Market Trend</span>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(marketSentiment.marketTrend)}
                        <span className="text-white capitalize">{marketSentiment.marketTrend}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Volatility Level</span>
                      <span className="text-white capitalize">{marketSentiment.volatilityLevel}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="bg-[#1C1C1E] border-gray-700">
              <CardContent className="text-center p-8">
                <p className="text-gray-400">No risk assessment data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          {errors.performance && (
            <Alert className="border-red-500 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                {errors.performance}
              </AlertDescription>
            </Alert>
          )}

          {loading.performance ? (
            <Card className="bg-[#1C1C1E] border-gray-700">
              <CardContent className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF3B30] mr-2" />
                <span className="text-white">Loading performance metrics...</span>
              </CardContent>
            </Card>
          ) : performanceMetrics ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Key Metrics */}
              <Card className="bg-[#1C1C1E] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-[#FF3B30]" />
                    Key Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-gray-400 text-sm">Total Return</p>
                      <p className="text-white font-semibold">{formatPercentage(performanceMetrics.totalReturn)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400 text-sm">Annualized Return</p>
                      <p className="text-white font-semibold">{formatPercentage(performanceMetrics.annualizedReturn)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400 text-sm">Sharpe Ratio</p>
                      <p className="text-white font-semibold">{performanceMetrics.sharpeRatio.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400 text-sm">Max Drawdown</p>
                      <p className="text-red-400 font-semibold">{formatPercentage(performanceMetrics.maxDrawdown)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400 text-sm">Alpha</p>
                      <p className="text-white font-semibold">{formatPercentage(performanceMetrics.alpha)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400 text-sm">Beta</p>
                      <p className="text-white font-semibold">{performanceMetrics.beta.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Correlation Analysis */}
              {correlationAnalysis && (
                <Card className="bg-[#1C1C1E] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Asset Correlations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Average Correlation</span>
                        <span className="text-white">{(correlationAnalysis.averageCorrelation * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Diversification Ratio</span>
                        <span className="text-white">{(correlationAnalysis.diversificationRatio * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Concentration Risk</span>
                        <span className="text-white">{(correlationAnalysis.concentrationRisk * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    {correlationAnalysis.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-gray-400 text-sm">Recommendations:</p>
                        {correlationAnalysis.recommendations.slice(0, 2).map((rec, index) => (
                          <p key={index} className="text-sm text-gray-300">• {rec}</p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="bg-[#1C1C1E] border-gray-700">
              <CardContent className="text-center p-8">
                <p className="text-gray-400">No performance data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          {errors.predictions && (
            <Alert className="border-red-500 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                {errors.predictions}
              </AlertDescription>
            </Alert>
          )}

          {loading.predictions ? (
            <Card className="bg-[#1C1C1E] border-gray-700">
              <CardContent className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF3B30] mr-2" />
                <span className="text-white">Loading predictions...</span>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Market Trend Analysis */}
              {marketTrend && (
                <Card className="bg-[#1C1C1E] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-[#FF3B30]" />
                      Market Trend Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <p className="text-gray-400 text-sm">Overall Trend</p>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(marketTrend.overallTrend)}
                          <span className="text-white capitalize">{marketTrend.overallTrend.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-gray-400 text-sm">Trend Strength</p>
                        <p className="text-white">{marketTrend.trendStrength}/100</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-gray-400 text-sm">Market Phase</p>
                        <p className="text-white capitalize">{marketTrend.marketPhase}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Short Term</p>
                        <div className="flex items-center justify-center space-x-1">
                          {getTrendIcon(marketTrend.predictions.shortTerm)}
                          <span className="text-white capitalize">{marketTrend.predictions.shortTerm}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Medium Term</p>
                        <div className="flex items-center justify-center space-x-1">
                          {getTrendIcon(marketTrend.predictions.mediumTerm)}
                          <span className="text-white capitalize">{marketTrend.predictions.mediumTerm}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Long Term</p>
                        <div className="flex items-center justify-center space-x-1">
                          {getTrendIcon(marketTrend.predictions.longTerm)}
                          <span className="text-white capitalize">{marketTrend.predictions.longTerm}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Price Predictions */}
              {pricePredictions.length > 0 && (
                <Card className="bg-[#1C1C1E] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Price Predictions ({timeframe})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pricePredictions.map((prediction) => (
                        <div key={prediction.token} className="flex items-center justify-between p-3 bg-[#2C2C2E] rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="text-white font-medium">{prediction.token}</span>
                            <div className="flex items-center space-x-1">
                              {getTrendIcon(prediction.trend)}
                              <span className="text-sm text-gray-400 capitalize">{prediction.trend}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">{formatCurrency(prediction.currentPrice)}</span>
                              <span className="text-gray-500">→</span>
                              <span className="text-white">{formatCurrency(prediction.predictedPrice)}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <span className={prediction.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {prediction.priceChangePercent >= 0 ? '+' : ''}{prediction.priceChangePercent.toFixed(1)}%
                              </span>
                              <span className="text-gray-400">({prediction.confidence}% confidence)</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
