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
 * Test direct insert into users table
 */
export const testDirectInsert = async (testData: {
  auth_id: string;
  email: string;
  full_name: string;
  phone: string;
}): Promise<DatabaseDebugResult> => {
  try {
    console.log('🧪 Testing direct insert with data:', testData);
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        auth_id: testData.auth_id,
        email: testData.email,
        full_name: testData.full_name,
        phone: testData.phone,
        status: 'active'
      }])
      .select();

    return {
      testName: 'Direct Insert Test',
      success: !error,
      data,
      error,
      details: { 
        message: error ? `Insert failed: ${error.message}` : 'Insert successful',
        insertedData: data
      }
    };
  } catch (exception) {
    return {
      testName: 'Direct Insert Test',
      success: false,
      error: exception,
      details: { message: 'Exception during insert test' }
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
  runComprehensiveDatabaseDebug,
  quickDatabaseHealthCheck
};
