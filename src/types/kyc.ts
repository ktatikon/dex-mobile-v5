export type KYCStatus = 'pending' | 'approved' | 'rejected';
export type DocumentType = 'passport' | 'drivers_license' | 'national_id';

export interface KYCData {
  id?: string;
  user_id?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string; // ISO format date string
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  document_type: DocumentType;
  government_id_url?: string;
  back_document_url?: string;
  selfie_url?: string;
  status: KYCStatus;
  submitted_at?: string;
  review_date?: string;
  reviewer_notes?: string;
}

export interface KYCDocuments {
  documentType: DocumentType;
  frontDocument: File | null;
  backDocument: File | null;
  selfie: File | null;
}

export interface KYCFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  documentType: DocumentType;
  frontDocument: File | null;
  backDocument: File | null;
  selfie: File | null;
  termsAccepted: boolean;
}

export interface KYCProgressState {
  currentStep: number;
  totalSteps: number;
  stepsCompleted: {
    personalInfo: boolean;
    documents: boolean;
    selfie: boolean;
    review: boolean;
  };
}
