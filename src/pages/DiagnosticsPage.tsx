import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { runPhase1Diagnostics, diagnosticTool, DiagnosticReport } from '@/utils/diagnostics';
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

const DiagnosticsPage: React.FC = () => {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Running Phase 1 diagnostics...');
      const diagnosticReport = await runPhase1Diagnostics();
      setReport(diagnosticReport);
      
      // Also log to console for debugging
      const reportText = diagnosticTool.generateReport(diagnosticReport);
      console.log(reportText);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Diagnostic failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run diagnostics on page load
    runDiagnostics();
  }, []);

  const getStatusIcon = (value: number, threshold: number = 80) => {
    if (value >= threshold) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (value >= 60) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusColor = (value: number, threshold: number = 80) => {
    if (value >= threshold) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (value >= 60) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  return (
    <div className="pb-24 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Phase 1 Diagnostics</h1>
          <p className="text-dex-text-secondary">Real-time data implementation verification</p>
        </div>
        <Button
          onClick={runDiagnostics}
          disabled={loading}
          className="bg-dex-primary text-white"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Activity className="w-4 h-4 mr-2" />
              Run Diagnostics
            </>
          )}
        </Button>
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

      {report && (
        <>
          {/* API Metrics */}
          <Card className="bg-dex-dark/80 border-dex-primary/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                API Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-dex-text-secondary">Tokens Fetched</div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(report.apiMetrics.coinGeckoTokensFetched, 50)}
                    <span className="text-white font-semibold">{report.apiMetrics.coinGeckoTokensFetched}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-dex-text-secondary">Response Time</div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(report.apiMetrics.apiResponseTime < 2000 ? 90 : 50)}
                    <span className="text-white font-semibold">{report.apiMetrics.apiResponseTime}ms</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-dex-text-secondary">Success Rate</div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(report.apiMetrics.apiSuccessRate)}
                    <span className="text-white font-semibold">{report.apiMetrics.apiSuccessRate}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Transformation */}
          <Card className="bg-dex-dark/80 border-dex-primary/30">
            <CardHeader>
              <CardTitle className="text-white">Data Transformation Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{report.dataTransformation.tokensFromAPI}</div>
                  <div className="text-sm text-dex-text-secondary">From API</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{report.dataTransformation.tokensAfterAdaptation}</div>
                  <div className="text-sm text-dex-text-secondary">After Adaptation</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{report.dataTransformation.tokensWithBalances}</div>
                  <div className="text-sm text-dex-text-secondary">With Balances</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{report.dataTransformation.tokensDisplayedInUI}</div>
                  <div className="text-sm text-dex-text-secondary">In UI</div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <Badge className={getStatusColor(100 - report.dataTransformation.dataLossPercentage)}>
                  Data Loss: {report.dataTransformation.dataLossPercentage.toFixed(1)}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Data Accuracy */}
          <Card className="bg-dex-dark/80 border-dex-primary/30">
            <CardHeader>
              <CardTitle className="text-white">Data Accuracy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-dex-text-secondary">Price Data Match</div>
                  <div className="flex items-center gap-2">
                    {report.dataAccuracy.priceDataMatches ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-white font-semibold">
                      {report.dataAccuracy.priceDataMatches ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-dex-text-secondary">Portfolio Accuracy</div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(report.dataAccuracy.portfolioCalculationAccuracy)}
                    <span className="text-white font-semibold">{report.dataAccuracy.portfolioCalculationAccuracy}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-dex-text-secondary">Order Book Realism</div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(report.dataAccuracy.orderBookRealism)}
                    <span className="text-white font-semibold">{report.dataAccuracy.orderBookRealism}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues */}
          {(report.errors.length > 0 || report.warnings.length > 0) && (
            <Card className="bg-dex-dark/80 border-dex-primary/30">
              <CardHeader>
                <CardTitle className="text-white">Issues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.errors.length > 0 && (
                  <div>
                    <h4 className="text-red-500 font-semibold mb-2">Errors</h4>
                    <ul className="space-y-1">
                      {report.errors.map((error, index) => (
                        <li key={index} className="text-red-400 text-sm flex items-center gap-2">
                          <XCircle className="w-3 h-3" />
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {report.warnings.length > 0 && (
                  <div>
                    <h4 className="text-yellow-500 font-semibold mb-2">Warnings</h4>
                    <ul className="space-y-1">
                      {report.warnings.map((warning, index) => (
                        <li key={index} className="text-yellow-400 text-sm flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3" />
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card className="bg-dex-dark/80 border-dex-primary/30">
            <CardHeader>
              <CardTitle className="text-white">Phase 1 Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-3xl font-bold text-green-500">
                  {((report.apiMetrics.apiSuccessRate + 
                     (100 - report.dataTransformation.dataLossPercentage) + 
                     report.dataAccuracy.portfolioCalculationAccuracy + 
                     report.dataAccuracy.orderBookRealism) / 4).toFixed(1)}%
                </div>
                <div className="text-dex-text-secondary">Overall Implementation Score</div>
                <div className="text-sm text-white">
                  Generated: {report.timestamp.toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DiagnosticsPage;
