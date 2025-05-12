
import { useState } from 'react';
import { useUserManagement } from './UserManagementContext';
import { Button } from '@/components/ui/button';
import { Plus, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UserImpersonationDialog from '@/components/admin/UserImpersonationDialog';

interface UserHeaderProps {
  onAddUser: () => void;
}

export const UserHeader = ({ onAddUser }: UserHeaderProps) => {
  const { users } = useUserManagement();
  const { user } = useAuth();
  const [impersonationDialogOpen, setImpersonationDialogOpen] = useState(false);
  
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
      <div className="flex mt-4 sm:mt-0 space-x-2">
        {isAdmin && (
          <Button 
            variant="outline" 
            onClick={() => setImpersonationDialogOpen(true)}
            className="flex items-center bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800"
          >
            <UserRound className="h-4 w-4 mr-2" />
            Login As User
          </Button>
        )}
        
        <Button onClick={onAddUser}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>
      
      <UserImpersonationDialog 
        open={impersonationDialogOpen} 
        onClose={() => setImpersonationDialogOpen(false)} 
      />
    </div>
  );
};
