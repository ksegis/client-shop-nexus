
import { useUserManagement } from './UserManagementContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/auth';

interface UserHeaderProps {
  onAddUser: () => void;
}

export const UserHeader = ({ onAddUser }: UserHeaderProps) => {
  const { users } = useUserManagement();
  const { user } = useAuth();
  
  // Check if user has role admin - if user is null or role is undefined, default to false
  const isAdmin = user?.app_metadata?.role === 'admin';
  const userCount = users.length;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          {userCount} user{userCount === 1 ? '' : 's'} in total
        </p>
      </div>
      <div className="flex mt-4 sm:mt-0">
        <Button onClick={onAddUser}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>
    </div>
  );
};
