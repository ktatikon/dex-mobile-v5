/**
 * SIGNUP TEST PAGE - SIMPLE TESTING INTERFACE
 * 
 * Simple page to test the signup flow after database migration
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { runComprehensiveSignupTest, SignupTestResult } from '@/scripts/testSignupFlow';
import { runDatabaseMigrationVerification, DatabaseVerificationResult } from '@/scripts/verifyDatabaseMigration';

const SignupTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    results: SignupTestResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      allPassed: boolean;
      criticalIssues: string[];
      recommendations: string[];
    };
  } | null>(null);

  const [verificationResults, setVerificationResults] = useState<{
    results: DatabaseVerificationResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      allPassed: boolean;
      criticalIssues: string[];
      sqlToExecute: string[];
    };
  } | null>(null);

  const runTest = async () => {
    setLoading(true);
    try {
      console.log('🚀 Starting comprehensive signup test...');
      const results = await runComprehensiveSignupTest();
      setTestResults(results);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runVerification = async () => {
    setLoading(true);
    try {
      console.log('🔍 Starting database migration verification...');
      const results = await runDatabaseMigrationVerification();
      setVerificationResults(results);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "✅ PASS" : "❌ FAIL"}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-dex-dark border-dex-primary/30">
          <CardHeader>
            <CardTitle className="text-dex-accent">🧪 Signup Flow Test</CardTitle>
            <p className="text-gray-400">
              Test the signup flow after database migration to verify everything is working
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                onClick={runTest}
                disabled={loading}
                className="bg-dex-accent hover:bg-dex-accent/90"
              >
                {loading ? 'Running Tests...' : 'Run Comprehensive Test'}
              </Button>
              <Button
                onClick={runVerification}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Verifying...' : 'Verify Database Migration'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {testResults && (
          <Card className="bg-dex-dark border-dex-primary/30">
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Test Summary</h4>
                    {getStatusBadge(testResults.summary.allPassed)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>Total: {testResults.summary.total}</div>
                    <div>Passed: {testResults.summary.passed}</div>
                    <div>Failed: {testResults.summary.failed}</div>
                  </div>
                </div>

                {/* Individual Test Results */}
                <div className="space-y-3">
                  {testResults.results.map((result, index) => (
                    <div key={index} className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{result.testName}</h4>
                        {getStatusBadge(result.success)}
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{result.details.message}</p>
                      {result.details.userId && (
                        <p className="text-xs text-blue-400">User ID: {result.details.userId}</p>
                      )}
                      {result.details.errorCode && (
                        <p className="text-xs text-red-400">Error Code: {result.details.errorCode}</p>
                      )}
                      {result.details.recommendation && (
                        <p className="text-xs text-yellow-400 mt-1">💡 {result.details.recommendation}</p>
                      )}
                      {result.error && (
                        <pre className="text-xs text-red-400 bg-black/30 p-2 rounded mt-2 overflow-x-auto">
                          {JSON.stringify(result.error, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>

                {/* Critical Issues */}
                {testResults.summary.criticalIssues.length > 0 && (
                  <div className="p-3 bg-red-900/20 rounded border border-red-500/30">
                    <h4 className="font-medium mb-2 text-red-400">🚨 Critical Issues</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {testResults.summary.criticalIssues.map((issue, index) => (
                        <li key={index} className="text-red-300">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {testResults.summary.recommendations.length > 0 && (
                  <div className="p-3 bg-green-900/20 rounded border border-green-500/30">
                    <h4 className="font-medium mb-2 text-green-400">💡 Recommendations</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {testResults.summary.recommendations.map((rec, index) => (
                        <li key={index} className="text-green-300">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Success Message */}
                {testResults.summary.allPassed && (
                  <div className="p-3 bg-green-900/20 rounded border border-green-500/30">
                    <h4 className="font-medium mb-2 text-green-400">✅ All Tests Passed!</h4>
                    <p className="text-sm text-green-300">
                      The database migration was successful and the signup flow is working correctly.
                      You can now test the actual signup form.
                    </p>
                  </div>
                )}

                {/* Manual Migration Instructions */}
                {!testResults.summary.allPassed && (
                  <div className="p-3 bg-yellow-900/20 rounded border border-yellow-500/30">
                    <h4 className="font-medium mb-2 text-yellow-400">📋 Manual Migration Required</h4>
                    <div className="text-sm text-yellow-300 space-y-2">
                      <p>The database migration needs to be applied manually:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-4">
                        <li>Open Supabase Dashboard → SQL Editor</li>
                        <li>Copy content from MANUAL_DATABASE_MIGRATION.sql</li>
                        <li>Paste and execute in SQL Editor</li>
                        <li>Look for "CRITICAL DATABASE MIGRATION COMPLETED SUCCESSFULLY" message</li>
                        <li>Re-run this test to verify</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {verificationResults && (
          <Card className="bg-dex-dark border-dex-primary/30">
            <CardHeader>
              <CardTitle>Database Migration Verification Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Migration Status</h4>
                    {getStatusBadge(verificationResults.summary.allPassed)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>Total: {verificationResults.summary.total}</div>
                    <div>Passed: {verificationResults.summary.passed}</div>
                    <div>Failed: {verificationResults.summary.failed}</div>
                  </div>
                </div>

                {/* Individual Verification Results */}
                <div className="space-y-3">
                  {verificationResults.results.map((result, index) => (
                    <div key={index} className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{result.testName}</h4>
                        {getStatusBadge(result.success)}
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{result.details.message}</p>
                      {result.details.status && (
                        <p className="text-xs text-blue-400">Status: {result.details.status}</p>
                      )}
                      {result.details.recommendation && (
                        <p className="text-xs text-yellow-400 mt-1">💡 {result.details.recommendation}</p>
                      )}
                      {result.details.sqlToExecute && (
                        <div className="mt-2">
                          <p className="text-xs text-green-400 mb-1">📋 SQL to Execute:</p>
                          <pre className="text-xs text-green-300 bg-black/30 p-2 rounded overflow-x-auto">
                            {result.details.sqlToExecute}
                          </pre>
                        </div>
                      )}
                      {result.error && (
                        <pre className="text-xs text-red-400 bg-black/30 p-2 rounded mt-2 overflow-x-auto">
                          {JSON.stringify(result.error, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>

                {/* Critical Issues */}
                {verificationResults.summary.criticalIssues.length > 0 && (
                  <div className="p-3 bg-red-900/20 rounded border border-red-500/30">
                    <h4 className="font-medium mb-2 text-red-400">🚨 Critical Issues Found</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {verificationResults.summary.criticalIssues.map((issue, index) => (
                        <li key={index} className="text-red-300">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* SQL to Execute */}
                {verificationResults.summary.sqlToExecute.length > 0 && (
                  <div className="p-3 bg-yellow-900/20 rounded border border-yellow-500/30">
                    <h4 className="font-medium mb-2 text-yellow-400">📋 Required SQL Migrations</h4>
                    <p className="text-sm text-yellow-300 mb-2">
                      Execute the following SQL in Supabase SQL Editor:
                    </p>
                    {verificationResults.summary.sqlToExecute.map((sql, index) => (
                      <pre key={index} className="text-xs text-yellow-300 bg-black/30 p-2 rounded mb-2 overflow-x-auto">
                        {sql}
                      </pre>
                    ))}
                  </div>
                )}

                {/* Success Message */}
                {verificationResults.summary.allPassed && (
                  <div className="p-3 bg-green-900/20 rounded border border-green-500/30">
                    <h4 className="font-medium mb-2 text-green-400">✅ Database Migration Complete!</h4>
                    <p className="text-sm text-green-300">
                      All database components are properly configured. The signup flow should work correctly.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SignupTestPage;
