
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, UserX, UserCheck, Key, Trash2, UserCog } from 'lucide-react';
import { AdminUser } from '../types/adminTypes';
import { UserProfileDialog } from './UserProfileDialog';
import { useAdminActions } from '../hooks/useAdminActions';
import { useImpersonation } from '@/utils/admin/impersonationUtils';
import { formatDistance } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface UserTableProps {
  users: AdminUser[];
  isLoading: boolean;
}

export const UserTable = ({ users, isLoading }: UserTableProps) => {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const { toggleUserStatus, sendPasswordReset, deleteUser } = useAdminActions();
  const { impersonateUser } = useImpersonation();
  const { toast } = useToast();

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setProfileDialogOpen(true);
  };

  const handleImpersonateUser = async (user: AdminUser) => {
    const userName = `${user.first_name} ${user.last_name}`;
    const success = await impersonateUser(user.id, userName);
    
    if (success) {
      // Redirect to the appropriate portal based on user role
      const redirectPath = user.role === 'customer' ? '/customer/dashboard' : '/shop/dashboard';
      window.location.href = redirectPath;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingUserId(userId);
      await deleteUser(userId);
      toast({
        title: "Success",
        description: "User deleted successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'staff': return 'bg-blue-100 text-blue-800';
      case 'customer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.last_login 
                    ? formatDistance(new Date(user.last_login), new Date(), { addSuffix: true })
                    : 'Never'
                  }
                </TableCell>
                <TableCell>
                  <Badge variant={user.active ? "default" : "secondary"}>
                    {user.active ? 'Active' : 'Deactivated'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditUser(user)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleImpersonateUser(user)}>
                        <UserCog className="mr-2 h-4 w-4" />
                        Impersonate User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleUserStatus(user.id, user.active)}>
                        {user.active ? (
                          <>
                            <UserX className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => sendPasswordReset(user.email)}>
                        <Key className="mr-2 h-4 w-4" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600"
                        disabled={deletingUserId === user.id}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deletingUserId === user.id ? 'Deleting...' : 'Delete User'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserProfileDialog
        user={selectedUser}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </>
  );
};
