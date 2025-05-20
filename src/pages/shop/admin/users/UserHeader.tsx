
import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserHeaderProps {
  onAddUser: () => void;
}

export function UserHeader({ onAddUser }: UserHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
      <div>
        <h1 className="text-2xl font-semibold">User Management</h1>
        <p className="text-muted-foreground">Manage all user accounts and permissions.</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onAddUser} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
        <Button variant="outline" asChild className="flex items-center gap-2">
          <Link to="/shop/admin/delete-user">
            <Trash2 className="h-4 w-4" />
            Delete by Email
          </Link>
        </Button>
      </div>
    </div>
  );
}
