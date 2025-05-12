
import React, { useState } from 'react';
import { UserDialog } from '../users/UserDialog';
import { UsersTable } from '../users/UsersTable';
import { Button } from '@/components/ui/button';
import { UserManagementProvider } from '../users/UserManagementContext';
import { Plus } from 'lucide-react';

const StaffManager = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <UserManagementProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Staff Management</h2>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Staff Member
          </Button>
        </div>

        <div className="border rounded-md">
          <UsersTable />
        </div>

        <UserDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={() => setDialogOpen(false)}
          userData={null}
        />
      </div>
    </UserManagementProvider>
  );
};

export default StaffManager;
