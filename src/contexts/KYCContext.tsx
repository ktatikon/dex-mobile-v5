import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  KYCFormData,
  KYCProgressState,
  KYCDocuments,
  KYCStatus,
  DocumentType
} from '@/types/kyc';

interface KYCContextType {
  formData: KYCFormData;
  progress: KYCProgressState;
  kycStatus: KYCStatus | null;
  isLoading: boolean;
  updatePersonalInfo: (data: Partial<Omit<KYCFormData, 'documentType' | 'frontDocument' | 'backDocument' | 'selfie' | 'termsAccepted'>>) => void;
  updateDocuments: (data: Partial<KYCDocuments>) => void;
  setTermsAccepted: (accepted: boolean) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: number) => void;
  saveAndExit: () => Promise<void>;
  submitKYC: () => Promise<boolean>;
  resetForm: () => void;
}

const defaultFormData: KYCFormData = {
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  phone: '',
  email: '',
  documentType: 'passport',
  frontDocument: null,
  backDocument: null,
  selfie: null,
  termsAccepted: false,
};

const defaultProgress: KYCProgressState = {
  currentStep: 1,
  totalSteps: 4,
  stepsCompleted: {
    personalInfo: false,
    documents: false,
    selfie: false,
    review: false,
  },
};

const KYCContext = createContext<KYCContextType>({} as KYCContextType);

