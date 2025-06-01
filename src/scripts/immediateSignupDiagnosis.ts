/**
 * IMMEDIATE SIGNUP DIAGNOSIS SCRIPT
 * 
 * Quick diagnostic script to identify the root cause of signup failures
 * Can be run directly in browser console or as a standalone test
 */

import { supabase } from '@/integrations/supabase/client';
import { AuthValidationService } from '@/services/authValidationService';
import { verifyPhoneConstraintMigration } from './verifyPhoneConstraintMigration';

interface DiagnosisResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
  recommendation?: string;
}

/**
 * Run immediate signup diagnosis
 */
export async function runImmediateSignupDiagnosis(): Promise<{
  results: DiagnosisResult[];
  summary: {
    totalSteps: number;
    passed: number;
    failed: number;
    warnings: number;
    criticalIssues: string[];
    nextActions: string[];
  };
}> {
  console.log('🚨 STARTING IMMEDIATE SIGNUP DIAGNOSIS...');
  console.log('=====================================');

  const results: DiagnosisResult[] = [];

  // Step 1: Check database connectivity
  console.log('🔍 Step 1: Database Connectivity Test');
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      results.push({
        step: 'Database Connectivity',
        status: 'FAIL',
        message: 'Database connection failed',
        details: error,
        recommendation: 'Check Supabase configuration and network connectivity'
      });
    } else {
      results.push({
        step: 'Database Connectivity',
        status: 'PASS',
        message: 'Database connection successful'
      });
    }
  } catch (error) {
    results.push({
      step: 'Database Connectivity',
      status: 'FAIL',
      message: 'Database connection exception',
      details: error,
      recommendation: 'Verify Supabase client configuration'
    });
  }

  // Step 2: Check phone constraint migration
  console.log('🔍 Step 2: Phone Constraint Migration Check');
  try {
    const migrationResult = await verifyPhoneConstraintMigration();
    if (migrationResult.migrationApplied) {
      results.push({
        step: 'Phone Constraint Migration',
        status: 'PASS',
        message: `Migration applied successfully (${migrationResult.summary.successRate.toFixed(1)}% success rate)`
      });
    } else {
      results.push({
        step: 'Phone Constraint Migration',
        status: 'FAIL',
        message: 'Phone constraint migration not applied or failing',
        details: migrationResult,
        recommendation: 'Apply migration: 20250128000002_update_phone_format_constraint.sql'
      });
    }
  } catch (error) {
    results.push({
      step: 'Phone Constraint Migration',
      status: 'FAIL',
      message: 'Failed to check migration status',
      details: error,
      recommendation: 'Manually verify phone constraint in database'
    });
  }

  // Step 3: Test frontend validation
  console.log('🔍 Step 3: Frontend Validation Test');
  const testData = {
    email: `test.${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Test User',
    phone: '' // Test with empty phone
  };

  const frontendValidation = AuthValidationService.validateSignupForm(testData);
  if (frontendValidation.isValid) {
    results.push({
      step: 'Frontend Validation',
      status: 'PASS',
      message: 'Frontend validation passed for empty phone'
    });
  } else {
    results.push({
      step: 'Frontend Validation',
      status: 'FAIL',
      message: 'Frontend validation failed',
      details: frontendValidation.error,
      recommendation: 'Check AuthValidationService phone validation logic'
    });
  }

  // Step 4: Test phone validation specifically
  console.log('🔍 Step 4: Phone Validation Test');
  const phoneTests = [
    { phone: '', expected: true, description: 'Empty phone' },
    { phone: '+1234567890', expected: true, description: 'International format' },
    { phone: '(555) 123-4567', expected: true, description: 'US format' },
    { phone: 'invalid', expected: false, description: 'Invalid format' }
  ];

  let phoneValidationPassed = 0;
  for (const test of phoneTests) {
    const validation = AuthValidationService.validatePhone(test.phone);
    if (validation.isValid === test.expected) {
      phoneValidationPassed++;
    }
  }

  if (phoneValidationPassed === phoneTests.length) {
    results.push({
      step: 'Phone Validation',
      status: 'PASS',
      message: 'All phone validation tests passed'
    });
  } else {
    results.push({
      step: 'Phone Validation',
      status: 'FAIL',
      message: `Phone validation failed: ${phoneValidationPassed}/${phoneTests.length} tests passed`,
      recommendation: 'Check phone validation regex pattern'
    });
  }

  // Step 5: Test trigger function existence
  console.log('🔍 Step 5: Trigger Function Check');
  try {
    const { data, error } = await supabase.rpc('check_trigger_function_exists');
    if (error && error.message.includes('function check_trigger_function_exists() does not exist')) {
      // Function doesn't exist, try manual check
      results.push({
        step: 'Trigger Function',
        status: 'WARNING',
        message: 'Cannot verify trigger function (RPC not available)',
        recommendation: 'Manually check if handle_new_user() function exists'
      });
    } else if (error) {
      results.push({
        step: 'Trigger Function',
        status: 'FAIL',
        message: 'Trigger function check failed',
        details: error,
        recommendation: 'Verify handle_new_user() trigger function exists'
      });
    } else {
      results.push({
        step: 'Trigger Function',
        status: 'PASS',
        message: 'Trigger function check passed'
      });
    }
  } catch (error) {
    results.push({
      step: 'Trigger Function',
      status: 'WARNING',
      message: 'Could not check trigger function',
      details: error,
      recommendation: 'Manually verify trigger function in database'
    });
  }

  // Step 6: Test actual signup (with cleanup)
  console.log('🔍 Step 6: Actual Signup Test');
  try {
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
      results.push({
        step: 'Actual Signup Test',
        status: 'FAIL',
        message: 'Signup failed',
        details: {
          errorMessage: error.message,
          errorCode: error.status,
          errorDetails: error
        },
        recommendation: 'This is the root cause - check error details for specific issue'
      });
    } else {
      results.push({
        step: 'Actual Signup Test',
        status: 'PASS',
        message: 'Signup successful',
        details: { userId: data.user?.id }
      });

      // Clean up test user
      if (data.user) {
        try {
          await supabase.auth.admin.deleteUser(data.user.id);
          console.log('✅ Test user cleaned up');
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup test user:', cleanupError);
        }
      }
    }
  } catch (error) {
    results.push({
      step: 'Actual Signup Test',
      status: 'FAIL',
      message: 'Signup test exception',
      details: error,
      recommendation: 'Check network connectivity and Supabase configuration'
    });
  }

  // Generate summary
  const totalSteps = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARNING').length;

  const criticalIssues: string[] = [];
  const nextActions: string[] = [];

  results.forEach(result => {
    if (result.status === 'FAIL') {
      criticalIssues.push(`${result.step}: ${result.message}`);
      if (result.recommendation) {
        nextActions.push(result.recommendation);
      }
    }
  });

  // Remove duplicate actions
  const uniqueActions = [...new Set(nextActions)];

  console.log('\n📊 DIAGNOSIS SUMMARY:');
  console.log('====================');
  console.log(`Total Steps: ${totalSteps}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️ Warnings: ${warnings}`);
  
  if (criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    criticalIssues.forEach(issue => console.log(`  - ${issue}`));
  }

  if (uniqueActions.length > 0) {
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    uniqueActions.forEach(action => console.log(`  - ${action}`));
  }

  return {
    results,
    summary: {
      totalSteps,
      passed,
      failed,
      warnings,
      criticalIssues,
      nextActions: uniqueActions
    }
  };
}

/**
 * Browser console helper function
 */
export function runDiagnosisInConsole() {
  console.log('🚀 Running signup diagnosis in browser console...');
  runImmediateSignupDiagnosis()
    .then(result => {
      console.log('✅ Diagnosis completed!');
      console.log('Results:', result);
      
      // Store results in window for easy access
      (window as any).signupDiagnosisResults = result;
      console.log('💡 Results stored in window.signupDiagnosisResults');
    })
    .catch(error => {
      console.error('❌ Diagnosis failed:', error);
    });
}

// Make it available globally for console use
if (typeof window !== 'undefined') {
  (window as any).runSignupDiagnosis = runDiagnosisInConsole;
  console.log('💡 Run signup diagnosis with: runSignupDiagnosis()');
}
