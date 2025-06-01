import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { runPhase1Diagnostics, DiagnosticReport } from '@/utils/enhancedDiagnostics';
import { runEnhancedDiagnostics, EnhancedDiagnosticReport } from '@/utils/enhancedDiagnostics';
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw, Zap, Settings } from 'lucide-react';

const EnhancedDiagnosticsPage: React.FC = () => {
  const [basicReport, setBasicReport] = useState<DiagnosticReport | null>(null);
  const [enhancedReport, setEnhancedReport] = useState<EnhancedDiagnosticReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  const runBasicDiagnostics = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Running basic diagnostics...');
      const report = await runPhase1Diagnostics();
      setBasicReport(report);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Basic diagnostic failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const runAdvancedDiagnostics = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Running enhanced diagnostics...');
      const report = await runEnhancedDiagnostics();
      setEnhancedReport(report);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Enhanced diagnostic failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const runAllDiagnostics = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Running comprehensive diagnostics...');
      const [basic, enhanced] = await Promise.all([
        runPhase1Diagnostics(),
        runEnhancedDiagnostics()
      ]);
      setBasicReport(basic);
      setEnhancedReport(enhanced);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Comprehensive diagnostic failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run basic diagnostics on page load
    runBasicDiagnostics();
  }, []);

  const getStatusIcon = (value: number | boolean, threshold: number = 80) => {
    if (typeof value === 'boolean') {
      return value ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (value >= threshold) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (value >= 60) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusColor = (value: number | boolean, threshold: number = 80) => {
    if (typeof value === 'boolean') {
      return value ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20';
    }
    if (value >= threshold) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (value >= 60) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  return (
    <div className="pb-24 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Enhanced Diagnostics
          </h1>
          <p className="text-dex-text-secondary">
            Comprehensive system analysis with Phase 1/2 detection
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runBasicDiagnostics}
            disabled={loading}
            variant="outline"
            className="border-dex-primary/30 text-white"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Activity className="w-4 h-4 mr-2" />
            )}
            Basic
          </Button>
          <Button
            onClick={runAdvancedDiagnostics}
            disabled={loading}
            variant="outline"
            className="border-dex-primary/30 text-white"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Advanced
          </Button>
          <Button
            onClick={runAllDiagnostics}
            disabled={loading}
            className="bg-dex-primary text-white"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Settings className="w-4 h-4 mr-2" />
            )}
            Run All
          </Button>
        </div>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-500">
              <XCircle className="w-5 h-5" />
              <span>Diagnostic Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-dex-dark/50">
          <TabsTrigger value="basic" className="data-[state=active]:bg-dex-primary">
            Basic Diagnostics
          </TabsTrigger>
          <TabsTrigger value="enhanced" className="data-[state=active]:bg-dex-primary">
            Enhanced Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          {basicReport && (
            <>
              {/* API Metrics */}
              <Card className="bg-dex-dark/80 border-dex-primary/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    API Metrics ({basicReport.phase})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm text-dex-text-secondary">Network Test</div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(basicReport.apiMetrics.apiSuccessRate)}
                        <span className="text-white font-semibold">
                          {basicReport.apiMetrics.apiSuccessRate > 0 ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-dex-text-secondary">Response Time</div>
                      <div className="text-white font-semibold">{basicReport.apiMetrics.apiResponseTime}ms</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-dex-text-secondary">Success Rate</div>
                      <div className="text-white font-semibold">{basicReport.apiMetrics.apiSuccessRate}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Transformation */}
              <Card className="bg-dex-dark/80 border-dex-primary/30">
                <CardHeader>
                  <CardTitle className="text-white">Data Pipeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{basicReport.dataTransformation.tokensFromAPI}</div>
                      <div className="text-sm text-dex-text-secondary">From API</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{basicReport.dataTransformation.tokensDisplayedInUI}</div>
                      <div className="text-sm text-dex-text-secondary">In UI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{basicReport.performanceMetrics.memoryUsage}MB</div>
                      <div className="text-sm text-dex-text-secondary">Memory</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{basicReport.dataTransformation.dataLossPercentage.toFixed(1)}%</div>
                      <div className="text-sm text-dex-text-secondary">Data Loss</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="enhanced" className="space-y-6">
          {enhancedReport && (
            <>
              {/* Phase Detection */}
              <Card className="bg-dex-dark/80 border-dex-primary/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Phase Detection & Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-dex-text-secondary">Detected Phase:</span>
                    <Badge className={getStatusColor(enhancedReport.detectedPhase === 'Phase 2')}>
                      {enhancedReport.detectedPhase}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm text-dex-text-secondary">Real Wallets</div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(enhancedReport.phaseDetection.realWalletsEnabled)}
                        <span className="text-white font-semibold">
                          {enhancedReport.phaseDetection.realWalletsEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-dex-text-secondary">Real Transactions</div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(enhancedReport.phaseDetection.realTransactionsEnabled)}
                        <span className="text-white font-semibold">
                          {enhancedReport.phaseDetection.realTransactionsEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-dex-text-secondary">Available Services</div>
                    <div className="text-white text-sm">
                      {enhancedReport.phaseDetection.phase2ServicesAvailable.length > 0 
                        ? enhancedReport.phaseDetection.phase2ServicesAvailable.join(', ')
                        : 'None (Phase 1 Mode)'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Connectivity Tests */}
              <Card className="bg-dex-dark/80 border-dex-primary/30">
                <CardHeader>
                  <CardTitle className="text-white">Connectivity & API Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm text-dex-text-secondary">Network</div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(enhancedReport.connectivityTests.networkConnectivity)}
                        <span className="text-white font-semibold">
                          {enhancedReport.connectivityTests.networkConnectivity ? 'Connected' : 'Offline'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-dex-text-secondary">CoinGecko API</div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(enhancedReport.connectivityTests.coinGeckoAPI)}
                        <span className="text-white font-semibold">
                          {enhancedReport.connectivityTests.coinGeckoAPI ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-dex-text-secondary">Response Time</div>
                      <div className="text-white font-semibold">{enhancedReport.connectivityTests.responseTime}ms</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Application Health */}
              <Card className="bg-dex-dark/80 border-dex-primary/30">
                <CardHeader>
                  <CardTitle className="text-white">Application Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-3xl font-bold text-green-500">
                      {enhancedReport.applicationHealth.performanceScore}%
                    </div>
                    <div className="text-dex-text-secondary">Performance Score</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-dex-text-secondary">Memory: </span>
                        <span className="text-white">{enhancedReport.applicationHealth.memoryUsage}MB</span>
                      </div>
                      <div>
                        <span className="text-dex-text-secondary">Build: </span>
                        <span className="text-white">{enhancedReport.applicationHealth.buildStatus}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedDiagnosticsPage;
