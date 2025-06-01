/**
 * SIMPLIFIED MIGRATION TEST - NO RPC DEPENDENCIES
 * 
 * Tests database state without relying on missing RPC functions
 * Provides clear instructions for manual migration application
 */

import { supabase } from '@/integrations/supabase/client';

export interface SimplifiedTestResult {
  testName: string;
  success: boolean;
  error?: any;
  details: {
    message: string;
    recommendation?: string;
    errorCode?: string;
  };
}

/**
 * Generate a proper UUID v4 for testing
 */
const generateTestUUID = (): string => {
  return crypto.randomUUID();
};

/**
 * Test if phone constraint allows empty phone numbers
 */
export async function testPhoneConstraintSimple(): Promise<SimplifiedTestResult> {
  try {
    console.log('📱 Testing phone constraint (empty phone)...');

    const testAuthId = generateTestUUID();
    const testEmail = `test.phone.${Date.now()}@example.com`;

    // Try to insert user with empty phone
    const { data, error } = await supabase
      .from('users')
      .insert({
        auth_id: testAuthId,
        email: testEmail,
        full_name: 'Phone Test User',
        phone: '', // Test empty phone
        status: 'active'
      })
      .select();

    // Clean up test data if successful
    if (data && data.length > 0) {
      await supabase.from('users').delete().eq('id', data[0].id);
    }

    if (error) {
      // Check if it's a phone constraint violation
      if (error.code === '23514' && error.message.includes('users_phone_format_check')) {
        return {
          testName: 'Phone Constraint Test',
          success: false,
          error,
          details: {
            message: 'Phone constraint does not allow empty phone numbers',
            recommendation: 'Apply MANUAL_DATABASE_MIGRATION.sql in Supabase SQL Editor',
            errorCode: error.code
          }
        };
      }

      // Check if it's an RLS violation
      if (error.code === '42501') {
        return {
          testName: 'Phone Constraint Test',
          success: false,
          error,
          details: {
            message: 'RLS policy blocking insertion - trigger function needs SECURITY DEFINER',
            recommendation: 'Apply MANUAL_DATABASE_MIGRATION.sql in Supabase SQL Editor',
            errorCode: error.code
          }
        };
      }

      // Other database errors
      return {
        testName: 'Phone Constraint Test',
        success: false,
        error,
        details: {
          message: `Database error: ${error.message}`,
          recommendation: 'Check database connectivity and apply migrations',
          errorCode: error.code
        }
      };
    }

    return {
      testName: 'Phone Constraint Test',
      success: true,
      details: {
        message: 'Empty phone number accepted - constraint appears to be working'
      }
    };

  } catch (exception) {
    return {
      testName: 'Phone Constraint Test',
      success: false,
      error: exception,
      details: {
        message: 'Exception during phone constraint test',
        recommendation: 'Check network connectivity and database access'
      }
    };
  }
}

/**
 * Test database connectivity
 */
export async function testDatabaseConnectivity(): Promise<SimplifiedTestResult> {
  try {
    console.log('🔌 Testing database connectivity...');

    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      return {
        testName: 'Database Connectivity',
        success: false,
        error,
        details: {
          message: `Database connection failed: ${error.message}`,
          recommendation: 'Check Supabase configuration and network connectivity',
          errorCode: error.code
        }
      };
    }

    return {
      testName: 'Database Connectivity',
      success: true,
      details: {
        message: 'Database connection successful'
      }
    };

  } catch (exception) {
    return {
      testName: 'Database Connectivity',
      success: false,
      error: exception,
      details: {
        message: 'Exception during connectivity test',
        recommendation: 'Check network connectivity and Supabase client configuration'
      }
    };
  }
}

/**
 * Test actual signup flow
 */
