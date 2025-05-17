
import React, { useState } from 'react';
import { EyeIcon, Key, UserCog } from 'lucide-react';
import { formatUserRole, isRoleInactive } from '../utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TableCell, TableRow } from '@/components/ui/table';
import { User } from '../types';

interface UserTableRowProps {
  user: User;
  impersonationLoading: string | null;
  activationLoading: string | null;
  onResetPassword: (userId: string, email: string) => void;
  onEditProfile: (userId: string, email: string) => void;
  onImpersonate: (userId: string, email: string) => void;
  onToggleActive: (userId: string, currentRole: string) => void;
  getInviterName: (invitedById: string | null | undefined) => string;
}

export const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  impersonationLoading,
  activationLoading,
  onResetPassword,
  onEditProfile,
  onImpersonate,
  onToggleActive,
  getInviterName,
}) => {
  return (
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
            onCheckedChange={() => onToggleActive(user.id, user.role)}
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
                onClick={() => onImpersonate(user.id, user.email)}
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
  );
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
