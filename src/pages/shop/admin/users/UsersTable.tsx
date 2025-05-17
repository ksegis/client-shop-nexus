
import React, { useState } from 'react';
import { useUserManagement } from './UserManagementContext';
import { EyeIcon, Key, UserCog, Shield } from 'lucide-react';
import { formatUserRole, formatDate, isRoleInactive } from './utils';
import { useImpersonation } from '@/utils/admin/impersonationUtils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  const { users, isLoading, toggleUserActive } = useUserManagement();
  const { impersonateUser } = useImpersonation();
  const [impersonationLoading, setImpersonationLoading] = useState<string | null>(null);
  const [activationLoading, setActivationLoading] = useState<string | null>(null);

  // Find invited by names
  const getInviterName = (invitedById: string | null | undefined) => {
    if (!invitedById) return "—";
    const inviter = users.find(user => user.id === invitedById);
    return inviter ? `${inviter.first_name} ${inviter.last_name}` : "Unknown";
  };

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

  const handleToggleActive = async (userId: string, currentRole: string) => {
    try {
      setActivationLoading(userId);
      
      await toggleUserActive(userId, currentRole);
      
      const isCurrentlyActive = !isRoleInactive(currentRole);
      toast({
        title: isCurrentlyActive ? "User Deactivated" : "User Activated",
        description: isCurrentlyActive 
          ? "The user has been successfully deactivated." 
          : "The user has been successfully activated.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating user status",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setActivationLoading(null);
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
    <TooltipProvider>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Status</TableHead>
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
                    user.role.includes('admin') ? 'bg-blue-100 text-blue-800' : 
                    user.role.includes('staff') ? 'bg-green-100 text-green-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {formatUserRole(user.role)}
                  </span>
                </TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell>{getInviterName(user.invited_by)}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={!isRoleInactive(user.role)}
                      onCheckedChange={() => handleToggleActive(user.id, user.role)}
                      disabled={activationLoading === user.id}
                      aria-label={isRoleInactive(user.role) ? "Activate user" : "Deactivate user"}
                    />
                    <span className="text-sm">
                      {isRoleInactive(user.role) ? "Inactive" : "Active"}
                    </span>
                    {activationLoading === user.id && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent ml-2" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          title="Reset Password"
                          onClick={() => onResetPassword(user.id, user.email)}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reset Password</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          title="Edit Profile"
                          onClick={() => onEditProfile(user.id, user.email)}
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit Profile</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
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
                      </TooltipTrigger>
                      <TooltipContent>Impersonate User</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
};
