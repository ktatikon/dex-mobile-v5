/**
 * Microservice Connection Debugger
 * 
 * This component helps debug microservice connection issues
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';

interface DebugResult {
  test: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export const MicroserviceDebugger: React.FC = () => {
  const [results, setResults] = useState<DebugResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test: string, success: boolean, data?: any, error?: string) => {
    const result: DebugResult = {
      test,
      success,
      data,
      error,
      timestamp: new Date().toISOString()
    };
    setResults(prev => [result, ...prev]);
    console.log(`🔧 Debug Result [${test}]:`, result);
  };

  const testEnvironmentVariables = () => {
    console.log('🔧 Testing Environment Variables...');
    
    const envVars = {
      REACT_APP_USE_CHART_MICROSERVICE: process.env.REACT_APP_USE_CHART_MICROSERVICE,
      REACT_APP_CHART_API_URL: process.env.REACT_APP_CHART_API_URL,
      NODE_ENV: process.env.NODE_ENV
    };

    addResult('Environment Variables', true, envVars);
    
    // Test boolean conversion
    const microserviceEnabled = process.env.REACT_APP_USE_CHART_MICROSERVICE === 'true';
    addResult('Microservice Enabled Check', microserviceEnabled, { 
      raw: process.env.REACT_APP_USE_CHART_MICROSERVICE,
      boolean: microserviceEnabled 
    });
  };

  const testDirectFetch = async () => {
    console.log('🔧 Testing Direct Fetch...');
    
    try {
      const healthUrl = 'http://localhost:4000/api/v1/health';
      const response = await fetch(healthUrl);
      const data = await response.json();
      
      addResult('Direct Health Check', response.ok, data);
      
      if (response.ok) {
        // Test chart endpoint
        const chartUrl = 'http://localhost:4000/api/v1/chart/bitcoin/1';
        const chartResponse = await fetch(chartUrl);
        const chartData = await chartResponse.json();
        
        addResult('Direct Chart Fetch', chartResponse.ok, {
          dataPoints: chartData.data?.data?.length || 0,
          source: chartData.data?.source
        });
      }
    } catch (error) {
      addResult('Direct Fetch', false, null, error instanceof Error ? error.message : String(error));
    }
  };

  const testChartDataService = async () => {
    console.log('🔧 Testing Chart Data Service...');
    
    try {
      const { chartDataService } = await import('../../services/chartDataService');
      
      // Test service configuration
      const serviceConfig = {
        CHART_API_BASE_URL: process.env.REACT_APP_CHART_API_URL || 'http://localhost:4000/api/v1',
        FEATURE_FLAG_USE_MICROSERVICE: process.env.REACT_APP_USE_CHART_MICROSERVICE === 'true'
      };
      
      addResult('Service Configuration', true, serviceConfig);
      
      // Test actual fetch
      const data = await chartDataService.fetchCandles('bitcoin', '1', true);
      
      addResult('Chart Service Fetch', true, {
        dataPoints: data.length,
        firstPoint: data[0],
        lastPoint: data[data.length - 1]
      });
      
    } catch (error) {
      addResult('Chart Service', false, null, error instanceof Error ? error.message : String(error));
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      testEnvironmentVariables();
      await testDirectFetch();
      await testChartDataService();
    } catch (error) {
      console.error('🔧 Test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Run tests on mount
    runAllTests();
  }, []);

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🔧 Microservice Debugger</h3>
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isRunning ? 'Running...' : 'Run Tests'}
        </Button>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {results.map((result, index) => (
          <div 
            key={index}
            className={`p-3 rounded border-l-4 ${
              result.success 
                ? 'bg-green-900/20 border-green-500' 
                : 'bg-red-900/20 border-red-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {result.success ? '✅' : '❌'} {result.test}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(result.timestamp).toLocaleTimeString()}
              </span>
            </div>
            
            {result.data && (
              <pre className="mt-2 text-xs bg-gray-800 p-2 rounded overflow-x-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
            
            {result.error && (
              <div className="mt-2 text-red-400 text-sm">
                Error: {result.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
