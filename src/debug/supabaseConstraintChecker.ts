/**
 * Supabase Constraint and Schema Checker
 * Tools to verify database constraints and schema compliance
 */

import { supabase } from '@/integrations/supabase/client';

export interface ConstraintCheckResult {
  checkName: string;
  passed: boolean;
  details: any;
  recommendation?: string;
}

/**
 * Validate email format
 */
export const validateEmailFormat = (email: string): ConstraintCheckResult => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const isValid = emailRegex.test(email);

  return {
    checkName: 'Email Format Validation',
    passed: isValid,
    details: { email, isValid },
    recommendation: isValid ? undefined : 'Use a valid email format (e.g., user@example.com)'
  };
};

/**
 * Validate phone format
 * Updated to match database constraint: allows empty phone or 5-20 characters with digits, spaces, hyphens, parentheses, and optional leading plus sign
 */
export const validatePhoneFormat = (phone: string): ConstraintCheckResult => {
  // Updated phone validation to match database constraint
  // Allow empty phone numbers or validate format
  const isEmptyPhone = !phone || phone.trim() === '';
  const phoneRegex = /^[+]?[0-9\s\-\(\)]{5,20}$/;
  const isValid = isEmptyPhone || phoneRegex.test(phone);

  return {
    checkName: 'Phone Format Validation',
    passed: isValid,
    details: {
      phone,
      isEmpty: isEmptyPhone,
      isValid,
      constraint: 'phone = \'\' OR phone ~ \'^[+]?[0-9\\s\\-\\(\\)]{5,20}$\''
    },
    recommendation: isValid ? undefined : 'Phone must be empty or 5-20 characters containing only digits, spaces, hyphens, parentheses, and optional leading plus sign'
  };
};

/**
 * Validate full name
 */
export const validateFullName = (fullName: string): ConstraintCheckResult => {
  const isValid = fullName && fullName.trim().length >= 2 && fullName.trim().length <= 100;

  return {
    checkName: 'Full Name Validation',
    passed: isValid,
    details: { fullName, length: fullName?.length, isValid },
    recommendation: isValid ? undefined : 'Full name must be 2-100 characters long'
  };
};

/**
 * Validate status field
 */
export const validateStatus = (status: string): ConstraintCheckResult => {
  const validStatuses = ['active', 'inactive', 'pending', 'suspended'];
  const isValid = validStatuses.includes(status);

  return {
    checkName: 'Status Validation',
    passed: isValid,
    details: { status, validStatuses, isValid },
    recommendation: isValid ? undefined : `Status must be one of: ${validStatuses.join(', ')}`
  };
};

/**
 * Check if auth_id is a valid UUID
 */
export const validateAuthId = (authId: string): ConstraintCheckResult => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isValid = uuidRegex.test(authId);

  return {
    checkName: 'Auth ID UUID Validation',
    passed: isValid,
    details: { authId, isValid },
    recommendation: isValid ? undefined : 'Auth ID must be a valid UUID format'
  };
};

/**
 * Check for duplicate email
 */
export const checkDuplicateEmail = async (email: string): Promise<ConstraintCheckResult> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      return {
        checkName: 'Duplicate Email Check',
        passed: false,
        details: { email, error },
        recommendation: 'Unable to check for duplicate email due to database error'
      };
    }

    const isDuplicate = !!data;

    return {
      checkName: 'Duplicate Email Check',
      passed: !isDuplicate,
      details: { email, isDuplicate, existingUser: data },
      recommendation: isDuplicate ? 'This email is already registered. Use a different email or try logging in.' : undefined
    };
  } catch (exception) {
    return {
      checkName: 'Duplicate Email Check',
      passed: false,
      details: { email, exception },
      recommendation: 'Unable to check for duplicate email due to exception'
    };
  }
};

/**
 * Check for duplicate auth_id
 */
export const checkDuplicateAuthId = async (authId: string): Promise<ConstraintCheckResult> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, auth_id')
      .eq('auth_id', authId)
      .maybeSingle();

    if (error) {
      return {
        checkName: 'Duplicate Auth ID Check',
        passed: false,
        details: { authId, error },
        recommendation: 'Unable to check for duplicate auth_id due to database error'
      };
    }

    const isDuplicate = !!data;

    return {
      checkName: 'Duplicate Auth ID Check',
      passed: !isDuplicate,
      details: { authId, isDuplicate, existingUser: data },
      recommendation: isDuplicate ? 'This auth_id already exists. This may indicate a duplicate signup attempt.' : undefined
    };
  } catch (exception) {
    return {
      checkName: 'Duplicate Auth ID Check',
      passed: false,
      details: { authId, exception },
      recommendation: 'Unable to check for duplicate auth_id due to exception'
    };
  }
};

/**
 * Comprehensive constraint validation
 */
