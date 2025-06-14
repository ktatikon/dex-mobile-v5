import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2, Home } from 'lucide-react';

type ConfirmationStatus = 'loading' | 'success' | 'error' | 'expired';

const EmailConfirmPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<ConfirmationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        console.log('🔐 Processing email confirmation...');
        
        // Get the token and type from URL parameters
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        if (!token || type !== 'signup') {
          console.error('❌ Invalid confirmation parameters');
          setStatus('error');
          setErrorMessage('Invalid confirmation link. Please try signing up again.');
          return;
        }

        console.log('🔍 Confirming email with token...');
        
        // Verify the email confirmation token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        if (error) {
          console.error('❌ Email confirmation failed:', error);
          
          if (error.message.includes('expired')) {
            setStatus('expired');
            setErrorMessage('This confirmation link has expired. Please request a new one.');
          } else {
            setStatus('error');
            setErrorMessage(error.message || 'Email confirmation failed. Please try again.');
          }
          return;
        }

        if (data.user) {
          console.log('✅ Email confirmed successfully for user:', data.user.id);
          setStatus('success');
          
          // Show success message
          toast({
            title: "Email Verified!",
            description: "Your account has been successfully verified. Welcome to V-DEX!",
            variant: "default",
          });

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        } else {
          console.error('❌ No user data returned after confirmation');
          setStatus('error');
          setErrorMessage('Email confirmation succeeded but user data is missing. Please try logging in.');
        }

      } catch (error: any) {
        console.error('🚨 Email confirmation error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'An unexpected error occurred during email confirmation.');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate, toast]);

  const handleRetrySignup = () => {
    navigate('/auth');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRequestNewLink = () => {
    navigate('/auth/verify-email');
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <div className="mx-auto w-16 h-16 bg-dex-primary/20 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-dex-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold text-white text-center">
              Verifying Your Email
            </CardTitle>
            <p className="text-gray-300 text-center">
              Please wait while we confirm your email address...
            </p>
          </>
        );

      case 'success':
        return (
          <>
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white text-center">
              Email Verified Successfully!
            </CardTitle>
            <p className="text-gray-300 text-center">
              Your V-DEX account is now active. You'll be redirected to the dashboard shortly.
            </p>
            <div className="flex justify-center">
              <Button
                onClick={handleGoHome}
                className="bg-dex-accent hover:bg-dex-accent/90 text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          </>
        );

      case 'expired':
        return (
          <>
            <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-yellow-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white text-center">
              Link Expired
            </CardTitle>
            <p className="text-gray-300 text-center">
              {errorMessage}
            </p>
            <div className="flex flex-col space-y-3">
              <Button
                onClick={handleRequestNewLink}
                className="bg-dex-accent hover:bg-dex-accent/90 text-white"
              >
                Request New Verification Link
              </Button>
              <Button
                variant="ghost"
                onClick={handleRetrySignup}
                className="text-dex-primary hover:text-dex-primary/80 hover:bg-dex-primary/10"
              >
                Back to Sign Up
              </Button>
            </div>
          </>
        );

      case 'error':
        return (
          <>
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white text-center">
              Verification Failed
            </CardTitle>
            <p className="text-gray-300 text-center">
              {errorMessage}
            </p>
            <div className="flex flex-col space-y-3">
              <Button
                onClick={handleRetrySignup}
                className="bg-dex-accent hover:bg-dex-accent/90 text-white"
              >
                Try Again
              </Button>
              <Button
                variant="ghost"
                onClick={handleRequestNewLink}
                className="text-dex-primary hover:text-dex-primary/80 hover:bg-dex-primary/10"
              >
                Request New Link
              </Button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dex-dark via-dex-dark/95 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-dex-dark/90 border-dex-primary/30 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          {renderContent()}
        </CardHeader>

        {status === 'success' && (
          <CardContent>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">What's Next?</h4>
              <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                <li>Your user profile has been created</li>
                <li>Default wallet settings are configured</li>
                <li>You can start trading immediately</li>
                <li>Explore DeFi features and analytics</li>
              </ul>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default EmailConfirmPage;
