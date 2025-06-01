/**
 * ENHANCED SIGNUP ERROR INVESTIGATION TOOL
 * 
 * Comprehensive tool to investigate and diagnose signup registration failures
 * with detailed database error analysis and real-time testing capabilities
 */

import { supabase } from '@/integrations/supabase/client';
import { AuthValidationService } from '@/services/authValidationService';
import { DatabaseDebugger } from './databaseDebugger';
import { signupDiagnosticService } from './signupDiagnosticService';
import { verifyPhoneConstraintMigration } from '@/scripts/verifyPhoneConstraintMigration';

export interface SignupErrorAnalysis {
  timestamp: Date;
  errorType: 'validation' | 'database' | 'network' | 'auth' | 'unknown';
  errorMessage: string;
  errorCode?: string;
  errorDetails?: any;
  possibleCauses: string[];
  recommendedActions: string[];
  diagnosticResults?: any;
}

export interface ComprehensiveSignupTest {
  testId: string;
  testData: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  };
  results: {
    frontendValidation: boolean;
    databaseConstraints: boolean;
    triggerFunction: boolean;
    actualSignup: boolean;
    errorDetails?: any;
  };
  analysis: SignupErrorAnalysis;
}

/**
 * Enhanced error analyzer that categorizes and provides detailed analysis
 */
export class SignupErrorAnalyzer {
  
  analyzeError(error: any): SignupErrorAnalysis {
    const timestamp = new Date();
    let errorType: SignupErrorAnalysis['errorType'] = 'unknown';
    let possibleCauses: string[] = [];
    let recommendedActions: string[] = [];

    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorCode = error?.code || error?.error_code;

    // Analyze error type and causes
    if (errorMessage.includes('Database error saving new user')) {
      errorType = 'database';
      possibleCauses = [
        'Phone constraint violation',
        'Trigger function failure',
        'RLS policy blocking insertion',
        'Unique constraint violation',
        'Database connectivity issue',
        'Migration not applied'
      ];
      recommendedActions = [
        'Check phone constraint migration status',
        'Verify trigger function exists and has proper permissions',
        'Test database connectivity',
        'Check RLS policies for users table',
        'Verify unique constraints are not violated'
      ];
    } else if (errorMessage.includes('phone') || errorMessage.includes('Phone')) {
      errorType = 'validation';
      possibleCauses = [
        'Phone format validation failure',
        'Phone constraint not updated',
        'Frontend-backend validation mismatch'
      ];
      recommendedActions = [
        'Verify phone constraint allows empty phone',
        'Check frontend validation regex',
        'Test phone validation with various formats'
      ];
    } else if (errorMessage.includes('Email already in use')) {
      errorType = 'validation';
      possibleCauses = ['Duplicate email in database'];
      recommendedActions = ['Use different email for testing'];
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      errorType = 'network';
      possibleCauses = ['Network connectivity issue', 'Supabase service unavailable'];
      recommendedActions = ['Check internet connection', 'Verify Supabase service status'];
    } else if (errorMessage.includes('auth') || errorMessage.includes('Auth')) {
      errorType = 'auth';
      possibleCauses = ['Supabase auth configuration issue', 'Invalid credentials'];
      recommendedActions = ['Check Supabase auth settings', 'Verify API keys'];
    }

    return {
      timestamp,
      errorType,
      errorMessage,
      errorCode,
      errorDetails: error,
      possibleCauses,
      recommendedActions
    };
  }

  async investigateSignupError(testData: any): Promise<ComprehensiveSignupTest> {
    const testId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    console.log(`🔍 Starting comprehensive signup error investigation: ${testId}`);
    
    const results = {
      frontendValidation: false,
      databaseConstraints: false,
      triggerFunction: false,
      actualSignup: false,
      errorDetails: null
    };

    try {
      // Test 1: Frontend validation
      console.log('📝 Testing frontend validation...');
      const frontendValidation = AuthValidationService.validateSignupForm(testData);
      results.frontendValidation = frontendValidation.isValid;
      
      if (!frontendValidation.isValid) {
        throw new Error(`Frontend validation failed: ${frontendValidation.error}`);
      }

      // Test 2: Database constraints
      console.log('🗄️ Testing database constraints...');
      const constraintTest = await DatabaseDebugger.testPhoneConstraint(testData.phone);
      results.databaseConstraints = constraintTest.success;
      
      if (!constraintTest.success) {
        throw new Error(`Database constraint failed: ${constraintTest.error}`);
      }

      // Test 3: Trigger function
      console.log('⚙️ Testing trigger function...');
      const triggerTest = await DatabaseDebugger.testTriggerFunction();
      results.triggerFunction = triggerTest.success;
      
      if (!triggerTest.success) {
        console.warn('Trigger function test failed, but continuing...');
      }

      // Test 4: Actual signup attempt
      console.log('🔐 Attempting actual signup...');
      const { data, error } = await supabase.auth.signUp({
        email: testData.email,
        password: testData.password,
        options: {
          data: {
            full_name: testData.fullName,
            phone: testData.phone
          }
        }
      });

      if (error) {
        results.errorDetails = error;
        throw error;
      }

      results.actualSignup = true;
      console.log('✅ Signup test completed successfully');

      // Clean up test user if created
      if (data.user) {
        try {
          await supabase.auth.admin.deleteUser(data.user.id);
        } catch (cleanupError) {
          console.warn('Failed to cleanup test user:', cleanupError);
        }
      }

    } catch (error) {
      console.error('❌ Signup test failed:', error);
      results.errorDetails = error;
    }

    const analysis = this.analyzeError(results.errorDetails);

    return {
      testId,
      testData,
      results,
      analysis
    };
  }
}