export async function testActualSignup(): Promise<SimplifiedTestResult> {
  try {
    console.log('🔐 Testing actual signup flow...');

    const testEmail = `test.signup.${Date.now()}@example.com`;
    const testPassword = 'testpassword123';

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
      } catch (cleanupError) {
        console.warn('Failed to cleanup test user:', cleanupError);
      }
    }

    if (error) {
      return {
        testName: 'Actual Signup Test',
        success: false,
        error,
        details: {
          message: `Signup failed: ${error.message}`,
          recommendation: 'This is the root cause - apply MANUAL_DATABASE_MIGRATION.sql',
          errorCode: error.status?.toString()
        }
      };
    }

    return {
      testName: 'Actual Signup Test',
      success: true,
      details: {
        message: 'Signup successful with empty phone number'
      }
    };

  } catch (exception) {
    return {
      testName: 'Actual Signup Test',
      success: false,
      error: exception,
      details: {
        message: 'Exception during signup test',
        recommendation: 'Check authentication configuration'
      }
    };
  }
}

/**
 * Run all simplified tests
 */
export async function runSimplifiedDiagnostic(): Promise<{
  results: SimplifiedTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    criticalIssues: string[];
    manualMigrationRequired: boolean;
  };
}> {
  console.log('🚀 Running simplified diagnostic (no RPC dependencies)...');

  const results: SimplifiedTestResult[] = [];

  // Run tests in order
  results.push(await testDatabaseConnectivity());
  results.push(await testPhoneConstraintSimple());
  results.push(await testActualSignup());

  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;

  const criticalIssues: string[] = [];
  let manualMigrationRequired = false;

  results.forEach(result => {
    if (!result.success) {
      criticalIssues.push(`${result.testName}: ${result.details.message}`);
      
      if (result.details.recommendation?.includes('MANUAL_DATABASE_MIGRATION.sql')) {
        manualMigrationRequired = true;
      }
    }
  });

  const summary = {
    total: results.length,
    passed,
    failed,
    criticalIssues,
    manualMigrationRequired
  };

  console.log('\n📊 SIMPLIFIED DIAGNOSTIC SUMMARY:');
  console.log(`Total Tests: ${summary.total}`);
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`Manual Migration Required: ${summary.manualMigrationRequired ? '✅ YES' : '❌ NO'}`);

  if (summary.manualMigrationRequired) {
    console.log('\n🚨 CRITICAL: Manual database migration required!');
    console.log('📋 Execute MANUAL_DATABASE_MIGRATION.sql in Supabase SQL Editor');
  }

  return { results, summary };
}

/**
 * Generate migration instructions
 */
export function generateMigrationInstructions(results: SimplifiedTestResult[]): string {
  const hasPhoneConstraintIssue = results.some(r => 
    !r.success && r.error?.code === '23514' && r.error?.message?.includes('users_phone_format_check')
  );
  
  const hasRLSIssue = results.some(r => 
    !r.success && r.error?.code === '42501'
  );
  
  const hasSignupFailure = results.some(r => 
    r.testName === 'Actual Signup Test' && !r.success
  );

  let instructions = `
# 🚨 MANUAL DATABASE MIGRATION REQUIRED

## Issues Identified:
`;

  if (hasPhoneConstraintIssue) {
    instructions += `- ❌ Phone constraint does not allow empty phone numbers\n`;
  }
  
  if (hasRLSIssue) {
    instructions += `- ❌ RLS policy violations blocking user creation\n`;
  }
  
  if (hasSignupFailure) {
    instructions += `- ❌ Signup flow failing with database errors\n`;
  }

  instructions += `
## IMMEDIATE ACTION REQUIRED:

1. **Open Supabase Dashboard**
   - Navigate to your V-DEX project
   - Go to SQL Editor

2. **Execute Migration Script**
   - Copy the entire content of MANUAL_DATABASE_MIGRATION.sql
   - Paste into SQL Editor
   - Click "Run" to execute

3. **Verify Success**
   - Look for "CRITICAL DATABASE MIGRATION COMPLETED SUCCESSFULLY" message
   - Re-run diagnostics to confirm all tests pass

## Expected Results After Migration:
- ✅ Phone constraint allows empty phone numbers
- ✅ Trigger function has SECURITY DEFINER privileges
- ✅ RLS policies allow proper user creation
- ✅ Signup flow works with empty phone numbers
`;

  return instructions;
}

// Export for use in diagnostic page
export { generateTestUUID };
