import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKYC } from '@/contexts/KYCContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import KYCProgressIndicator from '@/components/kyc/KYCProgressIndicator';
import PersonalInfoForm from '@/components/kyc/PersonalInfoForm';
import DocumentUploadForm from '@/components/kyc/DocumentUploadForm';
import SelfieCapture from '@/components/kyc/SelfieCapture';
import ReviewSubmit from '@/components/kyc/ReviewSubmit';
import KYCStatus from '@/components/kyc/KYCStatus';
import AMLInformation from '@/components/aml/AMLInformation';
import AMLChecker from '@/components/aml/AMLChecker';
import AMLHistory from '@/components/aml/AMLHistory';
import type { AMLCheckRequest } from '@/types/aml';

const KYCPage: React.FC = () => {
  const navigate = useNavigate();
  const { progress, kycStatus, saveAndExit, isLoading } = useKYC();
  const [showForm, setShowForm] = useState(kycStatus !== 'pending' && kycStatus !== 'approved');
  const [amlRefreshTrigger, setAmlRefreshTrigger] = useState(0);

  const handleStartKYC = () => {
    setShowForm(true);
  };

  const handleSaveAndExit = async () => {
    await saveAndExit();
    navigate('/settings');
  };

  const handleAMLCheckComplete = (check: AMLCheckRequest) => {
    // Trigger refresh of AML history
    setAmlRefreshTrigger(prev => prev + 1);
  };

  const renderStep = () => {
    switch (progress.currentStep) {
      case 1:
        return <PersonalInfoForm />;
      case 2:
        return <DocumentUploadForm />;
      case 3:
        return <SelfieCapture />;
      case 4:
        return <ReviewSubmit />;
      default:
        return <PersonalInfoForm />;
    }
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate('/settings')}
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>
          <h1 className="text-2xl font-bold text-white">KYC/AML Verification</h1>
        </div>

        {showForm && progress.currentStep < 4 && (
          <Button
            variant="outline"
            className="min-h-[44px]"
            onClick={handleSaveAndExit}
            disabled={isLoading}
          >
            <Save className="mr-2 h-4 w-4" />
            Save & Exit
          </Button>
        )}
      </div>

      {showForm ? (
        <>
          <KYCProgressIndicator className="mb-6" />
          {renderStep()}
        </>
      ) : (
        <KYCStatus onStartKYC={handleStartKYC} />
      )}

      <Card className="bg-dex-dark/80 border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white">Why KYC is Important</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start">
              <span className="text-dex-secondary mr-2">•</span>
              <span>Helps prevent fraud and identity theft</span>
            </li>
            <li className="flex items-start">
              <span className="text-dex-secondary mr-2">•</span>
              <span>Ensures compliance with financial regulations</span>
            </li>
            <li className="flex items-start">
              <span className="text-dex-secondary mr-2">•</span>
              <span>Protects the platform and its users from illegal activities</span>
            </li>
            <li className="flex items-start">
              <span className="text-dex-secondary mr-2">•</span>
              <span>Unlocks higher transaction limits and additional features</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* AML Functionality - New Addition */}
      <div className="mt-8 space-y-6">
        {/* AML Information Section */}
        <AMLInformation />

        {/* AML Address Checker Interface */}
        <AMLChecker onCheckComplete={handleAMLCheckComplete} />

        {/* AML Request History */}
        <AMLHistory refreshTrigger={amlRefreshTrigger} />
      </div>
    </div>
  );
};

export default KYCPage;
