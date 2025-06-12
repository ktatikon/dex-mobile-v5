import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletData } from '@/hooks/useWalletData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const DebugPage = () => {
  console.log('🚀 DebugPage: Component rendering...');

  const navigate = useNavigate();
  const { user, loading: authLoading, session } = useAuth();
  const walletDataResult = useWalletData();
  const [renderCount, setRenderCount] = useState(0);
  const [errorLog, setErrorLog] = useState<string[]>([]);

  // Track renders
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    console.log(`🔄 DebugPage: Render #${renderCount + 1}`);
  });

  // Track errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorMsg = `${event.error?.message || event.message} at ${event.filename}:${event.lineno}`;
      setErrorLog(prev => [...prev, errorMsg]);
      console.error('🚨 Global Error:', errorMsg);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMsg = `Unhandled Promise Rejection: ${event.reason}`;
      setErrorLog(prev => [...prev, errorMsg]);
      console.error('🚨 Unhandled Rejection:', errorMsg);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  console.log('🔍 DebugPage: Auth state:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    authLoading,
    hasSession: !!session
  });

  console.log('🔍 DebugPage: Wallet data:', walletDataResult);



  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      <Card className="bg-dex-dark border-dex-secondary/30 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Debug Information (Render #{renderCount})</CardTitle>
        </CardHeader>
        <CardContent className="text-white space-y-4">
          <div>
            <h3 className="font-semibold text-dex-primary">Authentication Status:</h3>
            <p>Loading: {authLoading ? 'Yes' : 'No'}</p>
            <p>User: {user ? `${user.email} (${user.id})` : 'Not logged in'}</p>
            <p>Session: {session ? 'Active' : 'None'}</p>
          </div>

          <div>
            <h3 className="font-semibold text-dex-primary">Wallet Data:</h3>
            <p>Has Result: {walletDataResult ? 'Yes' : 'No'}</p>
            {walletDataResult && (
              <>
                <p>Tokens: {walletDataResult.walletTokens?.length || 0}</p>
                <p>Address: {walletDataResult.address || 'None'}</p>
                <p>Loading: {walletDataResult.loading ? 'Yes' : 'No'}</p>
                <p>Error: {walletDataResult.error?.message || 'None'}</p>
              </>
            )}
          </div>



          {errorLog.length > 0 && (
            <div>
              <h3 className="font-semibold text-red-400">Error Log:</h3>
              <div className="bg-black/30 p-2 rounded text-xs max-h-40 overflow-y-auto">
                {errorLog.map((error, index) => (
                  <div key={index} className="text-red-300 mb-1">{error}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugPage;
