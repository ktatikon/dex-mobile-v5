/**
 * Authentication Validation Service
 * Provides comprehensive validation and error handling for authentication flows
 */

import { supabase } from '@/integrations/supabase/client';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface EmailCheckResult {
  isAvailable: boolean;
  error?: string;
}

/**
 * Validates email format using a comprehensive regex pattern
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const normalizedEmail = email.trim().toLowerCase();

  if (!emailRegex.test(normalizedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

/**
 * Validates password strength
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }

  // Optional: Add more password strength requirements
  // const hasUpperCase = /[A-Z]/.test(password);
  // const hasLowerCase = /[a-z]/.test(password);
  // const hasNumbers = /\d/.test(password);
  // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return { isValid: true };
};

/**
 * Validates full name
 */
export const validateFullName = (fullName: string): ValidationResult => {
  if (!fullName || fullName.trim() === '') {
    return { isValid: false, error: 'Full name is required' };
  }

  if (fullName.trim().length < 2) {
    return { isValid: false, error: 'Full name must be at least 2 characters long' };
  }

  return { isValid: true };
};

/**
 * Validates phone number
 * Updated to match database constraint: allows empty phone or 5-20 characters with digits, spaces, hyphens, parentheses, and optional leading plus sign
 */
export const validatePhone = (phone: string): ValidationResult => {
  // Allow empty phone numbers (optional field)
  if (!phone || phone.trim() === '') {
    return { isValid: true }; // Empty phone is now allowed
  }

  // Updated phone validation to match database constraint
  // Allows: digits, spaces, hyphens, parentheses, optional leading plus sign
  // Length: 5-20 characters
  const phoneRegex = /^[+]?[0-9\s\-\(\)]{5,20}$/;

  if (!phoneRegex.test(phone)) {
    return {
      isValid: false,
      error: 'Phone number must be 5-20 characters and contain only digits, spaces, hyphens, parentheses, and optional leading plus sign'
    };
  }

  return { isValid: true };
};

/**
 * Checks if email is already in use
 */
export const checkEmailAvailability = async (email: string): Promise<EmailCheckResult> => {
  try {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return { isAvailable: false, error: emailValidation.error };
    }

    const normalizedEmail = email.trim().toLowerCase();

    // First check using the database function
    const { data: isAvailable, error: functionError } = await supabase
      .rpc('is_email_available', { email_to_check: normalizedEmail });

    if (functionError) {
      console.error('Error checking email availability via function:', functionError);
      
      // Fallback to direct query
      const { data: existingUser, error: queryError } = await supabase
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (queryError) {
        console.error('Error checking email availability via query:', queryError);
        return { isAvailable: false, error: 'Unable to verify email availability. Please try again.' };
      }

      return { isAvailable: !existingUser };
    }

    return { isAvailable: isAvailable === true };
  } catch (error) {
    console.error('Exception checking email availability:', error);
    return { isAvailable: false, error: 'Unable to verify email availability. Please try again.' };
  }
};

/**
 * Validates all signup form fields
 */
export const validateSignupForm = (formData: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}): ValidationResult => {
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    return emailValidation;
  }

  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    return passwordValidation;
  }

  const fullNameValidation = validateFullName(formData.fullName);
  if (!fullNameValidation.isValid) {
    return fullNameValidation;
  }

  const phoneValidation = validatePhone(formData.phone);
  if (!phoneValidation.isValid) {
    return phoneValidation;
  }

  return { isValid: true };
};

/**
 * Validates login form fields
 */
export const validateLoginForm = (formData: {
  email: string;
  password: string;
}): ValidationResult => {
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    return emailValidation;
  }

  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    return passwordValidation;
  }

  return { isValid: true };
};

/**
 * Normalizes email address for consistent storage
 */
export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Formats error messages for user display
 */
export const formatAuthError = (error: any): string => {
  if (!error) return 'An unexpected error occurred';

  const message = error.message || error.toString();

  // Handle common Supabase auth errors
  if (message.includes('User already registered')) {
    return 'An account with this email address already exists. Please try logging in instead.';
  }
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Please verify your email address before logging in. Check your inbox for the verification link.';
  }
  if (message.includes('Too many requests')) {
    return 'Too many attempts. Please wait a few minutes before trying again.';
  }
  if (message.includes('Invalid email')) {
    return 'Please enter a valid email address.';
  }
  if (message.includes('Password')) {
    return 'Password must be at least 6 characters long.';
  }

  // Return the original message if no specific handling is needed
  return message;
};

/**
 * Comprehensive authentication service for form validation and error handling
 */
export const AuthValidationService = {
  validateEmail,
  validatePassword,
  validateFullName,
  validatePhone,
  checkEmailAvailability,
  validateSignupForm,
  validateLoginForm,
  normalizeEmail,
  formatAuthError,
};
