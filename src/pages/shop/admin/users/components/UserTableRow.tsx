
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
    let color;
    
    switch(baseRole) {
      case 'admin':
        color = 'bg-purple-100 text-purple-800';
        break;
      case 'staff':
        color = 'bg-blue-100 text-blue-800';
        break;
      case 'customer':
      default:
        color = 'bg-green-100 text-green-800';
    }
    
    return (
      <Badge variant="outline" className={color}>
        {baseRole}
      </Badge>
    );
  };
  
  const getStatusBadge = (role: string) => {
    const isInactive = isRoleInactive(role);
    
    return (
      <Badge variant="outline" className={isInactive ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
        {isInactive ? 'inactive' : 'active'}
      </Badge>
    );
  };
  
  const getTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
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
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEditProfile(user.id, user.email)}>
                <UserCog className="mr-2 h-4 w-4" /> Edit profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResetPassword(user.id, user.email)}>
                <KeyRound className="mr-2 h-4 w-4" /> Reset password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onImpersonate(user.id, user.email)}>
                <UserX className="mr-2 h-4 w-4" /> Impersonate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggleActive(user.id, user.role)}>
                <RotateCw className="mr-2 h-4 w-4" /> {isInactive ? 'Activate' : 'Deactivate'}
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600"
                  onClick={() => onDelete(user.id, user.email)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete user
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );
}
