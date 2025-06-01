/**
 * PHONE CONSTRAINT MIGRATION VERIFICATION SCRIPT
 * 
 * Verifies that the phone format constraint migration was applied correctly
 * and tests various phone number formats against the database constraint
 */

import { supabase } from '@/integrations/supabase/client';

interface ConstraintTestResult {
  phone: string;
  expected: boolean;
  actual: boolean;
  passed: boolean;
  error?: string;
}

interface MigrationVerificationResult {
  migrationApplied: boolean;
  constraintExists: boolean;
  constraintDefinition?: string;
  testResults: ConstraintTestResult[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    successRate: number;
  };
}

/**
 * Test phone numbers against the database constraint
 */
const testPhoneNumbers = [
  // Valid cases (should pass)
  { phone: '', expected: true, description: 'Empty phone' },
  { phone: '+1234567890', expected: true, description: 'International format' },
  { phone: '(555) 123-4567', expected: true, description: 'US format with parentheses' },
  { phone: '555-123-4567', expected: true, description: 'US format with hyphens' },
  { phone: '555 123 4567', expected: true, description: 'Format with spaces' },
  { phone: '12345', expected: true, description: 'Minimum length (5 chars)' },
  { phone: '12345678901234567890', expected: true, description: 'Maximum length (20 chars)' },
  { phone: '+44 20 7946 0958', expected: true, description: 'UK format with spaces' },
  { phone: '(123) 456-7890', expected: true, description: 'Standard US format' },
  
  // Invalid cases (should fail)
  { phone: '123', expected: false, description: 'Too short (3 chars)' },
  { phone: '1234', expected: false, description: 'Too short (4 chars)' },
  { phone: '123456789012345678901', expected: false, description: 'Too long (21 chars)' },
  { phone: 'abc-def-ghij', expected: false, description: 'Contains letters' },
  { phone: '555.123.4567', expected: false, description: 'Contains dots' },
  { phone: '555_123_4567', expected: false, description: 'Contains underscores' },
  { phone: '555@123#4567', expected: false, description: 'Contains special characters' },
  { phone: '++1234567890', expected: false, description: 'Multiple plus signs' },
];

/**
 * Check if the phone constraint exists in the database
 */
async function checkConstraintExists(): Promise<{ exists: boolean; definition?: string }> {
  try {
    const { data, error } = await supabase
      .from('information_schema.check_constraints')
      .select('constraint_name, check_clause')
      .eq('constraint_schema', 'public')
      .eq('constraint_name', 'users_phone_format_check');

    if (error) {
      console.error('Error checking constraint:', error);
      return { exists: false };
    }

    if (data && data.length > 0) {
      return {
        exists: true,
        definition: data[0].check_clause
      };
    }

    return { exists: false };
  } catch (error) {
    console.error('Exception checking constraint:', error);
    return { exists: false };
  }
}

/**
 * Test a phone number against the database constraint
 */
