
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, UserCheck, UserPlus } from 'lucide-react';
import { UserManagementProvider } from './users/UserManagementContext';
import { UsersTable } from './users/UsersTable';
import { UserHeader } from './users/UserHeader';
import { InviteUserDialog } from './users/InviteUserDialog';
import { ResetPasswordDialog } from './users/ResetPasswordDialog';
import { ProfileDialog } from './users/ProfileDialog';

const UserManagement = () => {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
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
        <UserHeader 
          onInviteUser={() => setInviteDialogOpen(true)}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> 
              User Management
            </CardTitle>
            <CardDescription>
              Manage users, send invites, reset passwords, and update profiles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsersTable 
              onResetPassword={handleResetPassword}
              onEditProfile={handleEditProfile} 
            />
          </CardContent>
        </Card>
        
        {/* Invite User Dialog */}
        <InviteUserDialog 
          open={inviteDialogOpen} 
          onOpenChange={setInviteDialogOpen} 
        />
        
        {/* Reset Password Dialog */}
        <ResetPasswordDialog
          open={resetDialogOpen}
          onOpenChange={setResetDialogOpen}
          userId={selectedUserId}
          userEmail={selectedUserEmail}
        />
        
        {/* Profile Dialog */}
        <ProfileDialog
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
          userId={selectedUserId}
          userEmail={selectedUserEmail}
        />
      </div>
    </UserManagementProvider>
  );
};

export default UserManagement;
