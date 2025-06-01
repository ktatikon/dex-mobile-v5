/**
 * ADMIN USER MANAGEMENT PAGE
 * 
 * Comprehensive admin interface for user creation and management
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import { ArrowLeft, Users, UserPlus, Upload, List } from 'lucide-react';
import ManualUserCreation from '@/components/admin/ManualUserCreation';
import BulkUserImport from '@/components/admin/BulkUserImport';
import UserListManagement from '@/components/admin/UserListManagement';

const AdminUserManagementPage: React.FC = () => {
  const { adminUser, hasPermission, logActivity } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('list');

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    logActivity(`user_management_tab_${value}`);
  };

  const handleBackToDashboard = () => {
    logActivity('navigation_back_to_dashboard');
    navigate('/admin');
  };

  // Check permissions
  if (!hasPermission('user_manager')) {
    return (
      <div className="container mx-auto px-4 pt-6 pb-24">
        <Card className="bg-dex-dark/80 border-dex-negative/30">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-dex-negative mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Access Denied</h3>
            <p className="text-gray-400 mb-4">
              You don't have permission to access user management features.
            </p>
            <Button onClick={handleBackToDashboard} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleBackToDashboard}
            variant="outline"
            size="sm"
            className="border-dex-primary/30"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="h-6 w-6" />
              User Management
            </h1>
            <p className="text-gray-400">
              Create and manage user accounts
              <Badge variant="secondary" className="ml-2 bg-dex-primary/20 text-dex-primary">
                {adminUser?.role.replace('_', ' ').toUpperCase()}
              </Badge>
            </p>
          </div>
        </div>
      </div>

      {/* User Management Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-dex-dark/50 border border-dex-primary/30">
          <TabsTrigger
            value="list"
            className="data-[state=active]:bg-dex-primary data-[state=active]:text-white"
          >
            <List className="h-4 w-4 mr-2" />
            Manage Users
          </TabsTrigger>
          <TabsTrigger
            value="manual"
            className="data-[state=active]:bg-dex-primary data-[state=active]:text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create User
          </TabsTrigger>
          <TabsTrigger
            value="bulk"
            className="data-[state=active]:bg-dex-primary data-[state=active]:text-white"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <UserListManagement />
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <ManualUserCreation />
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <BulkUserImport />
        </TabsContent>
      </Tabs>

      {/* Important Notes */}
      <Card className="bg-dex-dark/80 border-yellow-500/30 mt-6">
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center gap-2">
            ⚠️ Important Security Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>
                <strong>Secure Authentication:</strong> All users are created using Supabase's secure 
                authentication system with proper password hashing and storage.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>
                <strong>Automatic Profile Creation:</strong> User profiles are automatically created 
                in the database via the handle_new_user() trigger function.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>
                <strong>Phone Numbers:</strong> Phone numbers are optional and can be left empty. 
                The system validates phone format when provided.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>
                <strong>Password Requirements:</strong> Passwords must be at least 6 characters with 
                mixed case letters, numbers, and special characters.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>
                <strong>Bulk Import:</strong> CSV files should contain headers: email, password, 
                full_name (required) and phone, role (optional).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prerequisites Warning */}
      <Card className="bg-red-900/20 border-red-500/30 mt-4">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            🚨 Prerequisites Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-red-300">
            <p>
              <strong>CRITICAL:</strong> Before using these user management features, ensure that 
              the database trigger function has been properly configured with SECURITY DEFINER privileges.
            </p>
            <p>
              If user creation fails with "Database error saving new user" or RLS policy violations, 
              execute the ADMIN_PREREQUISITES_FIX.sql script in Supabase SQL Editor.
            </p>
            <div className="mt-3 p-3 bg-black/30 rounded border border-red-500/20">
              <p className="text-xs text-red-400 font-mono">
                File: ADMIN_PREREQUISITES_FIX.sql<br/>
                Location: Project root directory<br/>
                Action: Execute in Supabase SQL Editor
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserManagementPage;
