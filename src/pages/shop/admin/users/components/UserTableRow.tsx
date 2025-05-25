
import React, { useEffect, useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, UserCog, KeyRound, UserX, RotateCw, Trash2 } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { isRoleInactive } from '../utils';
import { User } from '../types';

interface UserTableRowProps {
  user: User;
  impersonationLoading: string | null;
  activationLoading: string | null;
  deleteLoading?: string | null;
  onResetPassword: (userId: string, email: string) => void;
  onEditProfile: (userId: string, email: string) => void;
  onImpersonate: (userId: string, email: string) => void;
  onToggleActive: (userId: string, currentRole: string) => void;
  onDelete?: (userId: string, email: string) => void;
  getInviterName: (inviterId: string | null | undefined) => Promise<string>;
}

export function UserTableRow({
  user,
  impersonationLoading,
  activationLoading,
  deleteLoading,
  onResetPassword,
  onEditProfile,
  onImpersonate,
  onToggleActive,
  onDelete,
  getInviterName
}: UserTableRowProps) {
  const [inviterName, setInviterName] = useState<string>('');
  
  useEffect(() => {
    const fetchInviterName = async () => {
      const name = await getInviterName(user.invited_by);
      setInviterName(name);
    };
    
    fetchInviterName();
  }, [user.invited_by, getInviterName]);
  
  const getRoleBadge = (role: string) => {
    let baseRole = role.replace('inactive_', '');
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
        baseRole === 'admin' ? 'bg-purple-100 text-purple-800' : 
        baseRole === 'staff' ? 'bg-blue-100 text-blue-800' : 
        'bg-green-100 text-green-800'
      }`}>
        {baseRole}
      </span>
    );
  };
  
  const getStatusBadge = (role: string) => {
    const isInactive = isRoleInactive(role);
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
        isInactive ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
      }`}>
        {isInactive ? 'inactive' : 'active'}
      </span>
    );
  };
  
  const getTimeAgo = (dateStr: string) => {
    try {
      // For the design purposes, just show the date in a simpler format
      const date = new Date(dateStr);
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } catch (e) {
      return 'unknown';
    }
  };
  
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A';
  const isUserLoading = impersonationLoading === user.id || activationLoading === user.id || deleteLoading === user.id;
  const isInactive = isRoleInactive(user.role);

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium">{name}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>{getRoleBadge(user.role)}</TableCell>
      <TableCell>{getTimeAgo(user.created_at)}</TableCell>
      <TableCell>{inviterName}</TableCell>
      <TableCell>{getStatusBadge(user.role)}</TableCell>
      <TableCell className="text-right">
        {isUserLoading ? (
          <Button size="icon" variant="ghost" className="h-8 w-8" disabled>
            <RotateCw className="h-4 w-4 animate-spin" />
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEditProfile(user.id, user.email)}>
                <UserCog className="mr-2 h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onImpersonate(user.id, user.email)}>
                <UserX className="mr-2 h-4 w-4" />
                Impersonate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResetPassword(user.id, user.email)}>
                <KeyRound className="mr-2 h-4 w-4" />
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(user.id, user.role)}>
                <UserX className="mr-2 h-4 w-4" />
                {isInactive ? 'Activate' : 'Deactivate'}
              </DropdownMenuItem>
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(user.id, user.email)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete User
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );
}