/**
 * Comprehensive signup diagnostic runner
 */
export class ComprehensiveSignupDiagnostic {
  private analyzer = new SignupErrorAnalyzer();

  async runFullDiagnostic(): Promise<{
    migrationStatus: any;
    databaseHealth: any;
    signupTests: ComprehensiveSignupTest[];
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      criticalIssues: string[];
      recommendations: string[];
    };
  }> {
    console.log('🚀 Starting comprehensive signup diagnostic...');

    // Check migration status
    console.log('📋 Checking phone constraint migration...');
    const migrationStatus = await verifyPhoneConstraintMigration();

    // Check database health
    console.log('🏥 Checking database health...');
    const databaseHealth = {
      connection: await DatabaseDebugger.testDatabaseConnection(),
      rls: await DatabaseDebugger.testRLSPolicies(),
      trigger: await DatabaseDebugger.testTriggerFunction()
    };

    // Run signup tests with various phone formats
    const testCases = [
      {
        email: `test.empty.phone.${Date.now()}@example.com`,
        password: 'testpassword123',
        fullName: 'Test User Empty Phone',
        phone: ''
      },
      {
        email: `test.intl.phone.${Date.now()}@example.com`,
        password: 'testpassword123',
        fullName: 'Test User Intl Phone',
        phone: '+1234567890'
      },
      {
        email: `test.us.phone.${Date.now()}@example.com`,
        password: 'testpassword123',
        fullName: 'Test User US Phone',
        phone: '(555) 123-4567'
      },
      {
        email: `test.hyphen.phone.${Date.now()}@example.com`,
        password: 'testpassword123',
        fullName: 'Test User Hyphen Phone',
        phone: '555-123-4567'
      }
    ];

    const signupTests: ComprehensiveSignupTest[] = [];
    
    for (const testCase of testCases) {
      console.log(`🧪 Testing signup with phone: "${testCase.phone}"`);
      const testResult = await this.analyzer.investigateSignupError(testCase);
      signupTests.push(testResult);
      
      // Add delay between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Generate summary
    const totalTests = signupTests.length;
    const passedTests = signupTests.filter(test => test.results.actualSignup).length;
    const failedTests = totalTests - passedTests;

    const criticalIssues: string[] = [];
    const recommendations: string[] = [];

    // Analyze critical issues
    if (!migrationStatus.migrationApplied) {
      criticalIssues.push('Phone constraint migration not applied');
      recommendations.push('Apply migration: 20250128000002_update_phone_format_constraint.sql');
    }

    if (!databaseHealth.connection.success) {
      criticalIssues.push('Database connection failed');
      recommendations.push('Check database connectivity and credentials');
    }

    if (!databaseHealth.trigger.success) {
      criticalIssues.push('Trigger function not working');
      recommendations.push('Verify handle_new_user() trigger function exists and has proper permissions');
    }

    if (failedTests > 0) {
      criticalIssues.push(`${failedTests} signup tests failed`);
      recommendations.push('Review failed test error details for specific issues');
    }

    // Collect unique recommendations from failed tests
    signupTests.forEach(test => {
      if (!test.results.actualSignup) {
        test.analysis.recommendedActions.forEach(action => {
          if (!recommendations.includes(action)) {
            recommendations.push(action);
          }
        });
      }
    });

    const summary = {
      totalTests,
      passedTests,
      failedTests,
      criticalIssues,
      recommendations
    };

    console.log('\n📊 COMPREHENSIVE DIAGNOSTIC SUMMARY:');
    console.log(`Migration Applied: ${migrationStatus.migrationApplied ? '✅' : '❌'}`);
    console.log(`Database Health: ${databaseHealth.connection.success ? '✅' : '❌'}`);
    console.log(`Signup Tests: ${passedTests}/${totalTests} passed`);
    console.log(`Critical Issues: ${criticalIssues.length}`);

    return {
      migrationStatus,
      databaseHealth,
      signupTests,
      summary
    };
  }
}

// Export service instances
export const signupErrorInvestigator = {
  analyzer: new SignupErrorAnalyzer(),
  diagnostic: new ComprehensiveSignupDiagnostic()
};
