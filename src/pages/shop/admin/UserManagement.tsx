
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { UserHeader } from './users/components/UserHeader';
import { UsersTable } from './users/components/UsersTable';
import { AddUserDialog } from './users/components/AddUserDialog';

const UserManagement = () => {
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  
  return (
    <div className="space-y-6">
      <UserHeader onAddUser={() => setAddUserDialogOpen(true)} />
      
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
      
      <AddUserDialog 
        open={addUserDialogOpen} 
        onOpenChange={setAddUserDialogOpen} 
      />
    </div>
  );
};

export default UserManagement;
