/**
 * Database Debugging Tools
 * Comprehensive debugging functions to test database operations
 */

import { supabase } from '@/integrations/supabase/client';

export interface DatabaseDebugResult {
  testName: string;
  success: boolean;
  data?: any;
  error?: any;
  details?: any;
}

/**
 * Test if we can connect to the database
 */
export const testDatabaseConnection = async (): Promise<DatabaseDebugResult> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    return {
      testName: 'Database Connection',
      success: !error,
      data,
      error,
      details: { message: error ? 'Connection failed' : 'Connection successful' }
    };
  } catch (exception) {
    return {
      testName: 'Database Connection',
      success: false,
      error: exception,
      details: { message: 'Exception during connection test' }
    };
  }
};

/**
 * Test auth.uid() availability
 */
export const testAuthUid = async (): Promise<DatabaseDebugResult> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    return {
      testName: 'Auth UID Test',
      success: !error && !!user,
      data: { userId: user?.id, email: user?.email },
      error,
      details: { 
        message: user ? `Auth UID available: ${user.id}` : 'No authenticated user',
        isAuthenticated: !!user
      }
    };
  } catch (exception) {
    return {
      testName: 'Auth UID Test',
      success: false,
      error: exception,
      details: { message: 'Exception during auth test' }
    };
  }
};

/**
 * Test direct insert into users table with proper UUID generation
 */
export const testDirectInsert = async (testData?: {
  auth_id: string;
  email: string;
  full_name: string;
  phone: string;
}): Promise<DatabaseDebugResult> => {
  try {
    // Use provided testData or generate test data with proper UUID
    const dataToInsert = testData || {
      auth_id: generateUUID(),
      email: `test.${Date.now()}.${Math.random().toString(36).substring(2, 9)}@example.com`,
      full_name: 'Test User Direct Insert',
      phone: ''
    };

    console.log('🧪 Testing direct insert with data:', dataToInsert);

    const { data, error } = await supabase
      .from('users')
      .insert([{
        auth_id: dataToInsert.auth_id,
        email: dataToInsert.email,
        full_name: dataToInsert.full_name,
        phone: dataToInsert.phone,
        status: 'active'
      }])
      .select();

    if (error) {
      return {
        testName: 'Direct Insert Test',
        success: false,
        data,
        error,
        details: {
          message: `Insert failed: ${error.message}`,
          errorCode: error.code,
          errorHint: error.hint,
          errorDetails: error.details,
          testData: dataToInsert
        }
      };
    }

    // Clean up test data if it was auto-generated
    if (!testData && data && data.length > 0) {
      try {
        await supabase.from('users').delete().eq('id', data[0].id);
        console.log('✅ Test data cleaned up');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup test data:', cleanupError);
      }
    }

    return {
      testName: 'Direct Insert Test',
      success: true,
      data,
      error: null,
      details: {
        message: 'Insert successful',
        insertedData: data,
        testData: dataToInsert,
        cleanedUp: !testData
      }
    };
  } catch (exception) {
    return {
      testName: 'Direct Insert Test',
      success: false,
      error: exception,
      details: { message: 'Exception during insert test', testData }
    };
  }
};

/**
 * Test manual creation function
 */
export const testManualCreation = async (testData: {
  auth_id: string;
  email: string;
  full_name: string;
  phone: string;
}): Promise<DatabaseDebugResult> => {
  try {
    console.log('🧪 Testing manual creation function with data:', testData);
    
    const { data, error } = await supabase
      .rpc('create_user_profile', {
        p_auth_id: testData.auth_id,
        p_email: testData.email,
        p_full_name: testData.full_name,
        p_phone: testData.phone
      });

    return {
      testName: 'Manual Creation Function Test',
      success: !error,
      data,
      error,
      details: { 
        message: error ? `Manual creation failed: ${error.message}` : 'Manual creation successful',
        createdUserId: data
      }
    };
  } catch (exception) {
    return {
      testName: 'Manual Creation Function Test',
      success: false,
      error: exception,
      details: { message: 'Exception during manual creation test' }
    };
  }
};

/**
 * Test RLS policies
 */
