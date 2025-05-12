
import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface UserHeaderProps {
  onAddUser: () => void;
}

export const UserHeader = ({ onAddUser }: UserHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts, roles, and access permissions.
        </p>
      </div>
      <Button className="flex gap-2" onClick={onAddUser}>
        <UserPlus className="h-4 w-4" />
        <span>Add User</span>
      </Button>
    </div>
  );
};
