
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface UserHeaderProps {
  onAddUser: () => void;
}

export function UserHeader({ onAddUser }: UserHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-gray-500">Manage users and their permissions</p>
      </div>
      <Button onClick={onAddUser}>
        <Plus className="mr-2 h-4 w-4" />
        Add User
      </Button>
    </div>
  );
}
