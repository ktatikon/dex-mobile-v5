/**
 * APPLY MIGRATIONS SCRIPT
 * 
 * Script to apply database migrations programmatically
 * Specifically for applying the phone constraint and RLS policy fixes
 */

import { supabase } from '@/integrations/supabase/client';

interface MigrationResult {
  migrationName: string;
  success: boolean;
  error?: any;
  details?: any;
}

/**
 * Apply phone constraint migration
 * NOTE: Frontend cannot apply database migrations directly
 * This function now provides clear instructions for manual migration
 */
export async function applyPhoneConstraintMigration(): Promise<MigrationResult> {
  try {
    console.log('📋 Checking phone constraint migration status...');

    // Test if the constraint allows empty phone numbers
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
      // Check if it's a phone constraint violation
      if (error.code === '23514' && error.message.includes('users_phone_format_check')) {
        return {
          migrationName: 'Phone Constraint Migration',
          success: false,
          error,
          details: {
            message: 'Phone constraint migration required - does not allow empty phone numbers',
            instruction: 'Execute MANUAL_DATABASE_MIGRATION.sql in Supabase SQL Editor',
            errorCode: error.code
          }
        };
      }

      // Check if it's an RLS violation
      if (error.code === '42501') {
        return {
          migrationName: 'Phone Constraint Migration',
          success: false,
          error,
          details: {
            message: 'RLS policy blocking insertion - trigger function needs SECURITY DEFINER',
            instruction: 'Execute MANUAL_DATABASE_MIGRATION.sql in Supabase SQL Editor',
            errorCode: error.code
          }
        };
      }

      // Other database errors
      return {
        migrationName: 'Phone Constraint Migration',
        success: false,
        error,
        details: {
          message: `Database error: ${error.message}`,
          instruction: 'Check database connectivity and apply migrations manually',
          errorCode: error.code
        }
      };
    }

    return {
      migrationName: 'Phone Constraint Migration',
      success: true,
      details: {
        message: 'Phone constraint migration already applied - empty phone numbers accepted',
        instruction: 'No action required'
      }
    };

  } catch (error) {
    return {
      migrationName: 'Phone Constraint Migration',
      success: false,
      error,
      details: {
        message: 'Exception during phone constraint test',
        instruction: 'Check network connectivity and database access'
      }
    };
  }
}

/**
 * Apply RLS policy fixes migration
 * NOTE: Frontend cannot apply database migrations directly
 * This function now tests RLS policy functionality
 */
export async function applyRLSPolicyMigration(): Promise<MigrationResult> {
  try {
    console.log('🔒 Testing RLS policy functionality...');

    // Test if we can query users table (basic RLS test)
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      // Check for specific RLS-related errors
      if (error.code === '42501') {
        return {
          migrationName: 'RLS Policy Migration',
          success: false,
          error,
          details: {
            message: 'RLS policy migration required - insufficient privileges',
            instruction: 'Execute MANUAL_DATABASE_MIGRATION.sql in Supabase SQL Editor',
            errorCode: error.code
          }
        };
      }

      return {
        migrationName: 'RLS Policy Migration',
        success: false,
        error,
        details: {
          message: `Database error: ${error.message}`,
          instruction: 'Check database connectivity and apply migrations manually',
          errorCode: error.code
        }
      };
    }

    return {
      migrationName: 'RLS Policy Migration',
      success: true,
      details: {
        message: 'RLS policies appear to be working correctly',
        instruction: 'No action required'
      }
    };

  } catch (error) {
    return {
      migrationName: 'RLS Policy Migration',
      success: false,
      error,
      details: {
        message: 'Exception during RLS policy test',
        instruction: 'Check network connectivity and database access'
      }
    };
  }
}

/**
 * Apply trigger function fixes migration
 * NOTE: Frontend cannot apply database migrations directly
 * This function now tests trigger function functionality
 */
export async function applyTriggerFunctionMigration(): Promise<MigrationResult> {
  try {
    console.log('⚙️ Testing trigger function functionality...');

    // Test actual signup to see if trigger function works
    const testEmail = `test.trigger.${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!'; // Strong password meeting Supabase requirements

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
          migrationName: 'Trigger Function Migration',
          success: false,
          error,
          details: {
            message: 'Trigger function migration required - signup failing with database errors',
            instruction: 'Execute MANUAL_DATABASE_MIGRATION.sql in Supabase SQL Editor',
            errorCode: error.status?.toString()
          }
        };
      }

      return {
        migrationName: 'Trigger Function Migration',
        success: false,
        error,
        details: {
          message: `Signup error: ${error.message}`,
          instruction: 'Check authentication configuration and apply migrations manually',
          errorCode: error.status?.toString()
        }
      };
    }

    return {
      migrationName: 'Trigger Function Migration',
      success: true,
      details: {
        message: 'Trigger function appears to be working correctly - signup successful',
        instruction: 'No action required'
      }
    };

  } catch (error) {
    return {
      migrationName: 'Trigger Function Migration',
      success: false,
      error,
      details: {
        message: 'Exception during trigger function test',
        instruction: 'Check network connectivity and authentication configuration'
      }
    };
  }
}

/**
 * Apply all critical migrations in order
 */
export async function applyAllCriticalMigrations(): Promise<{
  results: MigrationResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    allSuccessful: boolean;
  };
}> {
  console.log('🚀 Applying all critical migrations...');

  const results: MigrationResult[] = [];

  // Apply migrations in order of priority
  results.push(await applyTriggerFunctionMigration());
  results.push(await applyRLSPolicyMigration());
  results.push(await applyPhoneConstraintMigration());

  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;

  const summary = {
    total: results.length,
    successful,
    failed,
    allSuccessful: failed === 0
  };

  console.log('\n📊 MIGRATION SUMMARY:');
  console.log(`Total: ${summary.total}`);
  console.log(`✅ Successful: ${summary.successful}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`Status: ${summary.allSuccessful ? '✅ ALL SUCCESSFUL' : '❌ SOME FAILED'}`);

  return { results, summary };
}

// Export for use in diagnostic tools
export type { MigrationResult };
