import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';

const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resendVerification } = useAuth();
  const { toast } = useToast();
  
  // Get email from navigation state or URL params
  const emailFromState = location.state?.email;
  const [email, setEmail] = useState(emailFromState || '');
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);

  const handleResendVerification = async () => {
    if (!email || email.trim() === '') {
      toast({
        title: "Email Required",
        description: "Please enter your email address to resend verification.",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    try {
      await resendVerification(email);
      setResendCount(prev => prev + 1);
    } catch (error) {
      console.error('Failed to resend verification:', error);
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToSignup = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dex-dark via-dex-dark/95 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-dex-dark/90 border-dex-primary/30 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-dex-primary/20 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-dex-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Check Your Email
          </CardTitle>
          <p className="text-gray-300 text-sm">
            We've sent a verification link to your email address. Click the link to activate your V-DEX account.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {emailFromState && (
            <div className="bg-dex-primary/10 border border-dex-primary/30 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">Verification email sent to:</span>
              </div>
              <p className="text-dex-primary font-mono text-sm mt-1 break-all">
                {emailFromState}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="bg-dex-dark/70 border-dex-primary/30 text-white placeholder-gray-400 focus:ring-dex-accent"
              />
            </div>

            <Button
              onClick={handleResendVerification}
              disabled={isResending || !email}
              className="w-full bg-dex-accent hover:bg-dex-accent/90 text-white"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  {resendCount > 0 ? 'Resend Verification Email' : 'Send Verification Email'}
                </>
              )}
            </Button>

            {resendCount > 0 && (
              <div className="text-center">
                <p className="text-green-400 text-sm">
                  ✅ Verification email sent {resendCount > 1 ? `(${resendCount} times)` : ''}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-dex-primary/20 pt-4">
            <div className="text-center space-y-3">
              <p className="text-gray-400 text-sm">
                Didn't receive the email? Check your spam folder or try resending.
              </p>
              
              <Button
                variant="ghost"
                onClick={handleBackToSignup}
                className="text-dex-primary hover:text-dex-primary/80 hover:bg-dex-primary/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign Up
              </Button>
            </div>
          </div>

          <div className="bg-dex-dark/50 border border-dex-primary/20 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Next Steps:</h4>
            <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
              <li>Check your email inbox</li>
              <li>Click the verification link</li>
              <li>You'll be redirected back to V-DEX</li>
              <li>Start trading immediately!</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationPage;