async function testPhoneConstraint(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Create a test user record to validate the constraint
    const testUserId = `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const testEmail = `test.${Date.now()}@example.com`;

    const { data, error } = await supabase
      .from('users')
      .insert({
        auth_id: testUserId,
        email: testEmail,
        full_name: 'Test User',
        phone: phone,
        status: 'active'
      })
      .select();

    if (error) {
      // Check if it's a constraint violation
      if (error.code === '23514' && error.message.includes('users_phone_format_check')) {
        return { success: false, error: 'Phone format constraint violation' };
      }
      return { success: false, error: error.message };
    }

    // Clean up the test record
    if (data && data.length > 0) {
      await supabase.from('users').delete().eq('id', data[0].id);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Run comprehensive phone constraint verification
 */
export async function verifyPhoneConstraintMigration(): Promise<MigrationVerificationResult> {
  console.log('🔍 Starting phone constraint migration verification...');

  // Check if constraint exists
  const constraintCheck = await checkConstraintExists();
  console.log('📋 Constraint exists:', constraintCheck.exists);
  if (constraintCheck.definition) {
    console.log('📋 Constraint definition:', constraintCheck.definition);
  }

  // Test all phone number formats
  const testResults: ConstraintTestResult[] = [];
  
  for (const test of testPhoneNumbers) {
    console.log(`🧪 Testing: "${test.phone}" (${test.description})`);
    
    const result = await testPhoneConstraint(test.phone);
    const passed = result.success === test.expected;
    
    testResults.push({
      phone: test.phone,
      expected: test.expected,
      actual: result.success,
      passed,
      error: result.error
    });

    console.log(`   ${passed ? '✅' : '❌'} ${passed ? 'PASS' : 'FAIL'} - Expected: ${test.expected}, Actual: ${result.success}`);
    if (result.error && !passed) {
      console.log(`   Error: ${result.error}`);
    }
  }

  // Calculate summary
  const totalTests = testResults.length;
  const passed = testResults.filter(r => r.passed).length;
  const failed = totalTests - passed;
  const successRate = (passed / totalTests) * 100;

  const summary = {
    totalTests,
    passed,
    failed,
    successRate
  };

  console.log('\n📊 VERIFICATION SUMMARY:');
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Success Rate: ${successRate.toFixed(1)}%`);

  const migrationResult: MigrationVerificationResult = {
    migrationApplied: constraintCheck.exists && successRate >= 90, // 90% success rate threshold
    constraintExists: constraintCheck.exists,
    constraintDefinition: constraintCheck.definition,
    testResults,
    summary
  };

  if (migrationResult.migrationApplied) {
    console.log('✅ Phone constraint migration verification PASSED');
  } else {
    console.log('❌ Phone constraint migration verification FAILED');
    if (!constraintCheck.exists) {
      console.log('   - Constraint does not exist in database');
    }
    if (successRate < 90) {
      console.log(`   - Success rate (${successRate.toFixed(1)}%) below threshold (90%)`);
    }
  }

  return migrationResult;
}

/**
 * Generate detailed verification report
 */
export function generateVerificationReport(result: MigrationVerificationResult): string {
  const timestamp = new Date().toISOString();
  
  let report = `
# PHONE CONSTRAINT MIGRATION VERIFICATION REPORT
Generated: ${timestamp}

## MIGRATION STATUS
- Migration Applied: ${result.migrationApplied ? '✅ YES' : '❌ NO'}
- Constraint Exists: ${result.constraintExists ? '✅ YES' : '❌ NO'}
- Constraint Definition: ${result.constraintDefinition || 'N/A'}

## TEST SUMMARY
- Total Tests: ${result.summary.totalTests}
- Passed: ${result.summary.passed}
- Failed: ${result.summary.failed}
- Success Rate: ${result.summary.successRate.toFixed(1)}%

## DETAILED TEST RESULTS
`;

  result.testResults.forEach((test, index) => {
    report += `
### Test ${index + 1}: "${test.phone}"
- Expected: ${test.expected ? 'VALID' : 'INVALID'}
- Actual: ${test.actual ? 'VALID' : 'INVALID'}
- Result: ${test.passed ? '✅ PASS' : '❌ FAIL'}`;
    
    if (test.error) {
      report += `
- Error: ${test.error}`;
    }
  });

  report += `

## RECOMMENDATIONS
`;

  if (!result.constraintExists) {
    report += `
- ❌ CRITICAL: Phone format constraint is missing from database
- 🔧 ACTION: Apply migration file 20250128000002_update_phone_format_constraint.sql
`;
  }

  if (result.summary.successRate < 90) {
    report += `
- ⚠️ WARNING: Success rate below 90% threshold
- 🔧 ACTION: Review failed test cases and constraint definition
`;
  }

  if (result.migrationApplied) {
    report += `
- ✅ SUCCESS: Phone constraint migration is working correctly
- 🎯 STATUS: Ready for production use
`;
  }

  return report;
}

// Export for use in other modules
export { testPhoneNumbers, checkConstraintExists, testPhoneConstraint };
