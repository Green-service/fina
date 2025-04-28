import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UserProfileViewProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
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
  };
}

export default function UserProfileView({ isOpen, onClose, user }: UserProfileViewProps) {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case '2': return 'Admin';
      case '1': return 'Customer';
      case '0': return 'Disabled';
      default: return 'Unknown';
    }
  };

  return (
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#1B1B2C] p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-white mb-4"
                >
                  User Profile
                </Dialog.Title>

                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-2xl text-green-400 font-medium">
                        {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-white">{user.full_name || 'No name provided'}</h4>
                      <p className="text-white/50">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={user.is_verified ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                          {user.is_verified ? "Active" : "Inactive"}
                        </Badge>
                        <Badge className="bg-blue-500/20 text-blue-400">
                          {getRoleLabel(user.user_role)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h5 className="text-white font-medium mb-3">Contact Information</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-white/50 text-sm">Phone</p>
                        <p className="text-white">{user.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-white/50 text-sm">Date of Birth</p>
                        <p className="text-white">{user.date_of_birth || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h5 className="text-white font-medium mb-3">Address</h5>
                    <div className="space-y-2">
                      <p className="text-white">{user.address || 'No address provided'}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-white/50 text-sm">City</p>
                          <p className="text-white">{user.city || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-white/50 text-sm">Province/State</p>
                          <p className="text-white">{user.province || user.state || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-white/50 text-sm">Postal Code</p>
                          <p className="text-white">{user.postal_code || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-white/50 text-sm">Country</p>
                          <p className="text-white">{user.country || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h5 className="text-white font-medium mb-3">Financial Information</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-white/50 text-sm">Employment Status</p>
                        <p className="text-white">{user.employment_status || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-white/50 text-sm">Monthly Income</p>
                        <p className="text-white">R{parseFloat(user.monthly_income || '0').toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-white/50 text-sm">Credit Score</p>
                        <p className="text-white">{user.credit_score || 'Not available'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h5 className="text-white font-medium mb-3">Account Information</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-white/50 text-sm">Member Since</p>
                        <p className="text-white">{new Date(user.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-white/50 text-sm">Last Updated</p>
                        <p className="text-white">{new Date(user.updated_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-white/50 text-sm">Last Seen</p>
                        <p className="text-white">{user.seen ? new Date(user.seen).toLocaleDateString() : 'Never'}</p>
                      </div>
                    </div>
                  </div>
                </div>

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
  );
} 