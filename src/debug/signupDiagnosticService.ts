/**
 * COMPREHENSIVE SIGNUP DIAGNOSTIC SERVICE
 * 
 * Multi-approach problem solving for persistent signup registration failures
 * Implements brute-force, recursive, and dynamic programming approaches
 */

import { supabase } from '@/integrations/supabase/client';
import { AuthValidationService } from '@/services/authValidationService';
import { DatabaseDebugger } from './databaseDebugger';
import { ConstraintChecker } from './supabaseConstraintChecker';

export interface SignupDiagnosticResult {
  step: string;
  success: boolean;
  data?: any;
  error?: any;
  details?: any;
  timestamp: Date;
}

export interface SignupTestData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

/**
 * BRUTE-FORCE APPROACH: Test each validation layer systematically
 */
export class BruteForceSignupTester {
  private results: SignupDiagnosticResult[] = [];

  async testAllValidationLayers(testData: SignupTestData): Promise<SignupDiagnosticResult[]> {
    console.log('🔨 Starting brute-force validation layer testing...');
    this.results = [];

    // Test 1: Frontend form validation
    await this.testFrontendValidation(testData);

    // Test 2: AuthValidationService validation
    await this.testAuthValidationService(testData);

    // Test 3: AuthContext validation
    await this.testAuthContextValidation(testData);

    // Test 4: Database constraint validation
    await this.testDatabaseConstraints(testData);

    // Test 5: Trigger function validation
    await this.testTriggerFunction();

    // Test 6: Direct database insertion
    await this.testDirectDatabaseInsertion(testData);

    return this.results;
  }

  private async testFrontendValidation(testData: SignupTestData): Promise<void> {
    try {
      console.log('🔍 Testing frontend validation...');
      
      const validation = AuthValidationService.validateSignupForm(testData);
      
      this.results.push({
        step: 'Frontend Validation',
        success: validation.isValid,
        data: validation,
        error: validation.isValid ? null : validation.error,
        details: { layer: 'frontend', testData },
        timestamp: new Date()
      });
    } catch (error) {
      this.results.push({
        step: 'Frontend Validation',
        success: false,
        error,
        details: { layer: 'frontend', exception: true },
        timestamp: new Date()
      });
    }
  }

  private async testAuthValidationService(testData: SignupTestData): Promise<void> {
    try {
      console.log('🔍 Testing AuthValidationService...');
      
      const emailValidation = AuthValidationService.validateEmail(testData.email);
      const phoneValidation = AuthValidationService.validatePhone(testData.phone);
      const nameValidation = AuthValidationService.validateFullName(testData.fullName);
      const passwordValidation = AuthValidationService.validatePassword(testData.password);
      
      const allValid = emailValidation.isValid && phoneValidation.isValid && 
                      nameValidation.isValid && passwordValidation.isValid;
      
      this.results.push({
        step: 'AuthValidationService',
        success: allValid,
        data: { emailValidation, phoneValidation, nameValidation, passwordValidation },
        error: allValid ? null : 'One or more validations failed',
        details: { layer: 'authValidationService' },
        timestamp: new Date()
      });
    } catch (error) {
      this.results.push({
        step: 'AuthValidationService',
        success: false,
        error,
        details: { layer: 'authValidationService', exception: true },
        timestamp: new Date()
      });
    }
  }

  private async testAuthContextValidation(testData: SignupTestData): Promise<void> {
    try {
      console.log('🔍 Testing AuthContext validation logic...');
      
      // Simulate AuthContext validation logic
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      const phoneRegex = /^[+]?[0-9\s\-\(\)]{5,20}$/;
      
      const emailValid = emailRegex.test(testData.email.trim());
      const phoneValid = !testData.phone || testData.phone.trim() === '' || phoneRegex.test(testData.phone);
      const nameValid = testData.fullName && testData.fullName.trim().length > 0;
      
      const allValid = emailValid && phoneValid && nameValid;
      
      this.results.push({
        step: 'AuthContext Validation',
        success: allValid,
        data: { emailValid, phoneValid, nameValid },
        error: allValid ? null : 'AuthContext validation failed',
        details: { layer: 'authContext', patterns: { emailRegex: emailRegex.source, phoneRegex: phoneRegex.source } },
        timestamp: new Date()
      });
    } catch (error) {
      this.results.push({
        step: 'AuthContext Validation',
        success: false,
        error,
        details: { layer: 'authContext', exception: true },
        timestamp: new Date()
      });
    }
  }

  private async testDatabaseConstraints(testData: SignupTestData): Promise<void> {
    try {
      console.log('🔍 Testing database constraints...');
      
      const phoneTest = await DatabaseDebugger.testPhoneConstraint(testData.phone);
      const constraintValidation = await ConstraintChecker.validatePreSignupData({
        email: testData.email,
        full_name: testData.fullName,
        phone: testData.phone
      });
      
      this.results.push({
        step: 'Database Constraints',
        success: phoneTest.success && constraintValidation.allValid,
        data: { phoneTest, constraintValidation },
        error: phoneTest.success && constraintValidation.allValid ? null : 'Database constraint validation failed',
        details: { layer: 'database' },
        timestamp: new Date()
      });
    } catch (error) {
      this.results.push({
        step: 'Database Constraints',
        success: false,
        error,
        details: { layer: 'database', exception: true },
        timestamp: new Date()
      });
    }
  }

