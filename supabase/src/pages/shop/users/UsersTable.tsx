
import React, { useState } from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserCheck, UserX, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserManagement } from './UserManagementContext';
import { UserDialog } from './UserDialog';
import { isRoleInactive } from './types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useImpersonation } from '@/utils/admin/impersonationUtils';

export const UsersTable = () => {
  const { toast } = useToast();
  const { users, isLoading, error, selectedUserId, setSelectedUserId, refetchUsers, toggleUserActive } = useUserManagement();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { impersonateUser } = useImpersonation();

  const handleSelectUser = (id: string) => {
    setSelectedUserId(selectedUserId === id ? null : id);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleImpersonateUser = async (user: any) => {
    const userName = `${user.first_name} ${user.last_name}`;
    const success = await impersonateUser(user.id, userName);
    
    if (success) {
      // Redirect to the appropriate portal based on user role
      const userRole = user.role.replace('inactive_', ''); // Remove inactive prefix if present
      const redirectPath = userRole === 'customer' ? '/customer/dashboard' : '/shop/dashboard';
      window.location.href = redirectPath;
    }
  };

  const handleToggleUserActive = async (user: any) => {
    try {
      await toggleUserActive(user.id, user.role);
    } catch (error: any) {
      toast({
        title: "Error updating user",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading user data...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">Error loading user data</div>;
  }

  const getRoleBadgeColor = (role: string) => {
    if (role === 'admin' || role === 'inactive_admin') {
      return 'bg-purple-100 text-purple-800';
    } else if (role === 'staff' || role === 'inactive_staff') {
      return 'bg-blue-100 text-blue-800';
    } else {
      return 'bg-green-100 text-green-800';
    }
  };

  const getDisplayRole = (role: string) => {
    if (role === 'inactive_admin') return 'admin';
    if (role === 'inactive_staff') return 'staff';
    return role;
  };

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow 
              key={user.id}
              className={selectedUserId === user.id ? "bg-muted" : ""}
              onClick={() => handleSelectUser(user.id)}
            >
              <TableCell className="font-medium">
                {user.first_name} {user.last_name}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.phone || "—"}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`${getRoleBadgeColor(user.role)}`}>
                  {getDisplayRole(user.role)}
                </Badge>
              </TableCell>
              <TableCell>
                {isRoleInactive(user.role) ? (
                  <Badge variant="outline" className="bg-red-100 text-red-800">
                    inactive
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    active
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditUser(user);
                        }}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit user profile</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImpersonateUser(user);
                        }}
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Impersonate user</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleUserActive(user);
                        }}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isRoleInactive(user.role) ? <p>Activate user</p> : <p>Deactivate user</p>}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit User Dialog */}
      <UserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          setEditDialogOpen(false);
          setSelectedUser(null);
          refetchUsers();
        }}
        userData={selectedUser}
      />
    </TooltipProvider>
  );
};
