import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { debugAdminSystem, testAdminContext, createAdminUser } from '@/debug/adminDebug';
import {
  Bug,
  Play,
  RefreshCw,
  User,
  Shield,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

// Type for console arguments - supports any serializable value for debugging
type ConsoleArgument = string | number | boolean | object | null | undefined;
type ConsoleArgs = ConsoleArgument[];

const AdminDebugPage = () => {
  const { user, session, validateSession, forceSessionRefresh } = useAuth();
  const { adminUser, isAdmin, isLoading, refreshAdminStatus } = useAdmin();
  const [debugOutput, setDebugOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const runDebug = async () => {
    setIsRunning(true);
    setDebugOutput('');

    // Capture console output
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    let output = '';

    const captureLog = (...args: ConsoleArgs) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      output += message + '\n';
      originalLog(...args);
    };

    const captureError = (...args: ConsoleArgs) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      output += '❌ ' + message + '\n';
      originalError(...args);
    };

    const captureWarn = (...args: ConsoleArgs) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      output += '⚠️ ' + message + '\n';
      originalWarn(...args);
    };

    console.log = captureLog;
    console.error = captureError;
    console.warn = captureWarn;

    try {
      await debugAdminSystem(user?.email || 't.krishnadeepak@gmail.com');
    } catch (error) {
      output += `💥 Debug failed: ${error}\n`;
    }

    // Restore console
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;

    setDebugOutput(output);
    setIsRunning(false);
  };

  const testContext = async () => {
    setIsRunning(true);
    const result = await testAdminContext();
    setIsRunning(false);

    if (result) {
      setDebugOutput(`✅ Admin Context Test Successful:\n${JSON.stringify(result, null, 2)}`);
    } else {
      setDebugOutput('❌ Admin Context Test Failed - Check console for details');
    }
  };

  const createAdmin = async () => {
    if (!user?.email) {
      setDebugOutput('❌ No user email found');
      return;
    }

    setIsRunning(true);

    const originalLog = console.log;
    const originalError = console.error;
    let output = '';

    console.log = (...args: ConsoleArgs) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      output += message + '\n';
      originalLog(...args);
    };

    console.error = (...args: ConsoleArgs) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      output += '❌ ' + message + '\n';
      originalError(...args);
    };

    try {
      await createAdminUser(user.email);
      await refreshAdminStatus(); // Refresh the admin context
    } catch (error) {
      output += `💥 Create admin failed: ${error}\n`;
    }

    console.log = originalLog;
    console.error = originalError;

    setDebugOutput(output);
    setIsRunning(false);
  };

  const testSessionValidation = async () => {
    setIsRunning(true);

    let output = '🔍 Testing Session Validation...\n';
    output += '='.repeat(40) + '\n\n';

    try {
      // Test current session state
      output += '1️⃣ Current Context State:\n';
      output += `   - Session exists: ${!!session}\n`;
      output += `   - User exists: ${!!user}\n`;
      output += `   - User email: ${user?.email || 'None'}\n`;
      output += `   - User ID: ${user?.id || 'None'}\n\n`;

      // Validate session
      output += '2️⃣ Validating Session...\n';
      const validation = await validateSession();
      output += `   - Is valid: ${validation.isValid}\n`;
      output += `   - Session exists: ${!!validation.session}\n`;
      output += `   - Error: ${validation.error || 'None'}\n`;

      if (validation.session) {
        output += `   - Session user ID: ${validation.session.user.id}\n`;
        output += `   - Session user email: ${validation.session.user.email}\n`;
        output += `   - Session expires: ${validation.session.expires_at}\n`;
      }
      output += '\n';

      // If validation failed, try force refresh
      if (!validation.isValid) {
        output += '3️⃣ Attempting Force Session Refresh...\n';
        try {
          await forceSessionRefresh();
          output += '   ✅ Force refresh completed\n';

          // Re-validate after refresh
          const revalidation = await validateSession();
          output += `   - Re-validation result: ${revalidation.isValid}\n`;
          output += `   - Session now exists: ${!!revalidation.session}\n`;
        } catch (refreshError) {
          output += `   ❌ Force refresh failed: ${refreshError}\n`;
        }
      } else {
        output += '3️⃣ Session is valid, no refresh needed\n';
      }

    } catch (error) {
      output += `💥 Session validation test failed: ${error}\n`;
    }

    setDebugOutput(output);
    setIsRunning(false);
  };

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Bug className="h-8 w-8 text-dex-primary" />
        <h1 className="text-2xl font-bold text-white">Admin System Debug</h1>
      </div>

      {/* Current Status */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-dex-secondary/10 rounded-lg">
              <span className="text-white">User Authenticated</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(!!user)}
                <span className="text-sm text-gray-400">{user?.email || 'None'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-dex-secondary/10 rounded-lg">
              <span className="text-white">Admin Context Loading</span>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin" />
                ) : (
                  getStatusIcon(!isLoading)
                )}
                <span className="text-sm text-gray-400">{isLoading ? 'Loading...' : 'Complete'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-dex-secondary/10 rounded-lg">
              <span className="text-white">Is Admin</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(isAdmin)}
                <span className="text-sm text-gray-400">{isAdmin ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-dex-secondary/10 rounded-lg">
              <span className="text-white">Admin Role</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(!!adminUser)}
                <span className="text-sm text-gray-400">
                  {adminUser?.role || 'None'}
                </span>
              </div>
            </div>
          </div>

          {adminUser && (
            <div className="mt-4 p-3 bg-dex-primary/10 rounded-lg">
              <h4 className="text-white font-medium mb-2">Admin User Details:</h4>
              <pre className="text-sm text-gray-300 overflow-x-auto">
                {JSON.stringify(adminUser, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Actions */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="h-5 w-5" />
            Debug Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={runDebug}
              disabled={isRunning}
              className="bg-dex-primary hover:bg-dex-primary/80 text-white min-h-[44px]"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Full Debug
            </Button>

            <Button
              onClick={testContext}
              disabled={isRunning}
              variant="outline"
              className="border-dex-secondary text-white hover:bg-dex-secondary/20 min-h-[44px]"
            >
              <User className="h-4 w-4 mr-2" />
              Test Context
            </Button>

            <Button
              onClick={testSessionValidation}
              disabled={isRunning}
              variant="outline"
              className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/20 min-h-[44px]"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Test Session
            </Button>

            <Button
              onClick={createAdmin}
              disabled={isRunning || !user}
              variant="outline"
              className="border-dex-positive text-dex-positive hover:bg-dex-positive/20 min-h-[44px]"
            >
              <Shield className="h-4 w-4 mr-2" />
              Create Admin
            </Button>
          </div>

          <Button
            onClick={refreshAdminStatus}
            disabled={isRunning}
            variant="ghost"
            className="w-full text-white hover:bg-dex-secondary/20 min-h-[44px]"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Admin Status
          </Button>
        </CardContent>
      </Card>

      {/* Debug Output */}
      {debugOutput && (
        <Card className="bg-dex-dark/80 border-dex-secondary/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Debug Output
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-gray-300 bg-black/50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
              {debugOutput}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Quick Fixes */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 mt-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Quick Fixes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-300 space-y-2">
            <p><strong>If admin tables are missing:</strong> The migration needs to be applied to your Supabase instance.</p>
            <p><strong>If admin user doesn't exist:</strong> Click "Create Admin" button above.</p>
            <p><strong>If RLS policies are blocking:</strong> Check the Supabase dashboard for policy configuration.</p>
            <p><strong>If context is not loading:</strong> Check browser console for JavaScript errors.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDebugPage;
