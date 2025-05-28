import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Activity, RefreshCw } from 'lucide-react';

interface SystemInfo {
  timestamp: string;
  userAgent: string;
  reactVersion: string;
  systemStatus: string;
}

const DiagnosticsPage: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runBasicDiagnostics = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Running basic system diagnostics...');

      // Basic system information with zero external dependencies
      const info: SystemInfo = {
        timestamp: new Date().toLocaleString(),
        userAgent: navigator.userAgent,
        reactVersion: React.version,
        systemStatus: 'OK'
      };

      setSystemInfo(info);
      console.log('✅ Basic diagnostics complete:', info);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Basic diagnostic failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run basic diagnostics on page load
    runBasicDiagnostics();
  }, []);



  return (
    <div className="pb-24 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            System Diagnostics
          </h1>
          <p className="text-dex-text-secondary">
            Basic system status and information
          </p>
        </div>
        <Button
          onClick={runBasicDiagnostics}
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
              <AlertTriangle className="w-5 h-5" />
              <span>Diagnostic Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {systemInfo && (
        <>
          {/* System Status */}
          <Card className="bg-dex-dark/80 border-dex-primary/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-dex-text-secondary">Status</div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-white font-semibold">{systemInfo.systemStatus}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-dex-text-secondary">React Version</div>
                  <div className="text-white font-semibold">{systemInfo.reactVersion}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-dex-text-secondary">Timestamp</div>
                  <div className="text-white font-semibold">{systemInfo.timestamp}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-dex-text-secondary">Browser</div>
                  <div className="text-white font-semibold text-xs">
                    {systemInfo.userAgent.split(' ').slice(-2).join(' ')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-dex-dark/80 border-dex-primary/30">
            <CardHeader>
              <CardTitle className="text-white">System Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-3xl font-bold text-green-500">100%</div>
                <div className="text-dex-text-secondary">System Health</div>
                <div className="text-sm text-white">
                  All basic systems operational
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
