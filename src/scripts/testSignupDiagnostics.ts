/**
 * QUICK TEST SCRIPT FOR SIGNUP DIAGNOSTICS
 * 
 * Tests the comprehensive signup diagnostic service to ensure it's working correctly
 */

import { signupDiagnosticService } from '@/debug/signupDiagnosticService';
import { verifyPhoneConstraintMigration } from './verifyPhoneConstraintMigration';

async function runQuickDiagnosticTest() {
  console.log('🚀 Starting quick signup diagnostic test...');

  const testData = {
    email: `test.${Date.now()}@example.com`,
    password: 'testpassword123',
    fullName: 'Test User',
    phone: '' // Test with empty phone (should be valid now)
  };

  try {
    // Test 1: Dynamic validation cache
    console.log('\n⚡ Testing dynamic validation cache...');
    const dynamicResult = await signupDiagnosticService.dynamic.optimizedValidation(testData);
    console.log('Dynamic result:', dynamicResult.success ? '✅ PASS' : '❌ FAIL');

    // Test 2: Phone constraint verification
    console.log('\n📱 Testing phone constraint migration...');
    const migrationResult = await verifyPhoneConstraintMigration();
    console.log('Migration applied:', migrationResult.migrationApplied ? '✅ YES' : '❌ NO');
    console.log('Success rate:', `${migrationResult.summary.successRate.toFixed(1)}%`);

    // Test 3: Brute force validation (first few layers only for quick test)
    console.log('\n🔨 Testing validation layers...');
    const bruteForceResults = await signupDiagnosticService.bruteForce.testAllValidationLayers(testData);
    const passedLayers = bruteForceResults.filter(r => r.success).length;
    console.log(`Validation layers passed: ${passedLayers}/${bruteForceResults.length}`);

    // Summary
    console.log('\n📊 QUICK TEST SUMMARY:');
    console.log(`✅ Dynamic validation: ${dynamicResult.success ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Phone constraint: ${migrationResult.migrationApplied ? 'APPLIED' : 'MISSING'}`);
    console.log(`✅ Validation layers: ${passedLayers}/${bruteForceResults.length} passed`);

    const allTestsPassed = dynamicResult.success && 
                          migrationResult.migrationApplied && 
                          passedLayers >= bruteForceResults.length * 0.8; // 80% threshold

    console.log(`\n🎯 OVERALL STATUS: ${allTestsPassed ? '✅ ALL SYSTEMS READY' : '❌ ISSUES DETECTED'}`);

    return allTestsPassed;

  } catch (error) {
    console.error('❌ Quick diagnostic test failed:', error);
    return false;
  }
}

// Export for use in other modules
export { runQuickDiagnosticTest };
