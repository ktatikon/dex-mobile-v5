/**
 * USER LIST MANAGEMENT COMPONENT
 * 
 * Comprehensive user management with search, filtering, and CRUD operations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  Filter,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import UserEditModal from './UserEditModal';

interface User {
  id: string;
  auth_id: string;
  email: string;
  full_name: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  role: string;
  created_at: string;
  updated_at: string;
}

interface UserFilters {
  search: string;
  status: string;
  role: string;
}

const UserListManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: 'all',
    role: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { toast } = useToast();

  const usersPerPage = 10;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      // TEMPORARY FIX: Direct query without RLS to prevent recursion
      console.log('🔧 Using direct query for user list (RLS temporarily disabled)');

      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.search) {
        query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`);
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.role !== 'all') {
        query = query.eq('role', filters.role);
      }

      // Apply pagination
      const from = (currentPage - 1) * usersPerPage;
      const to = from + usersPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error details:', error);
        throw new Error(`Database query failed: ${error.message}`);
      }

      setUsers(data || []);
      setTotalUsers(count || 0);

      console.log(`✅ Successfully loaded ${data?.length || 0} users`);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error Loading Users",
        description: `${error.message}. RLS may need to be disabled temporarily.`,
        variant: "destructive",
      });

      // Set empty state to prevent infinite loading
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `User status changed to ${newStatus}`,
      });

      fetchUsers(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: `User role changed to ${newRole}`,
      });

      fetchUsers(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      suspended: "destructive"
    } as const;

    const colors = {
      active: "✅",
      inactive: "⏸️",
      suspended: "🚫"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {colors[status as keyof typeof colors]} {status.toUpperCase()}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: "bg-red-500/20 text-red-400",
      super_admin: "bg-purple-500/20 text-purple-400",
      premium: "bg-yellow-500/20 text-yellow-400",
      user: "bg-blue-500/20 text-blue-400"
    };

    return (
      <Badge className={colors[role as keyof typeof colors] || "bg-gray-500/20 text-gray-400"}>
        {role.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  return (
    <div className="space-y-6">
      <Card className="bg-dex-dark border-dex-primary/30">
        <CardHeader>
          <CardTitle className="text-dex-accent flex items-center gap-2">
            <Search className="h-5 w-5" />
            User Management
          </CardTitle>
          <p className="text-gray-400">
            Search, filter, and manage user accounts
          </p>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Input
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="bg-dex-dark/70 border-dex-primary/30"
              />
            </div>
            <div>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="bg-dex-dark/70 border-dex-primary/30">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filters.role} onValueChange={(value) => handleFilterChange('role', value)}>
                <SelectTrigger className="bg-dex-dark/70 border-dex-primary/30">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button
                onClick={fetchUsers}
                disabled={loading}
                className="w-full bg-dex-accent hover:bg-dex-accent/90"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dex-primary/30">
                  <th className="text-left p-3 text-gray-400">User</th>
                  <th className="text-left p-3 text-gray-400">Contact</th>
                  <th className="text-left p-3 text-gray-400">Status</th>
                  <th className="text-left p-3 text-gray-400">Role</th>
                  <th className="text-left p-3 text-gray-400">Created</th>
                  <th className="text-left p-3 text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-gray-400">Loading users...</p>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8">
                      <p className="text-gray-400">No users found</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-dex-primary/10 hover:bg-dex-dark/30">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-white">{user.full_name}</p>
                          <p className="text-sm text-gray-400">ID: {user.id.slice(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-white">{user.email}</p>
                          <p className="text-sm text-gray-400">{user.phone || 'No phone'}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <Select
                          value={user.status}
                          onValueChange={(value) => handleStatusChange(user.id, value)}
                        >
                          <SelectTrigger className="w-32 bg-transparent border-none p-0">
                            {getStatusBadge(user.status)}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value)}
                        >
                          <SelectTrigger className="w-32 bg-transparent border-none p-0">
                            {getRoleBadge(user.role)}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-dex-primary/30"
                            onClick={() => {
                              setSelectedUser(user);
                              setEditModalOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-400"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-400">
                Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="border-dex-primary/30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 py-1 text-sm text-white">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="border-dex-primary/30"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Edit Modal */}
      <UserEditModal
        user={selectedUser}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
        onUserUpdated={fetchUsers}
      />
    </div>
  );
};

export default UserListManagement;
