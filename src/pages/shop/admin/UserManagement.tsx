
import React, { useState } from 'react';
import { UserManagementProvider } from './users/UserManagementContext';
import { UsersTable } from './users/UsersTable';
import { UserHeader } from './users/UserHeader';
import { UserDialog } from './users/UserDialog';
import { ImpersonationBanner } from './users/components/ImpersonationBanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield } from 'lucide-react';

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
  
  const handleImpersonate = (userId: string, email: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(email);
  };
  
  return (
    <UserManagementProvider>
      <div className="space-y-6">
        <ImpersonationBanner />
        
        <UserHeader onAddUser={() => setDialogOpen(true)} />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> 
              User Management
            </CardTitle>
            <CardDescription>
              Manage user accounts and their permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsersTable 
              onResetPassword={handleResetPassword}
              onEditProfile={handleEditProfile}
              onImpersonate={handleImpersonate}
            />
          </CardContent>
        </Card>
        
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
