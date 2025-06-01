/**
 * Authentication System Test Suite
 * Tests the fixed authentication flow for both new and existing users
 */

import { supabase } from '@/integrations/supabase/client';
import { AuthValidationService } from '@/services/authValidationService';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

/**
 * Comprehensive authentication test suite
 */
export class AuthenticationTestSuite {
  private results: TestResult[] = [];

  /**
   * Run all authentication tests
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Authentication Test Suite...');
    
    this.results = [];

    // Test 1: Email validation
    await this.testEmailValidation();

    // Test 2: Password validation
    await this.testPasswordValidation();

    // Test 3: Email availability check
    await this.testEmailAvailabilityCheck();

    // Test 4: Database function availability
    await this.testDatabaseFunctions();

    // Test 5: RLS policies
    await this.testRLSPolicies();

    // Test 6: User profile creation trigger
    await this.testUserProfileTrigger();

    // Summary
    this.printTestSummary();

    return this.results;
  }

  /**
   * Test email validation functionality
   */
  private async testEmailValidation(): Promise<void> {
    const testCases = [
      { email: '', shouldPass: false, description: 'Empty email' },
      { email: 'invalid-email', shouldPass: false, description: 'Invalid format' },
      { email: 'test@', shouldPass: false, description: 'Incomplete domain' },
      { email: 'test@example.com', shouldPass: true, description: 'Valid email' },
      { email: 'Test@Example.COM', shouldPass: true, description: 'Mixed case email' },
    ];

    for (const testCase of testCases) {
      try {
        const result = AuthValidationService.validateEmail(testCase.email);
        const passed = result.isValid === testCase.shouldPass;
        
        this.results.push({
          testName: `Email Validation: ${testCase.description}`,
          passed,
          message: passed ? 'Passed' : `Expected ${testCase.shouldPass}, got ${result.isValid}`,
          details: { email: testCase.email, result }
        });
      } catch (error) {
        this.results.push({
          testName: `Email Validation: ${testCase.description}`,
          passed: false,
          message: `Error: ${error}`,
          details: { email: testCase.email, error }
        });
      }
    }
  }

  /**
   * Test password validation functionality
   */
  private async testPasswordValidation(): Promise<void> {
    const testCases = [
      { password: '', shouldPass: false, description: 'Empty password' },
      { password: '123', shouldPass: false, description: 'Too short' },
      { password: '123456', shouldPass: true, description: 'Minimum length' },
      { password: 'strongPassword123!', shouldPass: true, description: 'Strong password' },
    ];

    for (const testCase of testCases) {
      try {
        const result = AuthValidationService.validatePassword(testCase.password);
        const passed = result.isValid === testCase.shouldPass;
        
        this.results.push({
          testName: `Password Validation: ${testCase.description}`,
          passed,
          message: passed ? 'Passed' : `Expected ${testCase.shouldPass}, got ${result.isValid}`,
          details: { password: '***', result }
        });
      } catch (error) {
        this.results.push({
          testName: `Password Validation: ${testCase.description}`,
          passed: false,
          message: `Error: ${error}`,
          details: { error }
        });
      }
    }
  }

  /**
   * Test email availability check functionality
   */
  private async testEmailAvailabilityCheck(): Promise<void> {
    try {
      // Test with a likely non-existent email
      const testEmail = `test-${Date.now()}@example.com`;
      const result = await AuthValidationService.checkEmailAvailability(testEmail);
      
      this.results.push({
        testName: 'Email Availability Check: Non-existent email',
        passed: result.isAvailable === true,
        message: result.isAvailable ? 'Correctly identified as available' : `Error: ${result.error}`,
        details: { email: testEmail, result }
      });
    } catch (error) {
      this.results.push({
        testName: 'Email Availability Check: Non-existent email',
        passed: false,
        message: `Error: ${error}`,
        details: { error }
      });
    }
  }

  /**
   * Test database functions availability
   */
  private async testDatabaseFunctions(): Promise<void> {
    try {
      const testEmail = `test-function-${Date.now()}@example.com`;
      const { data, error } = await supabase
        .rpc('is_email_available', { email_to_check: testEmail });

      this.results.push({
        testName: 'Database Function: is_email_available',
        passed: !error && typeof data === 'boolean',
        message: error ? `Error: ${error.message}` : 'Function available and working',
        details: { data, error }
      });
    } catch (error) {
      this.results.push({
        testName: 'Database Function: is_email_available',
        passed: false,
        message: `Error: ${error}`,
        details: { error }
      });
    }
  }

  /**
   * Test RLS policies
   */
  private async testRLSPolicies(): Promise<void> {
    try {
      // Test reading from users table (should work with proper policies)
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      this.results.push({
        testName: 'RLS Policies: Users table access',
        passed: !error,
        message: error ? `Error: ${error.message}` : 'Users table accessible with RLS',
        details: { error }
      });
    } catch (error) {
      this.results.push({
        testName: 'RLS Policies: Users table access',
        passed: false,
        message: `Error: ${error}`,
        details: { error }
      });
    }
  }

  /**
   * Test user profile creation trigger
   */
  private async testUserProfileTrigger(): Promise<void> {
    try {
      // Check if the trigger function exists
      const { data, error } = await supabase
        .rpc('handle_new_user');

      // This should fail because we're not providing the right context,
      // but it should fail in a specific way that indicates the function exists
      const functionExists = error && !error.message.includes('function "handle_new_user" does not exist');

      this.results.push({
        testName: 'Database Trigger: handle_new_user function',
        passed: functionExists,
        message: functionExists ? 'Trigger function exists' : 'Trigger function missing',
        details: { error }
      });
    } catch (error) {
      this.results.push({
        testName: 'Database Trigger: handle_new_user function',
        passed: false,
        message: `Error: ${error}`,
        details: { error }
      });
    }
  }

  /**
   * Print test summary
   */
  private printTestSummary(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log('\n📊 Authentication Test Summary:');
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    if (total - passed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.testName}: ${r.message}`));
    }
    
    console.log('\n✅ Passed Tests:');
    this.results
      .filter(r => r.passed)
      .forEach(r => console.log(`  - ${r.testName}: ${r.message}`));
  }

  /**
   * Get test results
   */
  getResults(): TestResult[] {
    return this.results;
  }
}

/**
 * Run authentication tests
 */
export const runAuthenticationTests = async (): Promise<TestResult[]> => {
  const testSuite = new AuthenticationTestSuite();
  return await testSuite.runAllTests();
};

/**
 * Quick test for immediate validation
 */
export const quickAuthTest = async (): Promise<boolean> => {
  try {
    // Test basic validation
    const emailTest = AuthValidationService.validateEmail('test@example.com');
    const passwordTest = AuthValidationService.validatePassword('password123');
    
    // Test database connection
    const { error } = await supabase.from('users').select('id').limit(1);
    
    return emailTest.isValid && passwordTest.isValid && !error;
  } catch (error) {
    console.error('Quick auth test failed:', error);
    return false;
  }
};
