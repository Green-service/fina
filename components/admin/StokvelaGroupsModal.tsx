import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Calendar, Users, Target, DollarSign, X, Eye, RotateCw, Edit, Trash2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface User {
  id: string;
  auth_id: string | null;
  full_name: string;
  email: string;
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
  monthly_income: number | null;
  credit_score: number | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  province: string | null;
  seen: boolean | null;
}

interface StokvelaMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  amount_contibuted: number;
  amount_received: number;
  receiving_date: string | null;
  names: string;
  position: string;
  account_number: string;
  account_name: string;
  account_type: string;
  verified: boolean;
  cellphone_number: string;
  email: string;
  signature: string | null;
  ducuments: string | null;
  payment_date: string | null;
  payment_proof_url: string | null;
  payment_status: string | null;
}

interface StokvelaGroup {
  id: string;
  name: string;
  description: string;
  target_amount: number;
  contribution_amount: number;
  frequency: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  members_limit: number;
}

interface UserAccount {
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
  monthly_income: number | null;
  credit_score: number | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  province: string | null;
  seen: boolean | null;
}

interface StokvelaGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: StokvelaGroup[];
  users?: User[];
  members?: StokvelaMember[];
  isAdminView?: boolean;
}

function MembersModal({ isOpen, onClose, members, groupId }: { 
  isOpen: boolean; 
  onClose: () => void; 
  members: StokvelaMember[];
  groupId: string;
}) {
  const [selectedMember, setSelectedMember] = useState<StokvelaMember | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<StokvelaMember | null>(null);
  const [editedMember, setEditedMember] = useState<StokvelaMember | null>(null);
  const supabase = createClient();
  const groupMembers = members
    .filter(member => member.group_id === groupId)
    .sort((a, b) => parseInt(a.position) - parseInt(b.position));

  const handleRotate = async () => {
    try {
      setIsRotating(true);
      
      // Create a copy of the members array
      const membersCopy = [...groupMembers];
      
      // Rotate positions: last becomes first, others move up
      const lastMember = membersCopy[membersCopy.length - 1];
      const rotatedMembers = [
        { ...lastMember, position: '1', amount_contibuted: 0, amount_received: 0 },
        ...membersCopy.slice(0, -1).map((member, index) => ({
          ...member,
          position: (index + 2).toString(),
          amount_contibuted: 0,
          amount_received: 0
        }))
      ];

      // Update all members in the database
      const { error } = await supabase
        .from('stokvela_members')
        .upsert(
          rotatedMembers.map(member => ({
            id: member.id,
            position: member.position,
            amount_contibuted: member.amount_contibuted,
            amount_received: member.amount_received
          }))
        );

      if (error) throw error;

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error rotating members:', error);
      toast({
        title: "Error",
        description: "Failed to rotate member positions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRotating(false);
    }
  };

  const handleEdit = (member: StokvelaMember) => {
    setEditedMember({ ...member });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editedMember) return;
    
    try {
      const { error } = await supabase
        .from('stokvela_members')
        .update({
          names: editedMember.names,
          email: editedMember.email,
          cellphone_number: editedMember.cellphone_number,
          account_number: editedMember.account_number,
          account_name: editedMember.account_name,
          account_type: editedMember.account_type,
          position: editedMember.position
        })
        .eq('id', editedMember.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member information updated successfully.",
      });

      setIsEditing(false);
      setEditedMember(null);
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: "Error",
        description: "Failed to update member information. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (member: StokvelaMember) => {
    setMemberToDelete(member);
    setIsDeleting(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    
    try {
      const { error } = await supabase
        .from('stokvela_members')
        .delete()
        .eq('id', memberToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member deleted successfully.",
      });

      setIsDeleting(false);
      setMemberToDelete(null);
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: "Error",
        description: "Failed to delete member. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl bg-gradient-to-br from-gray-900 to-gray-800 text-white border border-gray-700 max-h-[80vh] overflow-y-auto">
          <div className="absolute right-4 top-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-white"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogTitle className="text-center">
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Group Members
            </div>
          </DialogTitle>
          
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30"
              onClick={handleRotate}
              disabled={isRotating || groupMembers.length < 2}
            >
              {isRotating ? (
                <div className="h-4 w-4 border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin mr-2" />
              ) : (
                <RotateCw className="h-4 w-4 mr-2" />
              )}
              Rotate Positions
            </Button>
          </div>
          
          <div className="space-y-4">
            {groupMembers.map((member, index) => (
              <motion.div
                key={member.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`bg-gray-800/50 border ${member.position === '1' ? 'border-green-500/50' : 'border-gray-700'} ${member.position === '1' ? 'bg-green-900/20' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Name</p>
                        <p className="text-lg font-semibold text-white">{member.names}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Position</p>
                        <p className="text-lg font-semibold text-white">{member.position}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Amount Contributed</p>
                        <p className="text-lg font-semibold text-white">R{member.amount_contibuted.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Amount Received</p>
                        <p className="text-lg font-semibold text-white">R{member.amount_received.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Payment Status</p>
                        <p className="text-lg font-semibold text-white">{member.payment_status || 'Pending'}</p>
                      </div>
                      <div className="flex items-end justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          onClick={() => setSelectedMember(member)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                          onClick={() => handleEdit(member)}
                          title="Edit Member"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => handleDelete(member)}
                          title="Delete Member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Details Modal */}
      {selectedMember && (
        <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
          <DialogContent className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border border-gray-700">
            <DialogTitle className="text-2xl font-bold text-white mb-4">Member Details</DialogTitle>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-300 font-medium">Bank Details</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-white">
                      <span className="text-gray-400">Account Name:</span>{" "}
                      <span className="text-blue-300">{selectedMember.account_name}</span>
                    </p>
                    <p className="text-white">
                      <span className="text-gray-400">Account Number:</span>{" "}
                      <span className="text-blue-300">{selectedMember.account_number}</span>
                    </p>
                    <p className="text-white">
                      <span className="text-gray-400">Account Type:</span>{" "}
                      <span className="text-blue-300">{selectedMember.account_type}</span>
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-300 font-medium">Other Details</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-white">
                      <span className="text-gray-400">Joined Date:</span>{" "}
                      <span className="text-blue-300">{new Date(selectedMember.joined_at).toLocaleDateString()}</span>
                    </p>
                    <p className="text-white">
                      <span className="text-gray-400">Receiving Date:</span>{" "}
                      <span className="text-blue-300">{selectedMember.receiving_date ? new Date(selectedMember.receiving_date).toLocaleDateString() : 'Not set'}</span>
                    </p>
                </div>
              </div>
                </div>
                <div>
                <p className="text-sm text-gray-300 font-medium mt-4">Contact Information</p>
                <div className="mt-2 space-y-1">
                  <p className="text-white">
                    <span className="text-gray-400">Email:</span>{" "}
                    <span className="text-blue-300">{selectedMember.email}</span>
                  </p>
                  <p className="text-white">
                    <span className="text-gray-400">Phone:</span>{" "}
                    <span className="text-blue-300">{selectedMember.cellphone_number}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30"
                onClick={() => setSelectedMember(null)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Member Modal */}
      {isEditing && editedMember && (
        <Dialog open={isEditing} onOpenChange={() => setIsEditing(false)}>
          <DialogContent className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border border-gray-700">
            <DialogTitle className="text-2xl font-bold text-white mb-4">Edit Member</DialogTitle>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="names" className="text-gray-300">Name</Label>
                  <Input
                    id="names"
                    value={editedMember.names}
                    onChange={(e) => setEditedMember({ ...editedMember, names: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    value={editedMember.email}
                    onChange={(e) => setEditedMember({ ...editedMember, email: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300">Phone</Label>
                  <Input
                    id="phone"
                    value={editedMember.cellphone_number}
                    onChange={(e) => setEditedMember({ ...editedMember, cellphone_number: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-gray-300">Position</Label>
                  <Input
                    id="position"
                    type="number"
                    min="1"
                    max={groupMembers.length.toString()}
                    value={editedMember.position}
                    onChange={(e) => setEditedMember({ ...editedMember, position: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName" className="text-gray-300">Account Name</Label>
                  <Input
                    id="accountName"
                    value={editedMember.account_name}
                    onChange={(e) => setEditedMember({ ...editedMember, account_name: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber" className="text-gray-300">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={editedMember.account_number}
                    onChange={(e) => setEditedMember({ ...editedMember, account_number: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType" className="text-gray-300">Account Type</Label>
                  <Input
                    id="accountType"
                    value={editedMember.account_type}
                    onChange={(e) => setEditedMember({ ...editedMember, account_type: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleSaveEdit}
              >
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent className="bg-gray-900 text-white border border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-white">Delete Member</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete {memberToDelete?.names}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function StokvelaGroupsModal({ 
  isOpen, 
  onClose, 
  groups, 
  users = [], 
  members = [],
  isAdminView = false 
}: StokvelaGroupsModalProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<User | null>(null);
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [contributionFilter, setContributionFilter] = useState<string>("all");
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [newStokvela, setNewStokvela] = useState({
    name: '',
    description: '',
    target_amount: 5000,
    contribution_amount: 1000,
    frequency: 'Monthly',
    members_limit: 5
  });
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<UserAccount | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<StokvelaGroup | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGroupForDelete, setSelectedGroupForDelete] = useState<StokvelaGroup | null>(null);
  const [editedStokvela, setEditedStokvela] = useState({
    name: '',
    description: '',
    target_amount: 0,
    contribution_amount: 0,
    frequency: '',
    members_limit: 0
  });
  const supabase = createClient();

  // Fetch user accounts when the add members modal opens
  useEffect(() => {
    if (isAddMembersModalOpen) {
      fetchUserAccounts();
    }
  }, [isAddMembersModalOpen]);

  const fetchUserAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('users_account')
        .select('*');

      if (error) throw error;
      setUserAccounts(data || []);
    } catch (error) {
      console.error('Error fetching user accounts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user accounts. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddMemberClick = (user: UserAccount) => {
    setSelectedUserToAdd(user);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmAddMember = async () => {
    if (!selectedUserToAdd) return;
    await handleAddMember(selectedUserToAdd.id);
    setIsConfirmDialogOpen(false);
    setSelectedUserToAdd(null);
  };

  const handleAddMember = async (userId: string) => {
    if (!selectedGroupForMembers) {
      console.error('No group selected');
      return;
    }

    try {
      // Get the current members count for the group
      const currentMembers = members.filter(m => m.group_id === selectedGroupForMembers);
      const nextPosition = (currentMembers.length + 1).toString();

      // Get the user details from userAccounts
      const userToAdd = userAccounts.find(user => user.id === userId);
      if (!userToAdd) {
        console.error('User not found in userAccounts:', userId);
        throw new Error('User not found');
      }

      // Initialize Supabase client
      const supabase = createClient();

      // Check if user is already a member using auth_id
      const { data: existingMember, error: checkError } = await supabase
        .from('stokvela_members')
        .select('*')
        .eq('group_id', selectedGroupForMembers)
        .eq('user_id', userToAdd.auth_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing member:', checkError);
        throw checkError;
      }

      if (existingMember) {
        toast({
          title: "Error",
          description: "User is already a member of this stokvela.",
          variant: "destructive",
        });
        return;
      }

      // Create new member with auth_id as user_id
      const newMember = {
        group_id: selectedGroupForMembers,
        user_id: userToAdd.auth_id, // Use auth_id instead of id
        role: 'user',
        joined_at: new Date().toISOString(),
        amount_contibuted: 0,
        amount_received: 0,
        receiving_date: null,
        names: userToAdd.full_name,
        position: nextPosition,
        account_number: '0',
        account_name: userToAdd.full_name,
        account_type: 'SAVINGS',
        verified: 0,
        cellphone_number: userToAdd.phone || '0',
        email: userToAdd.email,
        signature: null,
        ducuments: null,
        payment_date: null,
        payment_proof_url: null,
        payment_status: 'pending'
      };

      // First, try to insert without select to see if it works
      const { error: insertError } = await supabase
        .from('stokvela_members')
        .insert([newMember]);

      if (insertError) {
        console.error('Error inserting member:', insertError);
        console.error('Failed member data:', newMember);
        throw insertError;
      }

      // If insert was successful, fetch the newly created member
      const { data: insertedMember, error: fetchError } = await supabase
        .from('stokvela_members')
        .select('*')
        .eq('group_id', selectedGroupForMembers)
        .eq('user_id', userToAdd.auth_id)
        .single();

      if (fetchError) {
        console.error('Error fetching inserted member:', fetchError);
        // Don't throw here as the insert was successful
      }

      toast({
        title: "Successfully Added Member",
        description: `${userToAdd.full_name} has been successfully added to the stokvela group.`,
        variant: "default",
        duration: 5000,
      });

      // Close the modal
      setIsAddMembersModalOpen(false);
      setSelectedGroupForMembers(null);
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error adding member:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'No message',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateStokvela = async () => {
    try {
      // Get the current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a stokvela",
          variant: "destructive",
        });
        return;
      }

      // Create the new stokvela
      const { data, error } = await supabase
        .from('stokvela_groups')
        .insert([
          {
            name: newStokvela.name,
            description: newStokvela.description,
            target_amount: newStokvela.target_amount,
            contribution_amount: newStokvela.contribution_amount,
            frequency: newStokvela.frequency,
            members_limit: newStokvela.members_limit,
            created_by: user.id
          }
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Stokvela Created Successfully! 🎉",
        description: `Your new stokvela "${newStokvela.name}" has been created with:\n• Target amount: R${newStokvela.target_amount.toLocaleString()}\n• Contribution: R${newStokvela.contribution_amount.toLocaleString()}\n• Members limit: ${newStokvela.members_limit}\n• Frequency: ${newStokvela.frequency}`,
        variant: "default",
        duration: 5000,
      });

      // Reset form and close modal
      setNewStokvela({
        name: '',
        description: '',
        target_amount: 5000,
        contribution_amount: 1000,
        frequency: 'Monthly',
        members_limit: 5
      });
      setIsCreateModalOpen(false);
      
      // Refresh the page to show the new stokvela
      window.location.reload();
    } catch (error) {
      console.error('Error creating stokvela:', error);
      toast({
        title: "Error",
        description: "Failed to create stokvela. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter groups based on search query and contribution filter
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesContribution = true;
    if (contributionFilter !== "all") {
      const amount = parseInt(contributionFilter);
      matchesContribution = group.contribution_amount <= amount;
    }
    
    return matchesSearch && matchesContribution;
  });

  // Add console logging to debug
  console.log('Users data:', users);
  console.log('Groups data:', groups);

  const handleCreatorClick = (creatorId: string) => {
    const creator = users.find(user => user.auth_id === creatorId);
    if (creator) {
      setSelectedCreator(creator);
      setIsCreatorModalOpen(true);
    }
  };

  const handleEditClick = (group: StokvelaGroup) => {
    setSelectedGroupForEdit(group);
    setEditedStokvela({
      name: group.name,
      description: group.description,
      target_amount: group.target_amount,
      contribution_amount: group.contribution_amount,
      frequency: group.frequency,
      members_limit: group.members_limit
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (group: StokvelaGroup) => {
    setSelectedGroupForDelete(group);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdateStokvela = async () => {
    if (!selectedGroupForEdit) return;

    try {
      const { error } = await supabase
        .from('stokvela_groups')
        .update({
          name: editedStokvela.name,
          description: editedStokvela.description,
          target_amount: editedStokvela.target_amount,
          contribution_amount: editedStokvela.contribution_amount,
          frequency: editedStokvela.frequency,
          members_limit: editedStokvela.members_limit
        })
        .eq('id', selectedGroupForEdit.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stokvela group updated successfully.",
        variant: "default",
        duration: 5000,
      });

      setIsEditModalOpen(false);
      setSelectedGroupForEdit(null);
      window.location.reload();
    } catch (error) {
      console.error('Error updating stokvela:', error);
      toast({
        title: "Error",
        description: "Failed to update stokvela group. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStokvela = async () => {
    if (!selectedGroupForDelete) return;

    try {
      // First delete all members of the group
      const { error: membersError } = await supabase
        .from('stokvela_members')
        .delete()
        .eq('group_id', selectedGroupForDelete.id);

      if (membersError) throw membersError;

      // Then delete the group itself
      const { error: groupError } = await supabase
        .from('stokvela_groups')
        .delete()
        .eq('id', selectedGroupForDelete.id);

      if (groupError) throw groupError;

      toast({
        title: "Success",
        description: "Stokvela group deleted successfully.",
        variant: "default",
        duration: 5000,
      });

      setIsDeleteDialogOpen(false);
      setSelectedGroupForDelete(null);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting stokvela:', error);
      toast({
        title: "Error",
        description: "Failed to delete stokvela group. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl bg-gradient-to-br from-gray-900 to-gray-800 text-white border border-gray-700 max-h-[80vh] overflow-y-auto">
          <div className="absolute right-4 top-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-white"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogTitle className="text-center">
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Stokvela Groups
            </div>
            <p className="text-gray-400 mt-2">
              {isAdminView ? 'Manage and view all stokvela groups' : 'View and join stokvela groups'}
            </p>
          </DialogTitle>
          
          {/* Search and Filter Section */}
          <div className="mt-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search stokvela groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <select
                  value={contributionFilter}
                  onChange={(e) => setContributionFilter(e.target.value)}
                  className="w-full bg-gray-800 border-gray-700 text-white rounded-md p-2"
                >
                  <option value="all">All Contributions</option>
                  <option value="100">Up to R100</option>
                  <option value="200">Up to R200</option>
                  <option value="500">Up to R500</option>
                  <option value="1000">Up to R1,000</option>
                  <option value="5000">Up to R5,000</option>
                </select>
              </div>
              {isAdminView && (
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create Stokvela
              </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredGroups.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="h-full"
                >
                  <Card className="bg-gray-800/50 border border-gray-700 hover:border-blue-500 transition-all duration-300 h-full">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                      <CardTitle className="text-xl font-bold text-blue-400">{group.name}</CardTitle>
                      <CardDescription className="text-gray-400">{group.description}</CardDescription>
                        </div>
                        {isAdminView && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                            onClick={() => handleEditClick(group)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => handleDeleteClick(group)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-400">Target Amount</p>
                            <p className="text-lg font-semibold text-white">R{group.target_amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Contribution</p>
                            <p className="text-lg font-semibold text-white">R{group.contribution_amount.toLocaleString()}</p>
                          </div>
                        </div>
                          <div>
                            <p className="text-sm text-gray-400">Frequency</p>
                          <p className="text-base text-white">{group.frequency}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Members Limit</p>
                          <p className="text-base text-white">{group.members_limit} members</p>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                          onClick={() => setSelectedGroupId(group.id)}
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Members</span>
                        </Button>
                        {isAdminView && (
                        <Button
                          variant="outline"
                          className="flex items-center space-x-2 text-green-400 hover:text-green-300"
                          onClick={() => {
                            setSelectedGroupForMembers(group.id);
                            setIsAddMembersModalOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Members</span>
                        </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Only render admin-specific modals if isAdminView is true */}
      {isAdminView && (
        <>
      <MembersModal
        isOpen={!!selectedGroupId}
        onClose={() => setSelectedGroupId(null)}
        members={members}
        groupId={selectedGroupId || ''}
      />

      {/* Create Stokvela Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-gray-900 to-gray-800 text-white border border-gray-700">
          <DialogTitle className="text-2xl font-bold text-white mb-4">Create New Stokvela</DialogTitle>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">Stokvela Name</Label>
              <Input
                id="name"
                value={newStokvela.name}
                onChange={(e) => setNewStokvela({ ...newStokvela, name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter stokvela name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300">Description</Label>
              <Input
                id="description"
                value={newStokvela.description}
                onChange={(e) => setNewStokvela({ ...newStokvela, description: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_amount" className="text-gray-300">Target Amount (R)</Label>
                <Input
                  id="target_amount"
                  type="number"
                  value={newStokvela.target_amount}
                  onChange={(e) => setNewStokvela({ ...newStokvela, target_amount: parseInt(e.target.value) })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contribution_amount" className="text-gray-300">Contribution (R)</Label>
                <Input
                  id="contribution_amount"
                  type="number"
                  value={newStokvela.contribution_amount}
                  onChange={(e) => setNewStokvela({ ...newStokvela, contribution_amount: parseInt(e.target.value) })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="frequency" className="text-gray-300">Frequency</Label>
              <select
                id="frequency"
                value={newStokvela.frequency}
                onChange={(e) => setNewStokvela({ ...newStokvela, frequency: e.target.value })}
                className="w-full bg-gray-800 border-gray-700 text-white rounded-md p-2"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="members_limit" className="text-gray-300">Members Limit</Label>
              <Input
                id="members_limit"
                type="number"
                min="1"
                value={newStokvela.members_limit}
                onChange={(e) => setNewStokvela({ ...newStokvela, members_limit: parseInt(e.target.value) })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter maximum number of members"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={handleCreateStokvela}
            >
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Stokvela Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-gray-900 to-gray-800 text-white border border-gray-700">
          <DialogTitle className="text-2xl font-bold text-white mb-4">Edit Stokvela Group</DialogTitle>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-gray-300">Stokvela Name</Label>
              <Input
                id="edit-name"
                value={editedStokvela.name}
                onChange={(e) => setEditedStokvela({ ...editedStokvela, name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter stokvela name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-gray-300">Description</Label>
              <Input
                id="edit-description"
                value={editedStokvela.description}
                onChange={(e) => setEditedStokvela({ ...editedStokvela, description: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-target_amount" className="text-gray-300">Target Amount (R)</Label>
                <Input
                  id="edit-target_amount"
                  type="number"
                  value={editedStokvela.target_amount}
                  onChange={(e) => setEditedStokvela({ ...editedStokvela, target_amount: parseInt(e.target.value) })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-contribution_amount" className="text-gray-300">Contribution (R)</Label>
                <Input
                  id="edit-contribution_amount"
                  type="number"
                  value={editedStokvela.contribution_amount}
                  onChange={(e) => setEditedStokvela({ ...editedStokvela, contribution_amount: parseInt(e.target.value) })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-frequency" className="text-gray-300">Frequency</Label>
              <select
                id="edit-frequency"
                value={editedStokvela.frequency}
                onChange={(e) => setEditedStokvela({ ...editedStokvela, frequency: e.target.value })}
                className="w-full bg-gray-800 border-gray-700 text-white rounded-md p-2"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-members_limit" className="text-gray-300">Members Limit</Label>
              <Input
                id="edit-members_limit"
                type="number"
                min="1"
                value={editedStokvela.members_limit}
                onChange={(e) => setEditedStokvela({ ...editedStokvela, members_limit: parseInt(e.target.value) })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter maximum number of members"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={handleUpdateStokvela}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 text-white border border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-white">Delete Stokvela Group</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete the stokvela group "{selectedGroupForDelete?.name}"? This action cannot be undone and will also remove all members from this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDeleteStokvela}
            >
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </>
      )}
    </>
  );
} 