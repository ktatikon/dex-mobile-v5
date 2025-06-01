/**
 * COMPREHENSIVE SIGNUP DIAGNOSTICS PAGE
 * 
 * Multi-approach problem solving interface for persistent signup registration failures
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { signupDiagnosticService, SignupDiagnosticResult, SignupTestData } from '@/debug/signupDiagnosticService';
import { DatabaseDebugger } from '@/debug/databaseDebugger';
import { signupErrorInvestigator } from '@/debug/signupErrorInvestigator';
import { applyAllCriticalMigrations } from '@/scripts/applyMigrations';
import { runSimplifiedDiagnostic, generateMigrationInstructions } from '@/scripts/simplifiedMigrationTest';

const SignupDiagnosticsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState<SignupTestData>({
    email: 'test@example.com',
    password: 'testpassword123',
    fullName: 'Test User',
    phone: '+1234567890'
  });
  const [bruteForceResults, setBruteForceResults] = useState<SignupDiagnosticResult[]>([]);
  const [recursiveResult, setRecursiveResult] = useState<SignupDiagnosticResult | null>(null);
  const [dynamicResult, setDynamicResult] = useState<SignupDiagnosticResult | null>(null);
  const [databaseResults, setDatabaseResults] = useState<any[]>([]);
  const [errorInvestigation, setErrorInvestigation] = useState<any>(null);
  const [comprehensiveDiagnostic, setComprehensiveDiagnostic] = useState<any>(null);
  const [migrationResults, setMigrationResults] = useState<any>(null);
  const [simplifiedDiagnostic, setSimplifiedDiagnostic] = useState<any>(null);

  const runBruteForceTest = async () => {
    setLoading(true);
    try {
      console.log('🔨 Starting brute-force validation layer testing...');
      const results = await signupDiagnosticService.bruteForce.testAllValidationLayers(testData);
      setBruteForceResults(results);
    } catch (error) {
      console.error('Brute-force test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runRecursiveTest = async () => {
    setLoading(true);
    try {
      console.log('🔄 Starting recursive signup recovery test...');
      const result = await signupDiagnosticService.recursive.attemptSignupWithRecovery(testData);
      setRecursiveResult(result);
    } catch (error) {
      console.error('Recursive test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runDynamicTest = async () => {
    setLoading(true);
    try {
      console.log('⚡ Starting dynamic validation cache test...');
      const result = await signupDiagnosticService.dynamic.optimizedValidation(testData);
      setDynamicResult(result);
    } catch (error) {
      console.error('Dynamic test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runDatabaseDiagnostics = async () => {
    setLoading(true);
    try {
      console.log('🗄️ Starting comprehensive database diagnostics...');
      
      const results = [];
      
      // Test database connection
      results.push(await DatabaseDebugger.testDatabaseConnection());
      
      // Test phone constraint
      results.push(await DatabaseDebugger.testPhoneConstraint(testData.phone));
      results.push(await DatabaseDebugger.testPhoneConstraint(''));
      results.push(await DatabaseDebugger.testPhoneConstraint('(555) 123-4567'));
      
      // Test trigger function
      results.push(await DatabaseDebugger.testTriggerFunction());
      
      // Test RLS policies
      results.push(await DatabaseDebugger.testRLSPolicies());
      
      setDatabaseResults(results);
    } catch (error) {
      console.error('Database diagnostics failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runErrorInvestigation = async () => {
    setLoading(true);
    try {
      console.log('🔍 Starting error investigation...');
      const result = await signupErrorInvestigator.analyzer.investigateSignupError(testData);
      setErrorInvestigation(result);
    } catch (error) {
      console.error('Error investigation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runComprehensiveDiagnostic = async () => {
    setLoading(true);
    try {
      console.log('🚀 Starting comprehensive diagnostic...');
      const result = await signupErrorInvestigator.diagnostic.runFullDiagnostic();
      setComprehensiveDiagnostic(result);
    } catch (error) {
      console.error('Comprehensive diagnostic failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runMigrationFixes = async () => {
    setLoading(true);
    try {
      console.log('🔧 Applying critical migrations...');
      const result = await applyAllCriticalMigrations();
      setMigrationResults(result);
    } catch (error) {
      console.error('Migration application failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSimplifiedDiagnostic = async () => {
    setLoading(true);
    try {
      console.log('🔍 Running simplified diagnostic...');
      const result = await runSimplifiedDiagnostic();
      setSimplifiedDiagnostic(result);
    } catch (error) {
      console.error('Simplified diagnostic failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    signupDiagnosticService.dynamic.clearCache();
    setDynamicResult(null);
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
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="bg-dex-dark border-dex-primary/30">
          <CardHeader>
            <CardTitle className="text-dex-accent">🔍 Comprehensive Signup Diagnostics</CardTitle>
            <p className="text-gray-400">
              Multi-approach problem solving for persistent signup registration failures
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="email">Test Email</Label>
                <Input
                  id="email"
                  value={testData.email}
                  onChange={(e) => setTestData({ ...testData, email: e.target.value })}
                  className="bg-dex-dark/70 border-dex-primary/30"
                />
              </div>
              <div>
                <Label htmlFor="password">Test Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={testData.password}
                  onChange={(e) => setTestData({ ...testData, password: e.target.value })}
                  className="bg-dex-dark/70 border-dex-primary/30"
                />
              </div>
              <div>
                <Label htmlFor="fullName">Test Full Name</Label>
                <Input
                  id="fullName"
                  value={testData.fullName}
                  onChange={(e) => setTestData({ ...testData, fullName: e.target.value })}
                  className="bg-dex-dark/70 border-dex-primary/30"
                />
              </div>
              <div>
                <Label htmlFor="phone">Test Phone</Label>
                <Input
                  id="phone"
                  value={testData.phone}
                  onChange={(e) => setTestData({ ...testData, phone: e.target.value })}
                  className="bg-dex-dark/70 border-dex-primary/30"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="migration-fixes" className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-dex-dark text-xs">
            <TabsTrigger value="migration-fixes">🔧 Fix Issues</TabsTrigger>
            <TabsTrigger value="error-investigation">🚨 Investigation</TabsTrigger>
            <TabsTrigger value="comprehensive">🔍 Comprehensive</TabsTrigger>
            <TabsTrigger value="brute-force">🔨 Brute Force</TabsTrigger>
            <TabsTrigger value="recursive">🔄 Recursive</TabsTrigger>
            <TabsTrigger value="dynamic">⚡ Dynamic</TabsTrigger>
            <TabsTrigger value="database">🗄️ Database</TabsTrigger>
          </TabsList>

          <TabsContent value="migration-fixes">
            <Card className="bg-dex-dark border-dex-primary/30">
              <CardHeader>
                <CardTitle>🔧 Apply Critical Database Fixes</CardTitle>
                <p className="text-gray-400">
                  Apply RLS policy fixes, trigger function updates, and phone constraint migration
                </p>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-yellow-900/20 rounded border border-yellow-500/30">
                  <h4 className="font-medium mb-2 text-yellow-400">⚠️ Critical Fixes</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 text-yellow-300">
                    <li>Fix RLS policy violations (Error Code: 42501)</li>
                    <li>Update trigger function with SECURITY DEFINER privileges</li>
                    <li>Apply phone constraint migration for empty phone support</li>
                    <li>Correct database testing with proper UUID generation</li>
                  </ul>
                </div>

                <div className="flex gap-2 mb-4">
                  <Button
                    onClick={runSimplifiedDiagnostic}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? 'Testing...' : 'Test Current State'}
                  </Button>
                  <Button
                    onClick={runMigrationFixes}
                    disabled={loading}
                    className="bg-dex-accent hover:bg-dex-accent/90"
                  >
                    {loading ? 'Applying Fixes...' : 'Apply All Critical Fixes'}
                  </Button>
                </div>

                {simplifiedDiagnostic && (
                  <div className="space-y-4 mb-6">
                    <div className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Current Database State</h4>
                        {getStatusBadge(!simplifiedDiagnostic.summary.manualMigrationRequired)}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>Tests: {simplifiedDiagnostic.summary.total}</div>
                        <div>Passed: {simplifiedDiagnostic.summary.passed}</div>
                        <div>Failed: {simplifiedDiagnostic.summary.failed}</div>
                      </div>
                    </div>

                    {simplifiedDiagnostic.summary.manualMigrationRequired && (
                      <div className="p-3 bg-red-900/20 rounded border border-red-500/30">
                        <h4 className="font-medium mb-2 text-red-400">🚨 Manual Migration Required</h4>
                        <p className="text-sm text-red-300 mb-2">
                          Database migrations must be applied manually in Supabase SQL Editor.
                        </p>
                        <div className="text-xs bg-black/30 p-2 rounded">
                          <strong>Instructions:</strong><br/>
                          1. Open Supabase Dashboard → SQL Editor<br/>
                          2. Copy content from MANUAL_DATABASE_MIGRATION.sql<br/>
                          3. Paste and execute in SQL Editor<br/>
                          4. Re-run "Test Current State" to verify
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {simplifiedDiagnostic.results.map((result: any, index: number) => (
                        <div key={index} className="p-2 bg-dex-dark/30 rounded border border-dex-primary/10">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{result.testName}</span>
                            {getStatusBadge(result.success)}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{result.details.message}</p>
                          {result.details.recommendation && (
                            <p className="text-xs text-yellow-400 mt-1">💡 {result.details.recommendation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {migrationResults && (
                  <div className="space-y-4">
                    <div className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Migration Summary</h4>
                        {getStatusBadge(migrationResults.summary.allSuccessful)}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>Total: {migrationResults.summary.total}</div>
                        <div>Successful: {migrationResults.summary.successful}</div>
                        <div>Failed: {migrationResults.summary.failed}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {migrationResults.results.map((result: any, index: number) => (
                        <div key={index} className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{result.migrationName}</h4>
                            {getStatusBadge(result.success)}
                          </div>
                          {result.error && (
                            <p className="text-red-400 text-sm mb-2">
                              Error: {typeof result.error === 'string' ? result.error : result.error.message}
                            </p>
                          )}
                          {result.details && (
                            <pre className="text-xs text-gray-400 bg-black/30 p-2 rounded overflow-x-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>

                    {migrationResults.summary.allSuccessful && (
                      <div className="p-3 bg-green-900/20 rounded border border-green-500/30">
                        <h4 className="font-medium mb-2 text-green-400">✅ All Fixes Applied Successfully</h4>
                        <p className="text-sm text-green-300">
                          All critical database issues have been resolved. You can now test the signup flow.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="error-investigation">
            <Card className="bg-dex-dark border-dex-primary/30">
              <CardHeader>
                <CardTitle>🚨 Signup Error Investigation</CardTitle>
                <p className="text-gray-400">
                  Comprehensive analysis of signup failures with detailed error categorization
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={runErrorInvestigation}
                  disabled={loading}
                  className="mb-4 bg-dex-accent hover:bg-dex-accent/90"
                >
                  {loading ? 'Investigating...' : 'Investigate Signup Error'}
                </Button>

                {errorInvestigation && (
                  <div className="space-y-4">
                    <div className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Test Results</h4>
                        {getStatusBadge(errorInvestigation.results.actualSignup)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Frontend Validation: {errorInvestigation.results.frontendValidation ? '✅' : '❌'}</div>
                        <div>Database Constraints: {errorInvestigation.results.databaseConstraints ? '✅' : '❌'}</div>
                        <div>Trigger Function: {errorInvestigation.results.triggerFunction ? '✅' : '❌'}</div>
                        <div>Actual Signup: {errorInvestigation.results.actualSignup ? '✅' : '❌'}</div>
                      </div>
                    </div>

                    <div className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                      <h4 className="font-medium mb-2">Error Analysis</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Type:</strong> {errorInvestigation.analysis.errorType}</div>
                        <div><strong>Message:</strong> {errorInvestigation.analysis.errorMessage}</div>
                        {errorInvestigation.analysis.errorCode && (
                          <div><strong>Code:</strong> {errorInvestigation.analysis.errorCode}</div>
                        )}
                      </div>
                    </div>

                    {errorInvestigation.analysis.possibleCauses.length > 0 && (
                      <div className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                        <h4 className="font-medium mb-2">Possible Causes</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {errorInvestigation.analysis.possibleCauses.map((cause: string, index: number) => (
                            <li key={index} className="text-yellow-400">{cause}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {errorInvestigation.analysis.recommendedActions.length > 0 && (
                      <div className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                        <h4 className="font-medium mb-2">Recommended Actions</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {errorInvestigation.analysis.recommendedActions.map((action: string, index: number) => (
                            <li key={index} className="text-green-400">{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comprehensive">
            <Card className="bg-dex-dark border-dex-primary/30">
              <CardHeader>
                <CardTitle>🔍 Comprehensive System Diagnostic</CardTitle>
                <p className="text-gray-400">
                  Full system analysis including migration status, database health, and multiple signup tests
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={runComprehensiveDiagnostic}
                  disabled={loading}
                  className="mb-4 bg-dex-accent hover:bg-dex-accent/90"
                >
                  {loading ? 'Running Diagnostic...' : 'Run Comprehensive Diagnostic'}
                </Button>

                {comprehensiveDiagnostic && (
                  <div className="space-y-4">
                    <div className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                      <h4 className="font-medium mb-2">System Status</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Migration Applied: {comprehensiveDiagnostic.migrationStatus.migrationApplied ? '✅' : '❌'}</div>
                        <div>Database Connection: {comprehensiveDiagnostic.databaseHealth.connection.success ? '✅' : '❌'}</div>
                        <div>RLS Policies: {comprehensiveDiagnostic.databaseHealth.rls.success ? '✅' : '❌'}</div>
                        <div>Trigger Function: {comprehensiveDiagnostic.databaseHealth.trigger.success ? '✅' : '❌'}</div>
                      </div>
                    </div>

                    <div className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                      <h4 className="font-medium mb-2">Test Summary</h4>
                      <div className="text-sm">
                        <div>Total Tests: {comprehensiveDiagnostic.summary.totalTests}</div>
                        <div>Passed: {comprehensiveDiagnostic.summary.passedTests}</div>
                        <div>Failed: {comprehensiveDiagnostic.summary.failedTests}</div>
                      </div>
                    </div>

                    {comprehensiveDiagnostic.summary.criticalIssues.length > 0 && (
                      <div className="p-3 bg-red-900/20 rounded border border-red-500/30">
                        <h4 className="font-medium mb-2 text-red-400">Critical Issues</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {comprehensiveDiagnostic.summary.criticalIssues.map((issue: string, index: number) => (
                            <li key={index} className="text-red-300">{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {comprehensiveDiagnostic.summary.recommendations.length > 0 && (
                      <div className="p-3 bg-green-900/20 rounded border border-green-500/30">
                        <h4 className="font-medium mb-2 text-green-400">Recommendations</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {comprehensiveDiagnostic.summary.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="text-green-300">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="brute-force">
            <Card className="bg-dex-dark border-dex-primary/30">
              <CardHeader>
                <CardTitle>🔨 Brute-Force Validation Layer Testing</CardTitle>
                <p className="text-gray-400">
                  Systematically test each validation layer to isolate the failure point
                </p>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={runBruteForceTest} 
                  disabled={loading}
                  className="mb-4 bg-dex-accent hover:bg-dex-accent/90"
                >
                  {loading ? 'Testing...' : 'Run Brute-Force Test'}
                </Button>
                
                <div className="space-y-3">
                  {bruteForceResults.map((result, index) => (
                    <div key={index} className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{result.step}</h4>
                        {getStatusBadge(result.success)}
                      </div>
                      {result.error && (
                        <p className="text-red-400 text-sm mb-2">
                          Error: {typeof result.error === 'string' ? result.error : result.error.message}
                        </p>
                      )}
                      {result.details && (
                        <pre className="text-xs text-gray-400 bg-black/30 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recursive">
            <Card className="bg-dex-dark border-dex-primary/30">
              <CardHeader>
                <CardTitle>🔄 Recursive Error Recovery</CardTitle>
                <p className="text-gray-400">
                  Step-by-step error recovery with exponential backoff retry mechanisms
                </p>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={runRecursiveTest} 
                  disabled={loading}
                  className="mb-4 bg-dex-accent hover:bg-dex-accent/90"
                >
                  {loading ? 'Testing...' : 'Run Recursive Recovery Test'}
                </Button>
                
                {recursiveResult && (
                  <div className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{recursiveResult.step}</h4>
                      {getStatusBadge(recursiveResult.success)}
                    </div>
                    {recursiveResult.error && (
                      <p className="text-red-400 text-sm mb-2">
                        Error: {typeof recursiveResult.error === 'string' ? recursiveResult.error : recursiveResult.error.message}
                      </p>
                    )}
                    {recursiveResult.details && (
                      <pre className="text-xs text-gray-400 bg-black/30 p-2 rounded overflow-x-auto">
                        {JSON.stringify(recursiveResult.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dynamic">
            <Card className="bg-dex-dark border-dex-primary/30">
              <CardHeader>
                <CardTitle>⚡ Dynamic Validation Cache</CardTitle>
                <p className="text-gray-400">
                  Optimized validation with caching to avoid repeated constraint checks
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Button 
                    onClick={runDynamicTest} 
                    disabled={loading}
                    className="bg-dex-accent hover:bg-dex-accent/90"
                  >
                    {loading ? 'Testing...' : 'Run Dynamic Cache Test'}
                  </Button>
                  <Button 
                    onClick={clearCache} 
                    variant="outline"
                    className="border-dex-primary/30"
                  >
                    Clear Cache
                  </Button>
                </div>
                
                {dynamicResult && (
                  <div className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{dynamicResult.step}</h4>
                      {getStatusBadge(dynamicResult.success)}
                    </div>
                    {dynamicResult.error && (
                      <p className="text-red-400 text-sm mb-2">
                        Error: {typeof dynamicResult.error === 'string' ? dynamicResult.error : dynamicResult.error.message}
                      </p>
                    )}
                    {dynamicResult.details && (
                      <pre className="text-xs text-gray-400 bg-black/30 p-2 rounded overflow-x-auto">
                        {JSON.stringify(dynamicResult.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database">
            <Card className="bg-dex-dark border-dex-primary/30">
              <CardHeader>
                <CardTitle>🗄️ Database Diagnostics</CardTitle>
                <p className="text-gray-400">
                  Comprehensive database constraint and trigger function testing
                </p>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={runDatabaseDiagnostics} 
                  disabled={loading}
                  className="mb-4 bg-dex-accent hover:bg-dex-accent/90"
                >
                  {loading ? 'Testing...' : 'Run Database Diagnostics'}
                </Button>
                
                <div className="space-y-3">
                  {databaseResults.map((result, index) => (
                    <div key={index} className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{result.testName}</h4>
                        {getStatusBadge(result.success)}
                      </div>
                      {result.error && (
                        <p className="text-red-400 text-sm mb-2">
                          Error: {typeof result.error === 'string' ? result.error : result.error.message}
                        </p>
                      )}
                      {result.details && (
                        <pre className="text-xs text-gray-400 bg-black/30 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SignupDiagnosticsPage;