export const validateUserData = async (userData: {
  auth_id: string;
  email: string;
  full_name: string;
  phone: string;
  status?: string;
}): Promise<{
  allValid: boolean;
  results: ConstraintCheckResult[];
  criticalIssues: string[];
}> => {
  console.log('🔍 Starting comprehensive user data validation...');

  const results: ConstraintCheckResult[] = [];

  // Validate format constraints
  results.push(validateAuthId(userData.auth_id));
  results.push(validateEmailFormat(userData.email));
  results.push(validateFullName(userData.full_name));
  results.push(validatePhoneFormat(userData.phone));
  results.push(validateStatus(userData.status || 'active'));

  // Check for duplicates
  results.push(await checkDuplicateEmail(userData.email));
  results.push(await checkDuplicateAuthId(userData.auth_id));

  const allValid = results.every(result => result.passed);
  const criticalIssues = results
    .filter(result => !result.passed)
    .map(result => `${result.checkName}: ${result.recommendation || 'Validation failed'}`);

  console.log('🔍 User data validation completed:', {
    allValid,
    totalChecks: results.length,
    passedChecks: results.filter(r => r.passed).length,
    failedChecks: results.filter(r => !r.passed).length
  });

  return { allValid, results, criticalIssues };
};

/**
 * Pre-signup validation (excludes auth_id since it doesn't exist yet)
 */
export const validatePreSignupData = async (userData: {
  email: string;
  full_name: string;
  phone: string;
  status?: string;
}): Promise<{
  allValid: boolean;
  results: ConstraintCheckResult[];
  criticalIssues: string[];
}> => {
  console.log('🔍 Starting pre-signup data validation...');

  const results: ConstraintCheckResult[] = [];

  // Validate format constraints (excluding auth_id)
  results.push(validateEmailFormat(userData.email));
  results.push(validateFullName(userData.full_name));
  results.push(validatePhoneFormat(userData.phone));
  results.push(validateStatus(userData.status || 'active'));

  // Check for duplicate email only (auth_id doesn't exist yet)
  results.push(await checkDuplicateEmail(userData.email));

  const allValid = results.every(result => result.passed);
  const criticalIssues = results
    .filter(result => !result.passed)
    .map(result => `${result.checkName}: ${result.recommendation || 'Validation failed'}`);

  console.log('🔍 Pre-signup data validation completed:', {
    allValid,
    totalChecks: results.length,
    passedChecks: results.filter(r => r.passed).length,
    failedChecks: results.filter(r => !r.passed).length
  });

  return { allValid, results, criticalIssues };
};

/**
 * Post-signup validation (validates auth_id after it's received from Supabase)
 */
export const validatePostSignupAuthId = (authId: string): ConstraintCheckResult => {
  console.log('🔍 Validating post-signup auth_id:', authId);

  const result = validateAuthId(authId);

  if (result.passed) {
    console.log('✅ Post-signup auth_id validation passed');
  } else {
    console.error('❌ Post-signup auth_id validation failed:', result.recommendation);
  }

  return result;
};

/**
 * Test specific constraint violations
 */
export const testConstraintViolations = async (): Promise<{
  tests: ConstraintCheckResult[];
  summary: string;
}> => {
  console.log('🧪 Testing constraint violations...');

  const tests: ConstraintCheckResult[] = [];

  // Test invalid email formats
  tests.push(validateEmailFormat('invalid-email'));
  tests.push(validateEmailFormat('test@'));
  tests.push(validateEmailFormat('@example.com'));
  tests.push(validateEmailFormat('valid@example.com'));

  // Test invalid phone formats
  tests.push(validatePhoneFormat('abc123'));
  tests.push(validatePhoneFormat(''));
  tests.push(validatePhoneFormat('+1234567890'));

  // Test invalid names
  tests.push(validateFullName(''));
  tests.push(validateFullName('A'));
  tests.push(validateFullName('Valid Name'));

  // Test invalid UUIDs
  tests.push(validateAuthId('not-a-uuid'));
  tests.push(validateAuthId('12345678-1234-1234-1234-123456789012'));

  // Test invalid status
  tests.push(validateStatus('invalid-status'));
  tests.push(validateStatus('active'));

  const passedTests = tests.filter(t => t.passed).length;
  const failedTests = tests.length - passedTests;

  const summary = `Constraint tests completed: ${passedTests}/${tests.length} passed, ${failedTests} failed (expected failures for invalid data)`;

  console.log('🧪 Constraint violation tests completed:', summary);

  return { tests, summary };
};

/**
 * Generate test data for debugging
 */
export const generateTestUserData = (authId?: string) => {
  const testAuthId = authId || crypto.randomUUID();
  const timestamp = Date.now();

  return {
    auth_id: testAuthId,
    email: `test.user.${timestamp}@example.com`,
    full_name: `Test User ${timestamp}`,
    phone: `+123456${timestamp.toString().slice(-4)}`,
    status: 'active' as const
  };
};

export const ConstraintChecker = {
  validateEmailFormat,
  validatePhoneFormat,
  validateFullName,
  validateStatus,
  validateAuthId,
  checkDuplicateEmail,
  checkDuplicateAuthId,
  validateUserData,
  validatePreSignupData,
  validatePostSignupAuthId,
  testConstraintViolations,
  generateTestUserData
};
