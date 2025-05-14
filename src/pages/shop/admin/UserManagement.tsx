
import React, { useState } from 'react';
import { UserManagementProvider } from './users/UserManagementContext';
import { UsersTable } from './users/UsersTable';
import { UserHeader } from './users/UserHeader';
import { UserDialog } from './users/UserDialog';

const UserManagement = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
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
  
  return (
    <UserManagementProvider>
      <div className="space-y-6">
        <UserHeader onAddUser={() => setDialogOpen(true)} />
        <UsersTable 
          onResetPassword={handleResetPassword}
          onEditProfile={handleEditProfile}
        />
        
        {/* Add User Dialog */}
        <UserDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          onSuccess={() => {
            setDialogOpen(false);
          }}
          userData={null}
        />
      </div>
    </UserManagementProvider>
  );
};

export default UserManagement;
