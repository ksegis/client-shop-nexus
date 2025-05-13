
import React from 'react';
import { useUserManagement } from './UserManagementContext';
import { Button } from '@/components/ui/button';
import { UserPlus, RefreshCw } from 'lucide-react';

interface UserHeaderProps {
  onInviteUser: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ onInviteUser }) => {
  const { refetchUsers } = useUserManagement();
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4">
      <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
      
      <div className="flex items-center mt-4 sm:mt-0 gap-2">
        <Button onClick={() => refetchUsers()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button onClick={onInviteUser} size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>
    </div>
  );
};