export const KYCProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);

  const [formData, setFormData] = useState<KYCFormData>({
    ...defaultFormData
  });

  const [progress, setProgress] = useState<KYCProgressState>({ ...defaultProgress });

  // Check if user has existing KYC submission
  useEffect(() => {
    const checkExistingKYC = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        console.log('Checking existing KYC for user:', user.id);

        // Check for existing KYC submission using auth user ID directly
        const { data: kycData, error: kycError } = await supabase
          .from('kyc')
          .select('*')
          .eq('user_id', user.id) // Use auth user ID directly
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (kycError && kycError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error fetching KYC status:', kycError);
          return;
        }

        if (kycData) {
          setKycStatus(kycData.status as KYCStatus);

          // If KYC is pending or approved, load the saved data
          if (kycData.status === 'pending' || kycData.status === 'approved') {
            setFormData({
              firstName: kycData.first_name || '',
              middleName: kycData.middle_name || '',
              lastName: kycData.last_name || '',
              dateOfBirth: kycData.date_of_birth || '',
              address: kycData.address || '',
              city: kycData.city || '',
              state: kycData.state || '',
              postalCode: kycData.postal_code || '',
              country: kycData.country || '',
              phone: kycData.phone || '',
              email: kycData.email || '',
              documentType: (kycData.document_type as DocumentType) || 'passport',
              frontDocument: null,
              backDocument: null,
              selfie: null,
              termsAccepted: false
            });

            setProgress(prev => ({
              ...prev,
              stepsCompleted: {
                ...prev.stepsCompleted,
                personalInfo: true,
                documents: !!kycData.government_id_url,
                selfie: !!kycData.selfie_url
              }
            }));
          }
        }
      } catch (error) {
        console.error('Error checking KYC status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingKYC();
  }, [user]);

  const updatePersonalInfo = (data: Partial<Omit<KYCFormData, 'documentType' | 'frontDocument' | 'backDocument' | 'selfie' | 'termsAccepted'>>) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }));
  };

  const updateDocuments = (data: Partial<KYCDocuments>) => {
    setFormData(prev => ({
      ...prev,
      documentType: data.documentType || prev.documentType,
      frontDocument: data.frontDocument !== undefined ? data.frontDocument : prev.frontDocument,
      backDocument: data.backDocument !== undefined ? data.backDocument : prev.backDocument,
      selfie: data.selfie !== undefined ? data.selfie : prev.selfie
    }));
  };

  const setTermsAccepted = (accepted: boolean) => {
    setFormData(prev => ({
      ...prev,
      termsAccepted: accepted
    }));
  };

  const goToNextStep = () => {
    if (progress.currentStep < progress.totalSteps) {
      setProgress(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1
      }));
    }
  };

  const goToPreviousStep = () => {
    if (progress.currentStep > 1) {
      setProgress(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1
      }));
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= progress.totalSteps) {
      setProgress(prev => ({
        ...prev,
        currentStep: step
      }));
    }
  };

  const saveAndExit = async (): Promise<void> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save your progress",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Saving KYC progress for user:', user.id);

      // Check if user already has a KYC submission
      const { data: existingKyc, error: existingKycError } = await supabase
        .from('kyc')
        .select('id')
        .eq('user_id', user.id) // Use auth user ID directly
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingKycError && existingKycError.code !== 'PGRST116') {
        console.error('Error checking existing KYC:', existingKycError);
        throw new Error('Error checking existing KYC submission');
      }

      const kycData = {
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postalCode,
        country: formData.country,
        phone: formData.phone,
        email: formData.email,
        document_type: formData.documentType,
        // Don't update document URLs if they're not changed
      };

      // If there's an existing KYC submission, update it
      // Otherwise, create a new one with status 'pending'
      if (existingKyc) {
        console.log('Updating existing KYC progress:', existingKyc.id);
        const { error: updateError } = await supabase
          .from('kyc')
          .update(kycData)
          .eq('id', existingKyc.id);

        if (updateError) {
          console.error('Error updating KYC progress:', updateError);
          throw new Error(`Error updating KYC progress: ${updateError.message}`);
        }
      } else {
        console.log('Creating new KYC progress record');
        const { error: insertError } = await supabase
          .from('kyc')
          .insert({
            user_id: user.id, // Use auth user ID directly
            ...kycData,
            status: 'pending',
            submitted_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Error inserting KYC progress:', insertError);
          throw new Error(`Error saving KYC progress: ${insertError.message}`);
        }
      }

      toast({
        title: "Progress Saved",
        description: "Your KYC information has been saved. You can continue later.",
      });
    } catch (error: any) {
      console.error('Error saving KYC progress:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while saving your progress",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitKYC = async (): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit KYC",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    try {
      console.log('Starting KYC submission for user:', user.id);

      // Check if KYC already exists for this user
      const { data: existingKyc, error: existingKycError } = await supabase
        .from('kyc')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingKycError && existingKycError.code !== 'PGRST116') {
        console.error('Error checking existing KYC:', existingKycError);
        throw new Error('Error checking existing KYC submission');
      }

      // Upload documents if they exist
      let frontDocumentPath = '';
      let backDocumentPath = '';
      let selfiePath = '';

      if (formData.frontDocument) {
        const frontFileName = `${user.id}/${Date.now()}_front_${formData.frontDocument.name}`;
        console.log('Uploading front document:', frontFileName);
        const { error: frontUploadError, data: frontData } = await supabase.storage
          .from('kyc')
          .upload(frontFileName, formData.frontDocument);

        if (frontUploadError) {
          console.error('Front document upload error:', frontUploadError);
          throw new Error(`Failed to upload front document: ${frontUploadError.message}`);
        }
        frontDocumentPath = frontData.path;
        console.log('Front document uploaded successfully:', frontDocumentPath);
      }

      if (formData.backDocument) {
        const backFileName = `${user.id}/${Date.now()}_back_${formData.backDocument.name}`;
        console.log('Uploading back document:', backFileName);
        const { error: backUploadError, data: backData } = await supabase.storage
          .from('kyc')
          .upload(backFileName, formData.backDocument);

        if (backUploadError) {
          console.error('Back document upload error:', backUploadError);
          throw new Error(`Failed to upload back document: ${backUploadError.message}`);
        }
        backDocumentPath = backData.path;
        console.log('Back document uploaded successfully:', backDocumentPath);
      }

      if (formData.selfie) {
        const selfieFileName = `${user.id}/${Date.now()}_selfie_${formData.selfie.name}`;
        console.log('Uploading selfie:', selfieFileName);
        const { error: selfieUploadError, data: selfieData } = await supabase.storage
          .from('kyc')
          .upload(selfieFileName, formData.selfie);

        if (selfieUploadError) {
          console.error('Selfie upload error:', selfieUploadError);
          throw new Error(`Failed to upload selfie: ${selfieUploadError.message}`);
        }
        selfiePath = selfieData.path;
        console.log('Selfie uploaded successfully:', selfiePath);
      }

      // Prepare KYC data
      const kycData = {
        user_id: user.id, // Use auth user ID directly, not database user ID
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postalCode,
        country: formData.country,
        phone: formData.phone,
        email: formData.email,
        document_type: formData.documentType,
        government_id_url: frontDocumentPath,
        back_document_url: backDocumentPath,
        selfie_url: selfiePath,
        status: 'pending' as const,
        submitted_at: new Date().toISOString(),
      };

      console.log('Submitting KYC data:', kycData);

      // Create or update KYC submission
      let kycError;
      if (existingKyc) {
        console.log('Updating existing KYC submission:', existingKyc.id);
        const { error } = await supabase
          .from('kyc')
          .update(kycData)
          .eq('id', existingKyc.id);
        kycError = error;
      } else {
        console.log('Creating new KYC submission');
        const { error } = await supabase
          .from('kyc')
          .insert(kycData);
        kycError = error;
      }

      if (kycError) {
        console.error('KYC submission error:', kycError);
        throw new Error(`Error saving KYC information: ${kycError.message}`);
      }

      console.log('KYC submitted successfully');
      setKycStatus('pending');

      toast({
        title: "KYC Submitted",
        description: "Your KYC information has been submitted for review.",
      });

      return true;
    } catch (error: any) {
      console.error('Error submitting KYC:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while submitting your KYC information",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      ...defaultFormData
    });
    setProgress({ ...defaultProgress });
  };

  return (
    <KYCContext.Provider
      value={{
        formData,
        progress,
        kycStatus,
        isLoading,
        updatePersonalInfo,
        updateDocuments,
        setTermsAccepted,
        goToNextStep,
        goToPreviousStep,
        goToStep,
        saveAndExit,
        submitKYC,
        resetForm,
      }}
    >
      {children}
    </KYCContext.Provider>
  );
};

export const useKYC = () => useContext(KYCContext);
