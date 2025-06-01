/**
 * BULK USER IMPORT COMPONENT
 * 
 * Admin interface for importing multiple users via CSV/Excel files
 */

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AuthValidationService } from '@/services/authValidationService';

interface ImportUser {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: string;
}

interface ImportResult {
  success: boolean;
  email: string;
  userId?: string;
  error?: string;
  rowNumber: number;
}

interface ImportSummary {
  total: number;
  successful: number;
  failed: number;
  results: ImportResult[];
  startTime: Date;
  endTime?: Date;
}

const BulkUserImport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseCSVFile = (file: File): Promise<ImportUser[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('File must contain header row and at least one data row'));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const requiredHeaders = ['email', 'password', 'full_name'];
          const optionalHeaders = ['phone', 'role'];
          
          // Validate required headers
          for (const required of requiredHeaders) {
            if (!headers.includes(required)) {
              reject(new Error(`Missing required column: ${required}`));
              return;
            }
          }

          const users: ImportUser[] = [];
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            
            if (values.length < requiredHeaders.length) {
              continue; // Skip incomplete rows
            }

            const user: ImportUser = {
              email: values[headers.indexOf('email')] || '',
              password: values[headers.indexOf('password')] || '',
              full_name: values[headers.indexOf('full_name')] || '',
              phone: values[headers.indexOf('phone')] || '',
              role: values[headers.indexOf('role')] || 'user'
            };

            users.push(user);
          }

          resolve(users);
        } catch (error: any) {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const validateUser = (user: ImportUser, rowNumber: number): { isValid: boolean; error?: string } => {
    // Email validation
    const emailValidation = AuthValidationService.validateEmail(user.email);
    if (!emailValidation.isValid) {
      return { isValid: false, error: `Row ${rowNumber}: ${emailValidation.error}` };
    }

    // Password validation
    const passwordValidation = AuthValidationService.validatePassword(user.password);
    if (!passwordValidation.isValid) {
      return { isValid: false, error: `Row ${rowNumber}: ${passwordValidation.error}` };
    }

    // Full name validation
    const nameValidation = AuthValidationService.validateFullName(user.full_name);
    if (!nameValidation.isValid) {
      return { isValid: false, error: `Row ${rowNumber}: ${nameValidation.error}` };
    }

    // Phone validation (empty allowed)
    if (user.phone.trim() !== '') {
      const phoneValidation = AuthValidationService.validatePhone(user.phone);
      if (!phoneValidation.isValid) {
        return { isValid: false, error: `Row ${rowNumber}: ${phoneValidation.error}` };
      }
    }

    return { isValid: true };
  };

  const createSingleUser = async (user: ImportUser, rowNumber: number): Promise<ImportResult> => {
    try {
      // Validate user data
      const validation = validateUser(user, rowNumber);
      if (!validation.isValid) {
        return {
          success: false,
          email: user.email,
          error: validation.error,
          rowNumber
        };
      }

      // Create user via Supabase auth
      const { data, error } = await supabase.auth.signUp({
        email: user.email.trim().toLowerCase(),
        password: user.password,
        options: {
          data: {
            full_name: user.full_name.trim(),
            phone: user.phone.trim(),
            role: user.role || 'user'
          }
        }
      });

      if (error) {
        return {
          success: false,
          email: user.email,
          error: error.message,
          rowNumber
        };
      }

      if (!data.user) {
        return {
          success: false,
          email: user.email,
          error: 'Failed to create user account',
          rowNumber
        };
      }

      return {
        success: true,
        email: user.email,
        userId: data.user.id,
        rowNumber
      };

    } catch (exception: any) {
      return {
        success: false,
        email: user.email,
        error: `Exception: ${exception.message}`,
        rowNumber
      };
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setProgress(0);
    
    try {
      // Parse CSV file
      const users = await parseCSVFile(selectedFile);
      
      if (users.length === 0) {
        toast({
          title: "No Users Found",
          description: "The CSV file contains no valid user data",
          variant: "destructive",
        });
        return;
      }

      // Initialize import summary
      const summary: ImportSummary = {
        total: users.length,
        successful: 0,
        failed: 0,
        results: [],
        startTime: new Date()
      };

      // Process users in batches to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        const batchPromises = batch.map((user, index) => 
          createSingleUser(user, i + index + 2) // +2 for header row and 1-based indexing
        );

        const batchResults = await Promise.all(batchPromises);
        
        // Update summary
        batchResults.forEach(result => {
          summary.results.push(result);
          if (result.success) {
            summary.successful++;
          } else {
            summary.failed++;
          }
        });

        // Update progress
        const progressPercent = Math.round(((i + batch.length) / users.length) * 100);
        setProgress(progressPercent);

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < users.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      summary.endTime = new Date();
      setImportSummary(summary);

      toast({
        title: "Import Completed",
        description: `Successfully created ${summary.successful} users, ${summary.failed} failed`,
        variant: summary.failed === 0 ? "default" : "destructive",
      });

    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "✅ SUCCESS" : "❌ FAILED"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-dex-dark border-dex-primary/30">
        <CardHeader>
          <CardTitle className="text-dex-accent">📁 Bulk User Import</CardTitle>
          <p className="text-gray-400">
            Import multiple users from CSV file with batch processing
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="border-dex-primary/30"
              >
                📎 Select CSV File
              </Button>
              {selectedFile && (
                <p className="text-sm text-gray-400 mt-2">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
              <h4 className="font-medium mb-2">CSV Format Requirements:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Required columns: email, password, full_name</li>
                <li>• Optional columns: phone, role</li>
                <li>• First row must contain column headers</li>
                <li>• Phone can be empty (leave blank if not provided)</li>
                <li>• Role defaults to 'user' if not specified</li>
              </ul>
            </div>

            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Import Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={loading || !selectedFile}
              className="bg-dex-accent hover:bg-dex-accent/90"
            >
              {loading ? 'Importing Users...' : 'Start Import'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {importSummary && (
        <Card className="bg-dex-dark border-dex-primary/30">
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 p-3 bg-dex-dark/50 rounded">
                <div className="text-center">
                  <div className="text-2xl font-bold">{importSummary.total}</div>
                  <div className="text-sm text-gray-400">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{importSummary.successful}</div>
                  <div className="text-sm text-gray-400">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{importSummary.failed}</div>
                  <div className="text-sm text-gray-400">Failed</div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {importSummary.results.map((result, index) => (
                  <div key={index} className="p-3 bg-dex-dark/50 rounded border border-dex-primary/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Row {result.rowNumber}: {result.email}</span>
                      {getStatusBadge(result.success)}
                    </div>
                    {result.success ? (
                      <p className="text-sm text-green-400">User ID: {result.userId}</p>
                    ) : (
                      <p className="text-sm text-red-400">Error: {result.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkUserImport;
