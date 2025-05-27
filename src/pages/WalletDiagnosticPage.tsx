import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { testGeneratedWalletsTableAccess, testAddressGeneration } from '@/services/walletGenerationService';
import { supabase } from '@/integrations/supabase/client';

const WalletDiagnosticPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [addressTestResults, setAddressTestResults] = useState<any>(null);
  const [addressTestLoading, setAddressTestLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (user) {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data) {
          setUserInfo(data);
        }
      }
    };

    fetchUserInfo();
  }, [user]);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      // Test table access
      const tableAccessResults = await testGeneratedWalletsTableAccess();

      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();

      // Combine results
      setDiagnosticResults({
        tableAccess: tableAccessResults,
        session: sessionData,
        timestamp: new Date().toISOString()
      });

      toast({
        title: 'Diagnostics Complete',
        description: 'Wallet diagnostics have been run successfully.',
      });
    } catch (error) {
      console.error('Error running diagnostics:', error);
      toast({
        title: 'Diagnostics Error',
        description: 'An error occurred while running diagnostics.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const testAddressGenerationFunction = async () => {
    setAddressTestLoading(true);
    try {
      console.log('Starting address generation test...');
      const results = await testAddressGeneration();
      setAddressTestResults(results);

      if (results.success) {
        toast({
          title: 'Address Test Successful',
          description: `Generated ${Object.keys(results.addresses || {}).length} addresses successfully.`,
        });
      } else {
        toast({
          title: 'Address Test Failed',
          description: results.error || 'Unknown error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error testing address generation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAddressTestResults({
        success: false,
        error: errorMessage
      });
      toast({
        title: 'Address Test Error',
        description: `Test failed: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setAddressTestLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => navigate('/wallet-dashboard')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white"><path d="m15 18-6-6 6-6"/></svg>
        </Button>
        <h1 className="text-2xl font-bold text-white">Wallet Diagnostics</h1>
      </div>

      <Card className="bg-black border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white">Wallet System Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-dex-dark p-4 rounded-lg">
            <h3 className="text-white font-medium mb-2">User Information</h3>
            {userInfo ? (
              <pre className="text-xs text-gray-400 overflow-auto">
                {JSON.stringify(userInfo, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-400">No user information available</p>
            )}
          </div>

          <div className="space-y-2">
            <Button
              onClick={runDiagnostics}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
            </Button>

            <Button
              onClick={testAddressGenerationFunction}
              disabled={addressTestLoading}
              variant="outline"
              className="w-full border-dex-secondary/30"
            >
              {addressTestLoading ? 'Testing Address Generation...' : 'Test Address Generation'}
            </Button>
          </div>

          {addressTestResults && (
            <>
              <Separator className="my-4 bg-dex-secondary/30" />

              <div className="bg-dex-dark p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">Address Generation Test Results</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="text-gray-400">Test Status:</div>
                  <div className={addressTestResults.success ? "text-green-500" : "text-red-500"}>
                    {addressTestResults.success ? "Success" : "Failed"}
                  </div>
                </div>

                {addressTestResults.success && addressTestResults.addresses && (
                  <div className="mt-4">
                    <h4 className="text-white font-medium mb-2">Generated Addresses</h4>
                    <div className="space-y-2">
                      {Object.entries(addressTestResults.addresses).map(([currency, address]) => (
                        <div key={currency} className="grid grid-cols-3 gap-2">
                          <div className="text-gray-400">{currency}:</div>
                          <div className="col-span-2 text-xs text-white font-mono break-all">{address}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {addressTestResults.debugInfo && (
                  <div className="mt-4">
                    <h4 className="text-white font-medium mb-2">Debug Information</h4>
                    <pre className="text-xs text-gray-400 overflow-auto bg-black p-2 rounded max-h-40">
                      {JSON.stringify(addressTestResults.debugInfo, null, 2)}
                    </pre>
                  </div>
                )}

                {!addressTestResults.success && addressTestResults.error && (
                  <div className="mt-4">
                    <h4 className="text-red-500 font-medium mb-2">Error Details</h4>
                    <pre className="text-xs text-gray-400 overflow-auto bg-black p-2 rounded">
                      {addressTestResults.error}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}

          {diagnosticResults && (
            <>
              <Separator className="my-4 bg-dex-secondary/30" />

              <div className="space-y-4">
                <h3 className="text-white font-medium">Diagnostic Results</h3>
                <p className="text-gray-400 text-sm">
                  Timestamp: {new Date(diagnosticResults.timestamp).toLocaleString()}
                </p>

                <div className="bg-dex-dark p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Table Access</h4>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="text-gray-400">Table Exists:</div>
                    <div className={diagnosticResults.tableAccess.tableExists ? "text-green-500" : "text-red-500"}>
                      {diagnosticResults.tableAccess.tableExists ? "Yes" : "No"}
                    </div>

                    <div className="text-gray-400">Can Select:</div>
                    <div className={diagnosticResults.tableAccess.canSelect ? "text-green-500" : "text-red-500"}>
                      {diagnosticResults.tableAccess.canSelect ? "Yes" : "No"}
                    </div>

                    <div className="text-gray-400">Can Insert:</div>
                    <div className={diagnosticResults.tableAccess.canInsert ? "text-green-500" : "text-red-500"}>
                      {diagnosticResults.tableAccess.canInsert ? "Yes" : "No"}
                    </div>

                    <div className="text-gray-400">Can Update:</div>
                    <div className={diagnosticResults.tableAccess.canUpdate ? "text-green-500" : "text-red-500"}>
                      {diagnosticResults.tableAccess.canUpdate ? "Yes" : "No"}
                    </div>

                    <div className="text-gray-400">Can Delete:</div>
                    <div className={diagnosticResults.tableAccess.canDelete ? "text-green-500" : "text-red-500"}>
                      {diagnosticResults.tableAccess.canDelete ? "Yes" : "No"}
                    </div>
                  </div>

                  {diagnosticResults.tableAccess.error && (
                    <div className="mt-4">
                      <h5 className="text-red-500 font-medium mb-2">Error Details</h5>
                      <pre className="text-xs text-gray-400 overflow-auto bg-black p-2 rounded">
                        {JSON.stringify(diagnosticResults.tableAccess.error, null, 2)}
                      </pre>
                    </div>
                  )}

                  {diagnosticResults.tableAccess.schema && (
                    <div className="mt-4">
                      <h5 className="text-white font-medium mb-2">Table Schema</h5>
                      <pre className="text-xs text-gray-400 overflow-auto bg-black p-2 rounded">
                        {JSON.stringify(diagnosticResults.tableAccess.schema, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="bg-dex-dark p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Session Information</h4>
                  <pre className="text-xs text-gray-400 overflow-auto bg-black p-2 rounded">
                    {JSON.stringify(diagnosticResults.session, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full border-dex-secondary/30"
            onClick={() => navigate('/wallet-dashboard')}
          >
            Back to Wallet
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default WalletDiagnosticPage;
