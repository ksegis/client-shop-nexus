
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, UserCheck } from 'lucide-react';
import { UserManagementProvider } from './users/UserManagementContext';
import { UsersTable } from './users/UsersTable';
import { UserHeader } from './users/UserHeader';
import { UserDialog } from './users/UserDialog';

const UserManagement = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  return (
    <UserManagementProvider>
      <div className="space-y-6">
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
