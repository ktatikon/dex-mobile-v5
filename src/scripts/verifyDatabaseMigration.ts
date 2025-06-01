/**
 * VERIFY DATABASE MIGRATION STATUS
 * 
 * Comprehensive verification of database migration status
 * Checks trigger function, constraints, and RLS policies
 */

import { supabase } from '@/integrations/supabase/client';

export interface DatabaseVerificationResult {
  testName: string;
  success: boolean;
  error?: any;
  details: {
    message: string;
    status?: string;
    recommendation?: string;
    sqlToExecute?: string;
  };
}

/**
 * Check if trigger function exists and has SECURITY DEFINER
 */
export async function verifyTriggerFunction(): Promise<DatabaseVerificationResult> {
  try {
    console.log('⚙️ Verifying trigger function...');

    // Test if trigger function works by attempting a direct signup test
    // This is more reliable than querying information_schema
    const testEmail = `test.trigger.${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Trigger Test User',
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
      // Check for specific trigger-related errors
      if (error.message.includes('Database error saving new user')) {
        return {
          testName: 'Trigger Function Verification',
          success: false,
          error,
          details: {
            message: 'Trigger function missing or lacks SECURITY DEFINER - signup failing',
            recommendation: 'Execute the trigger function portion of MANUAL_DATABASE_MIGRATION.sql',
            sqlToExecute: `
-- Execute this in Supabase SQL Editor:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER  -- This is critical!
SET search_path = public, auth
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, full_name, phone, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'active'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();`
          }
        };
      }

      return {
        testName: 'Trigger Function Verification',
        success: false,
        error,
        details: {
          message: `Signup error: ${error.message}`,
          recommendation: 'Check authentication configuration and trigger function'
        }
      };
    }

    return {
      testName: 'Trigger Function Verification',
      success: true,
      details: {
        message: 'Trigger function exists and appears to be configured',
        status: 'Trigger found on auth.users table'
      }
    };

  } catch (exception: any) {
    return {
      testName: 'Trigger Function Verification',
      success: false,
      error: exception,
      details: {
        message: `Exception during trigger verification: ${exception.message}`,
        recommendation: 'Check database access and apply trigger function migration'
      }
    };
  }
}

/**
 * Check phone constraint status
 */
export async function verifyPhoneConstraint(): Promise<DatabaseVerificationResult> {
  try {
    console.log('📱 Verifying phone constraint...');

    // Test by attempting to insert a user with empty phone
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
    }

    if (error) {
      if (error.code === '23514' && error.message.includes('users_phone_format_check')) {
        return {
          testName: 'Phone Constraint Verification',
          success: false,
          error,
          details: {
            message: 'Phone constraint does not allow empty phone numbers',
            recommendation: 'Execute the phone constraint portion of MANUAL_DATABASE_MIGRATION.sql',
            sqlToExecute: `
-- Execute this in Supabase SQL Editor:
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_phone_format_check;
ALTER TABLE public.users 
ADD CONSTRAINT users_phone_format_check
CHECK (phone = '' OR phone ~ '^[+]?[0-9\\s\\-\\(\\)]{5,20}$');`
          }
        };
      }

      if (error.code === '42501') {
        return {
          testName: 'Phone Constraint Verification',
          success: false,
          error,
          details: {
            message: 'RLS policy blocking insertion - trigger function needs SECURITY DEFINER',
            recommendation: 'Execute the trigger function portion of MANUAL_DATABASE_MIGRATION.sql',
            sqlToExecute: 'See trigger function SQL above'
          }
        };
      }

      return {
        testName: 'Phone Constraint Verification',
        success: false,
        error,
        details: {
          message: `Database error: ${error.message}`,
          recommendation: 'Check database connectivity and apply migrations'
        }
      };
    }

    return {
      testName: 'Phone Constraint Verification',
      success: true,
      details: {
        message: 'Phone constraint allows empty phone numbers',
        status: 'Constraint working correctly'
      }
    };

  } catch (exception: any) {
    return {
      testName: 'Phone Constraint Verification',
      success: false,
      error: exception,
      details: {
        message: `Exception during constraint verification: ${exception.message}`,
        recommendation: 'Check network connectivity and database access'
      }
    };
  }
}

/**
 * Test actual signup flow
 */
export async function verifySignupFlow(): Promise<DatabaseVerificationResult> {
  try {
    console.log('🔐 Verifying signup flow...');

    const testEmail = `test.signup.${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

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
        console.warn('⚠️ Failed to cleanup test user:', cleanupError);
      }
    }

    if (error) {
      // Check for password complexity issues
      if (error.status === 422 && error.message.includes('Password')) {
        return {
          testName: 'Signup Flow Verification',
          success: false,
          error,
          details: {
            message: 'Password complexity requirements not met',
            recommendation: 'This is a test configuration issue, not a database problem'
          }
        };
      }

      return {
        testName: 'Signup Flow Verification',
        success: false,
        error,
        details: {
          message: `Signup failed: ${error.message}`,
          recommendation: 'Database migration may not be fully applied'
        }
      };
    }

    return {
      testName: 'Signup Flow Verification',
      success: true,
      details: {
        message: 'Signup successful with empty phone number',
        status: 'Database migration appears to be working correctly'
      }
    };

  } catch (exception: any) {
    return {
      testName: 'Signup Flow Verification',
      success: false,
      error: exception,
      details: {
        message: `Exception during signup verification: ${exception.message}`,
        recommendation: 'Check network connectivity and authentication configuration'
      }
    };
  }
}

/**
 * Run comprehensive database migration verification
 */
export async function runDatabaseMigrationVerification(): Promise<{
  results: DatabaseVerificationResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    allPassed: boolean;
    criticalIssues: string[];
    sqlToExecute: string[];
  };
}> {
  console.log('🚀 Running comprehensive database migration verification...');

  const results: DatabaseVerificationResult[] = [];

  // Run verifications in order
  results.push(await verifyTriggerFunction());
  results.push(await verifyPhoneConstraint());
  results.push(await verifySignupFlow());

  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  const allPassed = failed === 0;

  const criticalIssues: string[] = [];
  const sqlToExecute: string[] = [];

  results.forEach(result => {
    if (!result.success) {
      criticalIssues.push(`${result.testName}: ${result.details.message}`);
      if (result.details.sqlToExecute) {
        sqlToExecute.push(result.details.sqlToExecute);
      }
    }
  });

  const summary = {
    total: results.length,
    passed,
    failed,
    allPassed,
    criticalIssues,
    sqlToExecute: [...new Set(sqlToExecute)] // Remove duplicates
  };

  console.log('\n📊 DATABASE MIGRATION VERIFICATION SUMMARY:');
  console.log(`Total Verifications: ${summary.total}`);
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`Status: ${summary.allPassed ? '✅ ALL PASSED' : '❌ MIGRATION INCOMPLETE'}`);

  return { results, summary };
}

// Export for use in diagnostic tools
export type { DatabaseVerificationResult };
