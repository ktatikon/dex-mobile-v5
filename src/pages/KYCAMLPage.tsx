/**
 * KYC/AML Verification Page Component
 * 
 * Dedicated page for identity verification and anti-money laundering compliance
 * extracted from SettingsPage KYC/AML section
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useKYC } from '@/contexts/KYCContext';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  ArrowLeft
} from 'lucide-react';

// KYC/AML Components
import KYCStatus from '@/components/kyc/KYCStatus';
import AMLChecker from '@/components/aml/AMLChecker';
import AMLHistory from '@/components/aml/AMLHistory';

interface KYCAMLPageProps {
  className?: string;
}

const KYCAMLPage: React.FC<KYCAMLPageProps> = React.memo(({ 
  className = '' 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { kycStatus, startKYC } = useKYC();
  const { toast } = useToast();

  // State management
  const [activeTab, setActiveTab] = useState('kyc');
  const [amlRefreshTrigger, setAmlRefreshTrigger] = useState(0);

  // Handle KYC start
  const handleStartKYC = useCallback(async () => {
    try {
      await startKYC();
      toast({
        title: "KYC Process Started",
        description: "Please follow the verification steps to complete your identity verification.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error starting KYC:', error);
      toast({
        title: "Error",
        description: "Failed to start KYC process. Please try again.",
        variant: "destructive",
      });
    }
  }, [startKYC, toast]);

  // Handle AML check completion
  const handleAMLCheckComplete = useCallback((check: any) => {
    console.log('AML check completed:', check);
    // Trigger refresh of AML history
    setAmlRefreshTrigger(prev => prev + 1);

    toast({
      title: "AML Check Completed",
      description: "Address risk assessment has been completed",
      variant: "default",
    });
  }, [toast]);

  // Get KYC status badge
  const getKYCStatusBadge = () => {
    switch (kycStatus) {
      case 'approved':
        return (
          <Badge className="bg-green-600 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-600 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-dex-primary text-white">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-dex-secondary/20 text-white">
            Required
          </Badge>
        );
    }
  };

  return (
    <div className={`container mx-auto px-4 pt-6 pb-24 ${className}`}>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-dex-secondary/20"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-medium text-white font-poppins">KYC/AML Verification</h1>
            <p className="text-dex-text-secondary font-poppins">
              Complete identity verification and check address compliance
            </p>
          </div>
        </div>
        
        {/* Status Overview */}
        <Card className="bg-dex-dark/80 border-dex-secondary/30 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="text-dex-primary" size={24} />
                <div>
                  <p className="text-white font-medium font-poppins">Verification Status</p>
                  <p className="text-sm text-dex-text-secondary font-poppins">
                    {user?.email || 'Not signed in'}
                  </p>
                </div>
              </div>
              {getKYCStatusBadge()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-dex-dark/50 p-1.5 rounded-lg border border-dex-secondary/20">
          <TabsTrigger 
            value="kyc" 
            className="text-white data-[state=active]:bg-dex-primary flex items-center gap-2"
          >
            <FileCheck size={16} />
            KYC Verification
          </TabsTrigger>
          <TabsTrigger 
            value="aml" 
            className="text-white data-[state=active]:bg-dex-primary flex items-center gap-2"
          >
            <Search size={16} />
            AML Checker
          </TabsTrigger>
        </TabsList>

        {/* KYC Verification Tab */}
        <TabsContent value="kyc">
          <div className="space-y-6">
            <Card className="bg-dex-dark/80 border-dex-secondary/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileCheck className="text-dex-primary" size={20} />
                  Identity Verification
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Verify your identity to unlock full platform functionality and higher transaction limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <KYCStatus onStartKYC={handleStartKYC} />
              </CardContent>
            </Card>

            {/* KYC Benefits */}
            <Card className="bg-dex-dark/80 border-dex-secondary/30">
              <CardHeader>
                <CardTitle className="text-white">Verification Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-dex-secondary/10 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Higher Limits</h4>
                    <p className="text-sm text-gray-400">
                      Increase your daily and monthly transaction limits
                    </p>
                  </div>
                  <div className="p-4 bg-dex-secondary/10 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Enhanced Security</h4>
                    <p className="text-sm text-gray-400">
                      Additional protection for your account and funds
                    </p>
                  </div>
                  <div className="p-4 bg-dex-secondary/10 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Premium Features</h4>
                    <p className="text-sm text-gray-400">
                      Access to advanced trading and DeFi features
                    </p>
                  </div>
                  <div className="p-4 bg-dex-secondary/10 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Compliance</h4>
                    <p className="text-sm text-gray-400">
                      Meet regulatory requirements for secure trading
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AML Checker Tab */}
        <TabsContent value="aml">
          <div className="space-y-6">
            <Card className="bg-dex-dark/80 border-dex-secondary/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Search className="text-dex-primary" size={20} />
                  Address Risk Assessment
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Check cryptocurrency addresses for suspicious activity and compliance risks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AMLChecker onCheckComplete={handleAMLCheckComplete} />
              </CardContent>
            </Card>

            {/* AML Request History */}
            <Card className="bg-dex-dark/80 border-dex-secondary/30">
              <CardHeader>
                <CardTitle className="text-white">AML Check History</CardTitle>
                <CardDescription className="text-gray-400">
                  View your previous address risk assessments and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AMLHistory refreshTrigger={amlRefreshTrigger} />
              </CardContent>
            </Card>

            {/* AML Information */}
            <Card className="bg-dex-dark/80 border-dex-secondary/30">
              <CardHeader>
                <CardTitle className="text-white">About AML Screening</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-400">
                    Our Anti-Money Laundering (AML) checker helps you verify the legitimacy of cryptocurrency addresses 
                    before conducting transactions. This tool analyzes addresses against known databases of suspicious activity.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-dex-secondary/10 rounded-lg text-center">
                      <Shield className="text-dex-primary mx-auto mb-2" size={24} />
                      <h4 className="text-white font-medium text-sm">Risk Assessment</h4>
                    </div>
                    <div className="p-3 bg-dex-secondary/10 rounded-lg text-center">
                      <CheckCircle className="text-green-500 mx-auto mb-2" size={24} />
                      <h4 className="text-white font-medium text-sm">Compliance Check</h4>
                    </div>
                    <div className="p-3 bg-dex-secondary/10 rounded-lg text-center">
                      <AlertTriangle className="text-yellow-500 mx-auto mb-2" size={24} />
                      <h4 className="text-white font-medium text-sm">Fraud Prevention</h4>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

KYCAMLPage.displayName = 'KYCAMLPage';

export default KYCAMLPage;
