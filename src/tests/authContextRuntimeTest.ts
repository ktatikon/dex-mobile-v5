/**
 * Runtime test for AuthContext to verify function availability
 */

import { AuthValidationService } from '@/services/authValidationService';

export interface RuntimeTestResult {
  testName: string;
  passed: boolean;
  message: string;
  error?: any;
}

/**
 * Test AuthContext functions at runtime
 */
export const testAuthContextRuntime = (authContext: any): RuntimeTestResult[] => {
  const results: RuntimeTestResult[] = [];

  // Test 1: Context exists
  results.push({
    testName: 'AuthContext exists',
    passed: !!authContext,
    message: authContext ? 'Context is available' : 'Context is null/undefined'
  });

  if (!authContext) {
    return results;
  }

  // Test 2: signUp function exists and is callable
  results.push({
    testName: 'signUp function exists',
    passed: typeof authContext.signUp === 'function',
    message: `signUp type: ${typeof authContext.signUp}`
  });

  // Test 3: signIn function exists and is callable
  results.push({
    testName: 'signIn function exists',
    passed: typeof authContext.signIn === 'function',
    message: `signIn type: ${typeof authContext.signIn}`
  });

  // Test 4: signOut function exists and is callable
  results.push({
    testName: 'signOut function exists',
    passed: typeof authContext.signOut === 'function',
    message: `signOut type: ${typeof authContext.signOut}`
  });

  // Test 5: All required properties exist
  const requiredProps = ['session', 'user', 'loading', 'signUp', 'signIn', 'signOut'];
  const missingProps = requiredProps.filter(prop => !(prop in authContext));
  
  results.push({
    testName: 'All required properties exist',
    passed: missingProps.length === 0,
    message: missingProps.length === 0 
      ? 'All properties present' 
      : `Missing properties: ${missingProps.join(', ')}`
  });

  return results;
};

/**
 * Test validation service functions
 */
export const testValidationService = (): RuntimeTestResult[] => {
  const results: RuntimeTestResult[] = [];

  try {
    // Test email validation
    const emailTest = AuthValidationService.validateEmail('test@example.com');
    results.push({
      testName: 'Email validation service',
      passed: emailTest.isValid === true,
      message: emailTest.isValid ? 'Email validation working' : `Error: ${emailTest.error}`
    });
  } catch (error) {
    results.push({
      testName: 'Email validation service',
      passed: false,
      message: `Exception: ${error}`,
      error
    });
  }

  try {
    // Test password validation
    const passwordTest = AuthValidationService.validatePassword('password123');
    results.push({
      testName: 'Password validation service',
      passed: passwordTest.isValid === true,
      message: passwordTest.isValid ? 'Password validation working' : `Error: ${passwordTest.error}`
    });
  } catch (error) {
    results.push({
      testName: 'Password validation service',
      passed: false,
      message: `Exception: ${error}`,
      error
    });
  }

  try {
    // Test form validation
    const formTest = AuthValidationService.validateSignupForm({
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
      phone: '+1234567890'
    });
    results.push({
      testName: 'Form validation service',
      passed: formTest.isValid === true,
      message: formTest.isValid ? 'Form validation working' : `Error: ${formTest.error}`
    });
  } catch (error) {
    results.push({
      testName: 'Form validation service',
      passed: false,
      message: `Exception: ${error}`,
      error
    });
  }

  return results;
};

/**
 * Comprehensive runtime test
 */
export const runComprehensiveRuntimeTest = (authContext: any): {
  authTests: RuntimeTestResult[];
  validationTests: RuntimeTestResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    successRate: number;
  };
} => {
  console.log('🧪 Running comprehensive runtime tests...');

  const authTests = testAuthContextRuntime(authContext);
  const validationTests = testValidationService();

  const allTests = [...authTests, ...validationTests];
  const passedTests = allTests.filter(test => test.passed).length;
  const failedTests = allTests.length - passedTests;

  const summary = {
    totalTests: allTests.length,
    passedTests,
    failedTests,
    successRate: Math.round((passedTests / allTests.length) * 100)
  };

  console.log('📊 Runtime Test Summary:', summary);
  
  if (failedTests > 0) {
    console.log('❌ Failed Tests:');
    allTests.filter(test => !test.passed).forEach(test => {
      console.log(`  - ${test.testName}: ${test.message}`);
    });
  }

  return {
    authTests,
    validationTests,
    summary
  };
};

/**
 * Quick diagnostic for AuthContext issues
 */
export const diagnoseAuthContext = (authContext: any): string[] => {
  const issues: string[] = [];

  if (!authContext) {
    issues.push('AuthContext is null or undefined - check if component is wrapped in AuthProvider');
    return issues;
  }

  if (typeof authContext.signUp !== 'function') {
    issues.push(`signUp is not a function (type: ${typeof authContext.signUp})`);
  }

  if (typeof authContext.signIn !== 'function') {
    issues.push(`signIn is not a function (type: ${typeof authContext.signIn})`);
  }

  if (typeof authContext.signOut !== 'function') {
    issues.push(`signOut is not a function (type: ${typeof authContext.signOut})`);
  }

  if (!('session' in authContext)) {
    issues.push('session property missing from context');
  }

  if (!('user' in authContext)) {
    issues.push('user property missing from context');
  }

  if (!('loading' in authContext)) {
    issues.push('loading property missing from context');
  }

  if (issues.length === 0) {
    issues.push('No issues detected - AuthContext appears to be properly configured');
  }

  return issues;
};

/**
 * Export for use in components
 */
export const AuthContextRuntimeTest = {
  testAuthContextRuntime,
  testValidationService,
  runComprehensiveRuntimeTest,
  diagnoseAuthContext
};