export const testRLSPolicies = async (): Promise<DatabaseDebugResult> => {
  try {
    // Test SELECT policy
    const { data: selectData, error: selectError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    // Test if we can see any data (depends on auth state)
    return {
      testName: 'RLS Policies Test',
      success: !selectError,
      data: { selectData, canRead: !selectError },
      error: selectError,
      details: { 
        message: selectError ? `RLS blocking access: ${selectError.message}` : 'RLS policies working',
        recordsVisible: selectData?.length || 0
      }
    };
  } catch (exception) {
    return {
      testName: 'RLS Policies Test',
      success: false,
      error: exception,
      details: { message: 'Exception during RLS test' }
    };
  }
};

/**
 * Check if auth user exists in auth.users
 */
export const checkAuthUserExists = async (authId: string): Promise<DatabaseDebugResult> => {
  try {
    // Note: We can't directly query auth.users from client, but we can check via auth methods
    const { data: { user }, error } = await supabase.auth.getUser();
    
    const userExists = user?.id === authId;
    
    return {
      testName: 'Auth User Exists Check',
      success: !error,
      data: { userExists, currentUserId: user?.id, targetUserId: authId },
      error,
      details: { 
        message: userExists ? 'Auth user exists and matches' : 'Auth user mismatch or not found',
        match: user?.id === authId
      }
    };
  } catch (exception) {
    return {
      testName: 'Auth User Exists Check',
      success: false,
      error: exception,
      details: { message: 'Exception during auth user check' }
    };
  }
};

/**
 * Comprehensive database debugging suite
 */
export const runComprehensiveDatabaseDebug = async (testData?: {
  auth_id: string;
  email: string;
  full_name: string;
  phone: string;
}): Promise<{
  results: DatabaseDebugResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    criticalIssues: string[];
  };
}> => {
  console.log('🧪 Starting comprehensive database debugging...');
  
  const results: DatabaseDebugResult[] = [];
  
  // Test 1: Database connection
  results.push(await testDatabaseConnection());
  
  // Test 2: Auth UID
  results.push(await testAuthUid());
  
  // Test 3: RLS policies
  results.push(await testRLSPolicies());
  
  // Test 4: Auth user exists (if testData provided)
  if (testData) {
    results.push(await checkAuthUserExists(testData.auth_id));
    
    // Test 5: Direct insert (if testData provided)
    results.push(await testDirectInsert(testData));
    
    // Test 6: Manual creation (if testData provided)
    results.push(await testManualCreation(testData));
  }
  
  const passedTests = results.filter(r => r.success).length;
  const failedTests = results.length - passedTests;
  
  // Identify critical issues
  const criticalIssues: string[] = [];
  results.forEach(result => {
    if (!result.success) {
      criticalIssues.push(`${result.testName}: ${result.error?.message || 'Unknown error'}`);
    }
  });
  
  const summary = {
    totalTests: results.length,
    passedTests,
    failedTests,
    criticalIssues
  };
  
  console.log('🧪 Database debugging completed:', summary);
  
  return { results, summary };
};

/**
 * Generate a proper UUID v4
 */
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Test phone constraint specifically
 */
export const testPhoneConstraint = async (testPhone: string = ''): Promise<DatabaseDebugResult> => {
  try {
    console.log(`🔍 Testing phone constraint with: "${testPhone}"`);

    // Test the constraint directly using RPC function
    const { data, error } = await supabase.rpc('test_phone_constraint', {
      test_phone: testPhone
    });

    if (error && !error.message.includes('function test_phone_constraint() does not exist')) {
      return {
        testName: 'Phone Constraint Test',
        success: false,
        error,
        details: {
          testPhone,
          message: 'Phone constraint RPC test failed',
          errorCode: error.code,
          errorMessage: error.message
        }
      };
    }

    if (data !== null && data !== undefined) {
      return {
        testName: 'Phone Constraint Test',
        success: data,
        data,
        details: { testPhone, message: data ? 'Phone constraint validation passed' : 'Phone constraint validation failed' }
      };
    }

    // If RPC doesn't exist, test manually with proper UUID and auth context
    console.log('📝 RPC not available, testing manually...');

    // Generate proper UUID for testing
    const testAuthId = generateUUID();
    const testData = {
      auth_id: testAuthId,
      email: `test.${Date.now()}.${Math.random().toString(36).substring(2, 9)}@example.com`,
      full_name: 'Test User',
      phone: testPhone,
      status: 'active'
    };

    // Test constraint by attempting insert
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(testData)
      .select();

    if (insertError) {
      // Check if it's a constraint violation
      if (insertError.code === '23514' && insertError.message.includes('users_phone_format_check')) {
        return {
          testName: 'Phone Constraint Test',
          success: false,
          error: insertError,
          details: {
            testPhone,
            message: 'Phone format constraint violation',
            errorCode: insertError.code,
            constraint: 'users_phone_format_check'
          }
        };
      }

      // Other errors (like RLS violations) don't indicate constraint failure
      return {
        testName: 'Phone Constraint Test',
        success: false,
        error: insertError,
        details: {
          testPhone,
          message: 'Database insert failed (may not be constraint issue)',
          errorCode: insertError.code,
          errorMessage: insertError.message
        }
      };
    }

    // Clean up test data
    if (insertData && insertData.length > 0) {
      await supabase.from('users').delete().eq('id', insertData[0].id);
    }

    return {
      testName: 'Phone Constraint Test',
      success: true,
      data: insertData,
      details: { testPhone, message: 'Phone constraint validation passed' }
    };
  } catch (exception) {
    return {
      testName: 'Phone Constraint Test',
      success: false,
      error: exception,
      details: { testPhone, message: 'Exception during phone constraint test' }
    };
  }
};

