import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserService } from '@/services/userService';
import { supabase } from '@/integrations/supabase/client';

const ProfileSettingsTest = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testAuthId, setTestAuthId] = useState('test-auth-id-' + Date.now());
  const { toast } = useToast();

  const addResult = (message: string, success: boolean = true) => {
    const prefix = success ? '✅' : '❌';
    const result = `${prefix} ${message}`;
    setTestResults(prev => [...prev, result]);
    console.log(result);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      addResult('Starting Profile Settings Tests...');

      // Test 1: UserService.validateProfileData
      addResult('Test 1: Validating profile data validation');
      
      const validData = {
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        website: 'https://johndoe.com'
      };
      
      const validation1 = UserService.validateProfileData(validData);
      if (validation1.isValid) {
        addResult('Valid data passed validation');
      } else {
        addResult(`Valid data failed validation: ${validation1.errors.join(', ')}`, false);
      }

      const invalidData = {
        full_name: 'J',
        email: 'invalid-email',
        phone: '123',
        website: 'invalid-url'
      };
      
      const validation2 = UserService.validateProfileData(invalidData);
      if (!validation2.isValid && validation2.errors.length > 0) {
        addResult('Invalid data correctly rejected');
      } else {
        addResult('Invalid data incorrectly passed validation', false);
      }

      // Test 2: Check database connection
      addResult('Test 2: Testing database connection');
      
      try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (!error) {
          addResult('Database connection successful');
        } else {
          addResult(`Database connection failed: ${error.message}`, false);
        }
      } catch (dbError: any) {
        addResult(`Database connection error: ${dbError.message}`, false);
      }

      // Test 3: Test UserService.isEmailInUse
      addResult('Test 3: Testing email uniqueness check');
      
      try {
        const { inUse, error } = await UserService.isEmailInUse('test@example.com');
        if (!error) {
          addResult(`Email uniqueness check successful (in use: ${inUse})`);
        } else {
          addResult(`Email uniqueness check failed: ${UserService.getErrorMessage(error)}`, false);
        }
      } catch (emailError: any) {
        addResult(`Email uniqueness check error: ${emailError.message}`, false);
      }

      // Test 4: Test UserService.getUserProfile with non-existent user
      addResult('Test 4: Testing getUserProfile with non-existent user');
      
      try {
        const { data, error } = await UserService.getUserProfile('non-existent-auth-id');
        if (!error && data === null) {
          addResult('Non-existent user correctly returned null');
        } else if (error) {
          addResult(`getUserProfile error: ${UserService.getErrorMessage(error)}`, false);
        } else {
          addResult('Non-existent user incorrectly returned data', false);
        }
      } catch (getUserError: any) {
        addResult(`getUserProfile error: ${getUserError.message}`, false);
      }

      // Test 5: Test error message formatting
      addResult('Test 5: Testing error message formatting');
      
      const testError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint "users_email_unique"'
      };
      
      const errorMessage = UserService.getErrorMessage(testError);
      if (errorMessage.includes('email') && errorMessage.includes('already in use')) {
        addResult('Error message formatting works correctly');
      } else {
        addResult(`Error message formatting failed: ${errorMessage}`, false);
      }

      // Test 6: Test constraint validation patterns
      addResult('Test 6: Testing constraint validation patterns');
      
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      const phoneRegex = /^[+]?[0-9\s\-\(\)]{5,20}$/;
      
      const testEmails = [
        { email: 'valid@example.com', shouldPass: true },
        { email: 'invalid.email', shouldPass: false },
        { email: 'test@domain', shouldPass: false },
        { email: 'user@domain.co', shouldPass: true }
      ];
      
      const testPhones = [
        { phone: '+1234567890', shouldPass: true },
        { phone: '123', shouldPass: false },
        { phone: '(555) 123-4567', shouldPass: true },
        { phone: 'abc123', shouldPass: false }
      ];
      
      let emailTestsPassed = 0;
      let phoneTestsPassed = 0;
      
      testEmails.forEach(test => {
        const result = emailRegex.test(test.email);
        if (result === test.shouldPass) {
          emailTestsPassed++;
        }
      });
      
      testPhones.forEach(test => {
        const result = phoneRegex.test(test.phone);
        if (result === test.shouldPass) {
          phoneTestsPassed++;
        }
      });
      
      if (emailTestsPassed === testEmails.length) {
        addResult('Email validation regex works correctly');
      } else {
        addResult(`Email validation regex failed ${testEmails.length - emailTestsPassed} tests`, false);
      }
      
      if (phoneTestsPassed === testPhones.length) {
        addResult('Phone validation regex works correctly');
      } else {
        addResult(`Phone validation regex failed ${testPhones.length - phoneTestsPassed} tests`, false);
      }

      addResult('All tests completed!');
      
      toast({
        title: "Tests Completed",
        description: "Profile Settings tests have finished running. Check results above.",
        variant: "default",
      });

    } catch (error: any) {
      addResult(`Test suite error: ${error.message}`, false);
      toast({
        title: "Test Error",
        description: "An error occurred while running tests.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="bg-black border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Profile Settings Test Suite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="testAuthId" className="text-white">Test Auth ID</Label>
              <Input
                id="testAuthId"
                value={testAuthId}
                onChange={(e) => setTestAuthId(e.target.value)}
                className="bg-dex-dark border-dex-secondary/30 text-white"
                placeholder="Enter test auth ID"
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={runTests}
                disabled={isRunning}
                variant="primary"
                className="flex-1"
              >
                {isRunning ? 'Running Tests...' : 'Run Tests'}
              </Button>
              <Button
                onClick={clearResults}
                variant="outline"
                className="flex-1"
              >
                Clear Results
              </Button>
            </div>
          </div>

          {testResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-white text-lg font-semibold mb-3">Test Results:</h3>
              <div className="bg-dex-dark border border-dex-secondary/30 rounded-lg p-4 max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`text-sm mb-2 ${
                      result.startsWith('✅') 
                        ? 'text-green-400' 
                        : result.startsWith('❌') 
                        ? 'text-red-400' 
                        : 'text-white'
                    }`}
                  >
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettingsTest;
