import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import UserProfileView from './UserProfileView';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface User {
  id: string;
  auth_id: string | null;
  email: string;
  full_name: string;
  phone: string;
  profile_picture_url: string | null;
  user_role: string;
  date_of_birth: string;
  address: string;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  employment_status: string;
  monthly_income: string;
  credit_score: number | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  province: string | null;
  seen: number | null;
}

export default function UserManagementModal({ isOpen, onClose }: UserManagementModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProfileViewOpen, setIsProfileViewOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users_account')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users_account')
        .update({ user_role: newRole })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      setUsers(users.map(user => 
        user.id === userId ? { ...user, user_role: newRole } : user
      ));

      toast({
        title: 'Success',
        description: 'User role updated successfully.',
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (userId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users_account')
        .update({ is_verified: newStatus })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_verified: newStatus } : user
      ));

      toast({
        title: 'Success',
        description: 'User status updated successfully.',
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case '2': return 'Admin';
      case '1': return 'Customer';
      case '0': return 'Disabled';
      default: return 'Unknown';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || user.user_role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.is_verified === (statusFilter === 'active');
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleProfileClick = (user: User) => {
    setSelectedUser(user);
    setIsProfileViewOpen(true);
  };

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-[#1B1B2C] p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-white mb-4"
                  >
                    User Management
                  </Dialog.Title>
                  
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="flex gap-4">
                      <Input
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1B1B2C] border-white/10">
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="2">Admin</SelectItem>
                          <SelectItem value="1">Customer</SelectItem>
                          <SelectItem value="0">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1B1B2C] border-white/10">
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-white/5">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                              User
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                              Role
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                              Joined
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                              Last Sign In
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                              Employment
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                              Monthly Income
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                              <tr key={user.id} className="hover:bg-white/5">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <button
                                      onClick={() => handleProfileClick(user)}
                                      className="flex-shrink-0 h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center hover:bg-green-500/30 transition-colors"
                                    >
                                      <span className="text-green-400 font-medium">
                                        {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                                      </span>
                                    </button>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-white">
                                        {user.full_name || 'No name provided'}
                                      </div>
                                      <div className="text-sm text-white/50">{user.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Select 
                                    value={user.user_role} 
                                    onValueChange={(value) => handleRoleChange(user.id, value)}
                                  >
                                    <SelectTrigger className="w-[120px] bg-white/5 border-white/10 text-white">
                                      <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1B1B2C] border-white/10">
                                      <SelectItem value="2">Admin</SelectItem>
                                      <SelectItem value="1">Customer</SelectItem>
                                      <SelectItem value="0">Disabled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge className={user.is_verified ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                                    {user.is_verified ? "Active" : "Inactive"}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                                  {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Never'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                                  {user.employment_status}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                                  R{parseFloat(user.monthly_income).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className={user.is_verified ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" : "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"}
                                    onClick={() => handleStatusChange(user.id, !user.is_verified)}
                                  >
                                    {user.is_verified ? 'Deactivate' : 'Activate'}
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="px-6 py-4 text-center text-white/50">
                                No users found matching your criteria
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <Button
                      variant="outline"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                      onClick={onClose}
                    >
                      Close
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {selectedUser && (
        <UserProfileView
          isOpen={isProfileViewOpen}
          onClose={() => {
            setIsProfileViewOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
        />
      )}
    </>
  );
} 