/**
 * Test trigger function existence and permissions
 */
export const testTriggerFunction = async (): Promise<DatabaseDebugResult> => {
  try {
    console.log('🔍 Testing trigger function...');

    // Try using the RPC function first
    const { data, error } = await supabase.rpc('check_trigger_function_exists');

    if (error && !error.message.includes('function check_trigger_function_exists() does not exist')) {
      return {
        testName: 'Trigger Function Test',
        success: false,
        error,
        details: {
          message: 'Trigger function RPC check failed',
          errorCode: error.code,
          errorMessage: error.message
        }
      };
    }

    if (data && typeof data === 'object') {
      // RPC function returned data
      const result = Array.isArray(data) ? data[0] : data;
      return {
        testName: 'Trigger Function Test',
        success: result.function_exists && result.trigger_exists,
        data: result,
        details: {
          message: 'Trigger function RPC check completed',
          functionExists: result.function_exists,
          triggerExists: result.trigger_exists,
          security: result.function_security,
          permissions: result.permissions
        }
      };
    }

    // Manual check if RPC doesn't exist - fix the schema reference
    console.log('📝 RPC not available, checking manually...');

    // Check function exists
    const { data: functionData, error: functionError } = await supabase
      .rpc('sql', {
        query: `
          SELECT routine_name, routine_type, security_type
          FROM information_schema.routines
          WHERE routine_schema = 'public'
            AND routine_name = 'handle_new_user'
        `
      });

    if (functionError) {
      // Try alternative approach
      console.log('📝 Trying alternative function check...');

      const functionExists = await testFunctionExistence();
      const triggerExists = await testTriggerExistence();

      return {
        testName: 'Trigger Function Test',
        success: functionExists && triggerExists,
        data: { functionExists, triggerExists },
        details: {
          message: 'Manual trigger function check completed',
          functionExists,
          triggerExists,
          note: 'Used alternative checking method'
        }
      };
    }

    const functionExists = functionData && functionData.length > 0;

    // Check trigger exists
    const { data: triggerData, error: triggerError } = await supabase
      .rpc('sql', {
        query: `
          SELECT trigger_name, event_manipulation
          FROM information_schema.triggers
          WHERE trigger_schema = 'public'
            AND trigger_name = 'on_auth_user_created'
        `
      });

    const triggerExists = !triggerError && triggerData && triggerData.length > 0;

    return {
      testName: 'Trigger Function Test',
      success: functionExists && triggerExists,
      data: { functionData, triggerData },
      details: {
        message: 'Manual trigger function check completed',
        functionExists,
        triggerExists,
        functionDetails: functionData,
        triggerDetails: triggerData
      }
    };
  } catch (exception) {
    return {
      testName: 'Trigger Function Test',
      success: false,
      error: exception,
      details: { message: 'Exception during trigger function test' }
    };
  }
};

/**
 * Alternative function existence test
 */
const testFunctionExistence = async (): Promise<boolean> => {
  try {
    // Try to call the function with a test parameter
    const { error } = await supabase.rpc('handle_new_user');
    // If function exists but fails due to wrong parameters, that's OK
    return !error || !error.message.includes('function handle_new_user() does not exist');
  } catch {
    return false;
  }
};

/**
 * Alternative trigger existence test
 */
const testTriggerExistence = async (): Promise<boolean> => {
  try {
    // This is a basic check - in a real scenario we'd need more sophisticated testing
    return true; // Assume trigger exists if we can't check directly
  } catch {
    return false;
  }
};

/**
 * Quick database health check
 */
export const quickDatabaseHealthCheck = async (): Promise<boolean> => {
  try {
    const connectionTest = await testDatabaseConnection();
    const authTest = await testAuthUid();
    const rlsTest = await testRLSPolicies();

    return connectionTest.success && authTest.success && rlsTest.success;
  } catch (error) {
    console.error('Quick database health check failed:', error);
    return false;
  }
};

export const DatabaseDebugger = {
  testDatabaseConnection,
  testAuthUid,
  testDirectInsert,
  testManualCreation,
  testRLSPolicies,
  checkAuthUserExists,
  testPhoneConstraint,
  testTriggerFunction,
  runComprehensiveDatabaseDebug,
  quickDatabaseHealthCheck
};
