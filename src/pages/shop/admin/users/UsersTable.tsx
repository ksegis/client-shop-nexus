
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUserTableActions } from './hooks/useUserTableActions';
import { useUserManagement } from './UserManagementContext';
import { UserTableRow } from './components/UserTableRow';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { ProfileDialog } from './ProfileDialog';
import { DeleteUserDialog } from './components/DeleteUserDialog';

export function UsersTable() {
  const { users, isLoading } = useUserManagement();
  const { 
    impersonationLoading, 
    activationLoading,
    deleteLoading,
    getInviterName,
    handleImpersonate,
    handleToggleActive,
    handleDeleteUser
  } = useUserTableActions();
  
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);

  const handleResetPassword = (userId: string, email: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(email);
    setResetDialogOpen(true);
  };

  const handleEditProfile = (userId: string, email: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(email);
    setProfileDialogOpen(true);
  };
  
  const handleConfirmDelete = (userId: string, email: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(email);
    setDeleteDialogOpen(true);
  };

  console.log('UsersTable rendering with:', {
    userCount: users?.length || 0,
    isLoading
  });

  if (isLoading) {
    return (
      <div className="w-full py-10 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!users || users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  impersonationLoading={impersonationLoading}
                  activationLoading={activationLoading}
                  deleteLoading={deleteLoading}
                  onResetPassword={handleResetPassword}
                  onEditProfile={handleEditProfile}
                  onImpersonate={handleImpersonate}
                  onToggleActive={handleToggleActive}
                  onDelete={handleConfirmDelete}
                  getInviterName={getInviterName}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        userId={selectedUserId}
        email={selectedUserEmail}
      />

      {/* Edit Profile Dialog */}
      <ProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        userId={selectedUserId}
        email={selectedUserEmail}
      />
      
      {/* Delete User Dialog */}
      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        userId={selectedUserId}
        userEmail={selectedUserEmail}
      />
    </div>
  );
}
