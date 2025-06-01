/**
 * TEST SIGNUP FLOW - DIRECT TESTING
 * 
 * Tests the actual signup flow to verify if the database migration was successful
 */

import { supabase } from '@/integrations/supabase/client';

export interface SignupTestResult {
  testName: string;
  success: boolean;
  error?: any;
  details: {
    message: string;
    userId?: string;
    errorCode?: string;
    recommendation?: string;
  };
}

/**
 * Test the actual signup flow with empty phone
 */
export async function testSignupWithEmptyPhone(): Promise<SignupTestResult> {
  try {
    console.log('🔐 Testing signup flow with empty phone...');

    const testEmail = `test.signup.${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!'; // Strong password meeting Supabase requirements

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Signup Test User',
          phone: '' // Test with empty phone
        }
      }
    });

    // Clean up test user if created
    if (data.user) {
      try {
        await supabase.auth.admin.deleteUser(data.user.id);
        console.log('✅ Test user cleaned up successfully');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup test user:', cleanupError);
      }
    }

    if (error) {
      return {
        testName: 'Signup Flow Test',
        success: false,
        error,
        details: {
          message: `Signup failed: ${error.message}`,
          errorCode: error.status?.toString(),
          recommendation: 'Database migration may not be applied correctly'
        }
      };
    }

    return {
      testName: 'Signup Flow Test',
      success: true,
      details: {
        message: 'Signup successful with empty phone number',
        userId: data.user?.id,
        recommendation: 'Database migration appears to be working correctly'
      }
    };

  } catch (exception: any) {
    return {
      testName: 'Signup Flow Test',
      success: false,
      error: exception,
      details: {
        message: `Exception during signup test: ${exception.message}`,
        recommendation: 'Check network connectivity and authentication configuration'
      }
    };
  }
}

/**
 * Test database constraint directly
 */
export async function testPhoneConstraintDirect(): Promise<SignupTestResult> {
  try {
    console.log('📱 Testing phone constraint directly...');

    const testAuthId = crypto.randomUUID();
    const testEmail = `test.constraint.${Date.now()}@example.com`;

    const { data, error } = await supabase
      .from('users')
      .insert({
        auth_id: testAuthId,
        email: testEmail,
        full_name: 'Constraint Test User',
        phone: '', // Test empty phone
        status: 'active'
      })
      .select();

    // Clean up test data if successful
    if (data && data.length > 0) {
      await supabase.from('users').delete().eq('id', data[0].id);
      console.log('✅ Test data cleaned up successfully');
    }

    if (error) {
      // Check if it's a phone constraint violation
      if (error.code === '23514' && error.message.includes('users_phone_format_check')) {
        return {
          testName: 'Phone Constraint Direct Test',
          success: false,
          error,
          details: {
            message: 'Phone constraint migration not applied - empty phone rejected',
            errorCode: error.code,
            recommendation: 'Execute MANUAL_DATABASE_MIGRATION.sql in Supabase SQL Editor'
          }
        };
      }

      // Check if it's an RLS violation
      if (error.code === '42501') {
        return {
          testName: 'Phone Constraint Direct Test',
          success: false,
          error,
          details: {
            message: 'RLS policy blocking insertion - trigger function needs SECURITY DEFINER',
            errorCode: error.code,
            recommendation: 'Execute MANUAL_DATABASE_MIGRATION.sql in Supabase SQL Editor'
          }
        };
      }

      return {
        testName: 'Phone Constraint Direct Test',
        success: false,
        error,
        details: {
          message: `Database error: ${error.message}`,
          errorCode: error.code,
          recommendation: 'Check database connectivity and apply migrations'
        }
      };
    }

    return {
      testName: 'Phone Constraint Direct Test',
      success: true,
      details: {
        message: 'Empty phone number accepted - constraint working correctly',
        recommendation: 'Phone constraint migration appears to be applied'
      }
    };

  } catch (exception: any) {
    return {
      testName: 'Phone Constraint Direct Test',
      success: false,
      error: exception,
      details: {
        message: `Exception during constraint test: ${exception.message}`,
        recommendation: 'Check network connectivity and database access'
      }
    };
  }
}

/**
 * Test database connectivity
 */
export async function testDatabaseConnectivity(): Promise<SignupTestResult> {
  try {
    console.log('🔌 Testing database connectivity...');

    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      return {
        testName: 'Database Connectivity Test',
        success: false,
        error,
        details: {
          message: `Database connection failed: ${error.message}`,
          errorCode: error.code,
          recommendation: 'Check Supabase configuration and network connectivity'
        }
      };
    }

    return {
      testName: 'Database Connectivity Test',
      success: true,
      details: {
        message: 'Database connection successful',
        recommendation: 'Database connectivity is working correctly'
      }
    };

  } catch (exception: any) {
    return {
      testName: 'Database Connectivity Test',
      success: false,
      error: exception,
      details: {
        message: `Exception during connectivity test: ${exception.message}`,
        recommendation: 'Check network connectivity and Supabase client configuration'
      }
    };
  }
}

/**
 * Run comprehensive signup flow test
 */
export async function runComprehensiveSignupTest(): Promise<{
  results: SignupTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    allPassed: boolean;
    criticalIssues: string[];
    recommendations: string[];
  };
}> {
  console.log('🚀 Running comprehensive signup flow test...');

  const results: SignupTestResult[] = [];

  // Run tests in order
  results.push(await testDatabaseConnectivity());
  results.push(await testPhoneConstraintDirect());
  results.push(await testSignupWithEmptyPhone());

  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  const allPassed = failed === 0;

  const criticalIssues: string[] = [];
  const recommendations: string[] = [];

  results.forEach(result => {
    if (!result.success) {
      criticalIssues.push(`${result.testName}: ${result.details.message}`);
    }
    if (result.details.recommendation) {
      recommendations.push(result.details.recommendation);
    }
  });

  const summary = {
    total: results.length,
    passed,
    failed,
    allPassed,
    criticalIssues,
    recommendations: [...new Set(recommendations)] // Remove duplicates
  };

  console.log('\n📊 COMPREHENSIVE SIGNUP TEST SUMMARY:');
  console.log(`Total Tests: ${summary.total}`);
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`Status: ${summary.allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);

  if (summary.criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    summary.criticalIssues.forEach(issue => console.log(`- ${issue}`));
  }

  if (summary.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    summary.recommendations.forEach(rec => console.log(`- ${rec}`));
  }

  return { results, summary };
}

// Export for use in diagnostic tools
export { SignupTestResult };
