import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKYC } from '@/contexts/KYCContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  ChevronLeft,
  Check,
  FileImage,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileCheck,
  Camera,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const ReviewSubmit: React.FC = () => {
  const navigate = useNavigate();
  const { formData, setTermsAccepted, goToPreviousStep, submitKYC, isLoading } = useKYC();
  const [error, setError] = useState<string | null>(null);

  const handleTermsChange = (checked: boolean) => {
    setTermsAccepted(checked);
    if (checked) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.termsAccepted) {
      setError('You must accept the terms and conditions to proceed');
      return;
    }

    const success = await submitKYC();
    if (success) {
      navigate('/settings');
    }
  };

  const getDocumentTypeName = () => {
    switch (formData.documentType) {
      case 'passport':
        return 'Passport';
      case 'drivers_license':
        return 'Driver\'s License';
      case 'national_id':
        return 'National ID Card';
      default:
        return 'Document';
    }
  };

  return (
    <Card className="bg-dex-dark/80 border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Review Your Information</h3>

            {/* Personal Information Summary */}
            <div className="bg-dex-dark/50 rounded-lg p-4 border border-dex-secondary/20">
              <div className="flex items-center mb-2">
                <User className="h-5 w-5 text-dex-secondary mr-2" />
                <h4 className="text-white font-medium">Personal Information</h4>
              </div>
              <Separator className="bg-dex-secondary/20 my-2" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">Full Name:</div>
                <div className="text-white">
                  {formData.firstName} {formData.middleName} {formData.lastName}
                </div>

                <div className="text-gray-400 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Date of Birth:
                </div>
                <div className="text-white">
                  {new Date(formData.dateOfBirth).toLocaleDateString()}
                </div>

                <div className="text-gray-400 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  Address:
                </div>
                <div className="text-white">
                  {formData.address}, {formData.city}, {formData.state}, {formData.postalCode}, {formData.country}
                </div>

                <div className="text-gray-400 flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  Phone:
                </div>
                <div className="text-white">{formData.phone}</div>

                <div className="text-gray-400 flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  Email:
                </div>
                <div className="text-white">{formData.email}</div>
              </div>
            </div>

            {/* Document Information Summary */}
            <div className="bg-dex-dark/50 rounded-lg p-4 border border-dex-secondary/20">
              <div className="flex items-center mb-2">
                <FileCheck className="h-5 w-5 text-dex-secondary mr-2" />
                <h4 className="text-white font-medium">Document Information</h4>
              </div>
              <Separator className="bg-dex-secondary/20 my-2" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">Document Type:</div>
                <div className="text-white">{getDocumentTypeName()}</div>

                <div className="text-gray-400">Front Document:</div>
                <div className="text-white flex items-center">
                  <FileImage className="h-4 w-4 mr-1 text-dex-secondary" />
                  {formData.frontDocument?.name || 'Not uploaded'}
                </div>

                {formData.documentType !== 'passport' && (
                  <>
                    <div className="text-gray-400">Back Document:</div>
                    <div className="text-white flex items-center">
                      <FileImage className="h-4 w-4 mr-1 text-dex-secondary" />
                      {formData.backDocument?.name || 'Not uploaded'}
                    </div>
                  </>
                )}

                <div className="text-gray-400">Selfie:</div>
                <div className="text-white flex items-center">
                  <Camera className="h-4 w-4 mr-1 text-dex-secondary" />
                  {formData.selfie ? 'Captured' : 'Not captured'}
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.termsAccepted}
                onCheckedChange={handleTermsChange}
              />
              <Label
                htmlFor="terms"
                className="text-white text-sm leading-tight"
              >
                I confirm that all information provided is accurate and complete. I understand that providing false information may result in rejection of my application and possible legal consequences.
              </Label>
            </div>

            {error && (
              <p className="text-sm text-dex-primary">{error}</p>
            )}
          </div>

          <Alert className="bg-dex-dark/50 border-dex-secondary/30">
            <AlertCircle className="h-4 w-4 text-dex-secondary" />
            <AlertDescription className="text-white text-sm">
              By submitting this form, you consent to the processing of your personal data for KYC verification purposes in accordance with our Privacy Policy.
            </AlertDescription>
          </Alert>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px]"
              onClick={goToPreviousStep}
              disabled={isLoading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="min-h-[44px]"
              disabled={isLoading || !formData.termsAccepted}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Submit KYC
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReviewSubmit;
