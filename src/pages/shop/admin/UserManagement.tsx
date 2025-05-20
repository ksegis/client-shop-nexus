
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { UserManagementProvider } from './users/UserManagementContext';
import { UsersTable } from './users/UsersTable';
import { UserHeader } from './users/UserHeader';
import { UserDialog } from './users/UserDialog';
import { ImpersonationBanner } from './users/components/ImpersonationBanner';

const UserManagement = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  return (
    <UserManagementProvider>
      <div className="space-y-6">
        <ImpersonationBanner />
        
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-500">Manage users and their permissions</p>
        </div>
        
        <div className="flex justify-end gap-2">
          <UserHeader onAddUser={() => setDialogOpen(true)} />
        </div>
        
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" /> 
              User Management
            </CardTitle>
            <CardDescription>
              Manage user accounts and their permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsersTable />
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
