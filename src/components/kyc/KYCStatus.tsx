import React from 'react';
import { useKYC } from '@/contexts/KYCContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { KYCStatus as KYCStatusType } from '@/types/kyc';

interface KYCStatusProps {
  onStartKYC: () => void;
}

const KYCStatus: React.FC<KYCStatusProps> = ({ onStartKYC }) => {
  const { kycStatus, isLoading } = useKYC();
  
  const renderStatusContent = () => {
    switch (kycStatus) {
      case 'approved':
        return (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Verification Approved</h3>
            <p className="text-gray-400 mb-6">
              Your identity has been successfully verified. You now have full access to all platform features.
            </p>
            <Button
              variant="outline"
              className="min-h-[44px] border-green-500/30 text-white"
              disabled
            >
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              Verified
            </Button>
          </div>
        );
        
      case 'pending':
        return (
          <div className="text-center">
            <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Verification in Progress</h3>
            <p className="text-gray-400 mb-6">
              Your KYC submission is currently being reviewed. This process typically takes 1-3 business days.
            </p>
            <Button
              variant="outline"
              className="min-h-[44px]"
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Checking Status...' : 'Check Status'}
            </Button>
          </div>
        );
        
      case 'rejected':
        return (
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-dex-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Verification Failed</h3>
            <p className="text-gray-400 mb-6">
              Unfortunately, your KYC submission was not approved. Please resubmit with clearer documents.
            </p>
            <Button
              variant="primary"
              className="min-h-[44px]"
              onClick={onStartKYC}
            >
              Try Again
            </Button>
          </div>
        );
        
      default:
        return (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-dex-primary/20 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-dex-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Verification Required</h3>
            <p className="text-gray-400 mb-6">
              Complete the KYC process to unlock full platform functionality and higher transaction limits.
            </p>
            <Button
              variant="primary"
              className="min-h-[44px]"
              onClick={onStartKYC}
            >
              Start Verification
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
    }
  };

  return (
    <Card className="bg-dex-dark/80 border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
      <CardContent className="p-6">
        {renderStatusContent()}
      </CardContent>
    </Card>
  );
};

export default KYCStatus;
