
import React, { useState } from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserManagement } from './UserManagementContext';
import { UserDialog } from './UserDialog';
import { isRoleInactive } from './types';

export const UsersTable = () => {
  const { toast } = useToast();
  const { users, isLoading, error, selectedUserId, setSelectedUserId, refetchUsers, toggleUserActive } = useUserManagement();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleSelectUser = (id: string) => {
    setSelectedUserId(selectedUserId === id ? null : id);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
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

  return (
    <>
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.role === 'admin' || user.role === 'inactive_admin'
                    ? 'bg-purple-100 text-purple-800' 
                    : user.role === 'staff' || user.role === 'inactive_staff'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {user.role === 'inactive_admin' ? 'admin' : 
                   user.role === 'inactive_staff' ? 'staff' : 
                   user.role}
                </span>
              </TableCell>
              <TableCell>
                {(user.role === 'staff' || user.role === 'admin' || 
                  user.role === 'inactive_staff' || user.role === 'inactive_admin') && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isRoleInactive(user.role) 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {isRoleInactive(user.role) ? 'inactive' : 'active'}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {(user.role === 'staff' || user.role === 'admin' || 
                  user.role === 'inactive_staff' || user.role === 'inactive_admin') && (
                  <div className="flex justify-end gap-2">
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
                  </div>
                )}
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
    </>
  );
};
