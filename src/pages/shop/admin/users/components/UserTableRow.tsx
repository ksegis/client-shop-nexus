
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { User, Check, X, RefreshCw, Edit, Key } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatUserRole, formatDate, isRoleInactive } from '../utils';
import { User as UserType } from '../types';

interface UserTableRowProps {
  user: UserType;
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
  getInviterName
}) => {
  const isInactive = isRoleInactive(user.role);
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed User';
  const invitedBy = getInviterName(user.invited_by);
  
  return (
    <TableRow className={isInactive ? 'opacity-75' : ''}>
      <TableCell>{fullName}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Badge variant="outline" className={isInactive ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}>
          {formatUserRole(user.role)}
        </Badge>
      </TableCell>
      <TableCell>{formatDate(user.created_at)}</TableCell>
      <TableCell>{invitedBy}</TableCell>
      <TableCell>
        <Badge variant={isInactive ? "destructive" : "secondary"} className={!isInactive ? 'bg-green-100 text-green-800' : ''}>
          {isInactive ? 'Inactive' : 'Active'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onEditProfile(user.id, user.email)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit profile</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onResetPassword(user.id, user.email)}
              >
                <Key className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset password</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onImpersonate(user.id, user.email)}
                disabled={!!impersonationLoading}
              >
                {impersonationLoading === user.id ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Impersonate user</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onToggleActive(user.id, user.role)}
                disabled={!!activationLoading}
              >
                {activationLoading === user.id ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : isInactive ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isInactive ? 'Activate user' : 'Deactivate user'}
            </TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
};