  private async testTriggerFunction(): Promise<void> {
    try {
      console.log('🔍 Testing trigger function...');
      
      const triggerTest = await DatabaseDebugger.testTriggerFunction();
      
      this.results.push({
        step: 'Trigger Function',
        success: triggerTest.success,
        data: triggerTest.data,
        error: triggerTest.success ? null : triggerTest.error,
        details: { layer: 'trigger', ...triggerTest.details },
        timestamp: new Date()
      });
    } catch (error) {
      this.results.push({
        step: 'Trigger Function',
        success: false,
        error,
        details: { layer: 'trigger', exception: true },
        timestamp: new Date()
      });
    }
  }

  private async testDirectDatabaseInsertion(testData: SignupTestData): Promise<void> {
    try {
      console.log('🔍 Testing direct database insertion...');
      
      const testUserData = {
        auth_id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        email: `test.${Date.now()}@example.com`,
        full_name: testData.fullName,
        phone: testData.phone,
        status: 'active' as const
      };
      
      const insertTest = await DatabaseDebugger.testDirectInsert(testUserData);
      
      // Clean up test data if successful
      if (insertTest.success && insertTest.data) {
        try {
          await supabase.from('users').delete().eq('auth_id', testUserData.auth_id);
        } catch (cleanupError) {
          console.warn('Failed to cleanup test data:', cleanupError);
        }
      }
      
      this.results.push({
        step: 'Direct Database Insertion',
        success: insertTest.success,
        data: insertTest.data,
        error: insertTest.success ? null : insertTest.error,
        details: { layer: 'directInsert', testUserData },
        timestamp: new Date()
      });
    } catch (error) {
      this.results.push({
        step: 'Direct Database Insertion',
        success: false,
        error,
        details: { layer: 'directInsert', exception: true },
        timestamp: new Date()
      });
    }
  }
}

/**
 * RECURSIVE APPROACH: Implement step-by-step error recovery with fallbacks
 */
export class RecursiveSignupRecovery {
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  async attemptSignupWithRecovery(
    testData: SignupTestData,
    retryCount = 0
  ): Promise<SignupDiagnosticResult> {
    console.log(`🔄 Attempting signup with recovery (attempt ${retryCount + 1}/${this.maxRetries + 1})`);

    try {
      // Step 1: Validate data
      const validation = AuthValidationService.validateSignupForm(testData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.error}`);
      }

      // Step 2: Check email availability
      const emailCheck = await AuthValidationService.checkEmailAvailability(testData.email);
      if (!emailCheck.isAvailable) {
        throw new Error(`Email not available: ${emailCheck.error}`);
      }

      // Step 3: Test database health
      const dbHealth = await DatabaseDebugger.quickDatabaseHealthCheck();
      if (!dbHealth) {
        throw new Error('Database health check failed');
      }

      // Step 4: Attempt signup
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
        throw new Error(`Supabase signup failed: ${error.message}`);
      }

      return {
        step: 'Recursive Signup Recovery',
        success: true,
        data,
        details: { attempt: retryCount + 1, recoveryUsed: retryCount > 0 },
        timestamp: new Date()
      };

    } catch (error) {
      console.error(`Signup attempt ${retryCount + 1} failed:`, error);

      if (retryCount < this.maxRetries) {
        console.log(`Retrying in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        
        // Exponential backoff
        this.retryDelay *= 2;
        
        return this.attemptSignupWithRecovery(testData, retryCount + 1);
      }

      return {
        step: 'Recursive Signup Recovery',
        success: false,
        error,
        details: { 
          finalAttempt: retryCount + 1, 
          maxRetriesReached: true,
          totalRetries: this.maxRetries 
        },
        timestamp: new Date()
      };
    }
  }
}

/**
 * DYNAMIC PROGRAMMING APPROACH: Optimized validation cache system
 */
export class DynamicValidationCache {
  private validationCache = new Map<string, { result: boolean; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  getCacheKey(data: any): string {
    return JSON.stringify(data);
  }

  isValidCacheEntry(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout;
  }

  async getCachedValidation(data: any): Promise<boolean | null> {
    const key = this.getCacheKey(data);
    const cached = this.validationCache.get(key);
    
    if (cached && this.isValidCacheEntry(cached.timestamp)) {
      console.log('📋 Using cached validation result');
      return cached.result;
    }
    
    return null;
  }

  setCachedValidation(data: any, result: boolean): void {
    const key = this.getCacheKey(data);
    this.validationCache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  async optimizedValidation(testData: SignupTestData): Promise<SignupDiagnosticResult> {
    console.log('⚡ Running optimized validation with caching...');

    try {
      // Check cache first
      const cachedResult = await this.getCachedValidation(testData);
      if (cachedResult !== null) {
        return {
          step: 'Dynamic Validation Cache',
          success: cachedResult,
          data: { cached: true },
          details: { cacheHit: true, cacheSize: this.validationCache.size },
          timestamp: new Date()
        };
      }

      // Perform validation
      const validation = AuthValidationService.validateSignupForm(testData);
      
      // Cache the result
      this.setCachedValidation(testData, validation.isValid);

      return {
        step: 'Dynamic Validation Cache',
        success: validation.isValid,
        data: validation,
        error: validation.isValid ? null : validation.error,
        details: { 
          cached: false, 
          cacheSize: this.validationCache.size,
          cacheTimeout: this.cacheTimeout 
        },
        timestamp: new Date()
      };

    } catch (error) {
      return {
        step: 'Dynamic Validation Cache',
        success: false,
        error,
        details: { exception: true },
        timestamp: new Date()
      };
    }
  }

  clearCache(): void {
    this.validationCache.clear();
    console.log('🧹 Validation cache cleared');
  }
}

// Export service instances
export const signupDiagnosticService = {
  bruteForce: new BruteForceSignupTester(),
  recursive: new RecursiveSignupRecovery(),
  dynamic: new DynamicValidationCache()
};
