import React, { useState } from 'react';
import { useKYC } from '@/contexts/KYCContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { DocumentType } from '@/types/kyc';
import {
  FileImage,
  Upload,
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from '@/components/ui/alert';

const DocumentUploadForm: React.FC = () => {
  const { formData, updateDocuments, goToNextStep, goToPreviousStep } = useKYC();
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    documentType?: string;
    frontDocument?: string;
    backDocument?: string;
  }>({});

  const handleDocumentTypeChange = (value: DocumentType) => {
    updateDocuments({ documentType: value });
    setErrors(prev => ({ ...prev, documentType: undefined }));
  };

  const handleFrontDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          frontDocument: 'File size must be less than 5MB'
        }));
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          frontDocument: 'File must be an image (JPEG, PNG) or PDF'
        }));
        return;
      }

      // Clear any previous errors
      setErrors(prev => ({ ...prev, frontDocument: undefined }));

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setFrontPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // For PDFs, just show an icon
        setFrontPreview('pdf');
      }

      updateDocuments({ frontDocument: file });
    }
  };

  const handleBackDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          backDocument: 'File size must be less than 5MB'
        }));
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          backDocument: 'File must be an image (JPEG, PNG) or PDF'
        }));
        return;
      }

      // Clear any previous errors
      setErrors(prev => ({ ...prev, backDocument: undefined }));

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setBackPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // For PDFs, just show an icon
        setBackPreview('pdf');
      }

      updateDocuments({ backDocument: file });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: {
      documentType?: string;
      frontDocument?: string;
      backDocument?: string;
    } = {};

    if (!formData.documentType) {
      newErrors.documentType = 'Please select a document type';
    }

    if (!formData.frontDocument) {
      newErrors.frontDocument = 'Please upload the front of your document';
    }

    if (!formData.backDocument && formData.documentType !== 'passport') {
      newErrors.backDocument = 'Please upload the back of your document';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    goToNextStep();
  };

  return (
    <Card className="bg-dex-dark/80 border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="documentType" className="text-white">Document Type</Label>
            <Select
              value={formData.documentType}
              onValueChange={(value) => handleDocumentTypeChange(value as DocumentType)}
            >
              <SelectTrigger
                id="documentType"
                className="bg-dex-dark/70 border-dex-secondary/30 text-white min-h-[44px]"
              >
                <SelectValue placeholder="Select a document type" />
              </SelectTrigger>
              <SelectContent className="bg-dex-dark border-dex-secondary/30 text-white">
                <SelectItem value="passport" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Passport</SelectItem>
                <SelectItem value="drivers_license" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Driver's License</SelectItem>
                <SelectItem value="national_id" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">National ID Card</SelectItem>
              </SelectContent>
            </Select>
            {errors.documentType && (
              <p className="text-sm text-dex-primary mt-1">{errors.documentType}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="frontDocument" className="text-white">
              Front of {formData.documentType === 'passport' ? 'Passport' :
                formData.documentType === 'drivers_license' ? 'Driver\'s License' :
                'National ID Card'}
            </Label>

            {frontPreview ? (
              <div className="relative border border-dex-secondary/30 rounded-lg p-2 bg-dex-dark/50">
                <div className="flex items-center justify-center">
                  {frontPreview === 'pdf' ? (
                    <div className="w-full h-40 flex flex-col items-center justify-center text-white">
                      <FileImage size={48} className="mb-2 text-dex-secondary" />
                      <p>PDF Document</p>
                    </div>
                  ) : (
                    <img
                      src={frontPreview}
                      alt="Document front preview"
                      className="max-h-40 object-contain rounded"
                    />
                  )}
                </div>
                <div className="mt-2 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFrontPreview(null);
                      updateDocuments({ frontDocument: null });
                    }}
                    className="text-white"
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-dex-secondary/30 rounded-lg p-6 flex flex-col items-center justify-center bg-dex-dark/50">
                <Upload size={32} className="text-dex-secondary mb-2" />
                <p className="text-white mb-4">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-400 mb-4">PNG, JPG, or PDF (max 5MB)</p>
                <Input
                  id="frontDocument"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,application/pdf"
                  onChange={handleFrontDocumentChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('frontDocument')?.click()}
                  className="min-h-[44px]"
                >
                  Select File
                </Button>
              </div>
            )}
            {errors.frontDocument && (
              <p className="text-sm text-dex-primary mt-1">{errors.frontDocument}</p>
            )}
          </div>

          {formData.documentType !== 'passport' && (
            <div className="space-y-2">
              <Label htmlFor="backDocument" className="text-white">
                Back of {formData.documentType === 'drivers_license' ? 'Driver\'s License' : 'National ID Card'}
              </Label>

              {backPreview ? (
                <div className="relative border border-dex-secondary/30 rounded-lg p-2 bg-dex-dark/50">
                  <div className="flex items-center justify-center">
                    {backPreview === 'pdf' ? (
                      <div className="w-full h-40 flex flex-col items-center justify-center text-white">
                        <FileImage size={48} className="mb-2 text-dex-secondary" />
                        <p>PDF Document</p>
                      </div>
                    ) : (
                      <img
                        src={backPreview}
                        alt="Document back preview"
                        className="max-h-40 object-contain rounded"
                      />
                    )}
                  </div>
                  <div className="mt-2 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBackPreview(null);
                        updateDocuments({ backDocument: null });
                      }}
                      className="text-white"
                    >
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-dex-secondary/30 rounded-lg p-6 flex flex-col items-center justify-center bg-dex-dark/50">
                  <Upload size={32} className="text-dex-secondary mb-2" />
                  <p className="text-white mb-4">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-400 mb-4">PNG, JPG, or PDF (max 5MB)</p>
                  <Input
                    id="backDocument"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,application/pdf"
                    onChange={handleBackDocumentChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('backDocument')?.click()}
                    className="min-h-[44px]"
                  >
                    Select File
                  </Button>
                </div>
              )}
              {errors.backDocument && (
                <p className="text-sm text-dex-primary mt-1">{errors.backDocument}</p>
              )}
            </div>
          )}

          <Alert className="bg-dex-dark/50 border-dex-secondary/30">
            <AlertCircle className="h-4 w-4 text-dex-secondary" />
            <AlertDescription className="text-white text-sm">
              Make sure your document is clearly visible and all information is readable.
            </AlertDescription>
          </Alert>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px]"
              onClick={goToPreviousStep}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="min-h-[44px]"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DocumentUploadForm;
