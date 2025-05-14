
import React, { useState } from 'react';
import { UserManagementProvider } from './users/UserManagementContext';
import { UsersTable } from './users/UsersTable';
import { UserHeader } from './users/UserHeader';
import { UserDialog } from './users/UserDialog'; // Now correctly pointing to the file we just created

const UserManagement = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  return (
    <UserManagementProvider>
      <div className="space-y-6">
        <UserHeader onAddUser={() => setDialogOpen(true)} />
        <UsersTable />
        
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
