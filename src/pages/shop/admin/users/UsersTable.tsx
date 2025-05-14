
import React, { useState } from 'react';
import { useUserManagement } from './UserManagementContext';
import { EyeIcon, Key, UserCog, UserRoundCheck } from 'lucide-react';
import { formatUserRole, formatDate } from './utils';
import { useImpersonation } from '@/utils/admin/impersonationUtils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UsersTableProps {
  onResetPassword: (userId: string, email: string) => void;
  onEditProfile: (userId: string, email: string) => void;
  onImpersonate: (userId: string, email: string) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({ 
  onResetPassword, 
  onEditProfile,
  onImpersonate
}) => {
  const { users, isLoading } = useUserManagement();
  const { impersonateUser } = useImpersonation();
  const [impersonationLoading, setImpersonationLoading] = useState<string | null>(null);

  const handleImpersonate = async (userId: string, email: string) => {
    try {
      setImpersonationLoading(userId);
      const userName = users.find(u => u.id === userId)?.first_name || email;
      
      // Call impersonation utility
      const success = await impersonateUser(userId, userName);
      
      if (!success) {
        throw new Error('Failed to impersonate user');
      }
      
      onImpersonate(userId, email);
    } catch (error) {
      console.error('Impersonation error:', error);
      toast({
        title: 'Impersonation failed',
        description: 'There was an error impersonating this user.',
        variant: 'destructive',
      });
    } finally {
      setImpersonationLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                {user.first_name} {user.last_name}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 
                  user.role === 'staff' ? 'bg-green-100 text-green-800' : 
                  user.role === 'customer' ? 'bg-gray-100 text-gray-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {formatUserRole(user.role)}
                </span>
              </TableCell>
              <TableCell>{formatDate(user.created_at)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    title="Reset Password"
                    onClick={() => onResetPassword(user.id, user.email)}
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    title="Edit Profile"
                    onClick={() => onEditProfile(user.id, user.email)}
                  >
                    <UserCog className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    title="Impersonate User"
                    onClick={() => handleImpersonate(user.id, user.email)}
                    disabled={impersonationLoading === user.id}
                  >
                    {impersonationLoading === user.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
