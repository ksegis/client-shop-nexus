
import React from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Key, UserX, UserCheck, Badge } from 'lucide-react';
import { useUserManagement } from './UserManagementContext';
import { isRoleInactive } from '@/pages/shop/users/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge as UIBadge } from '@/components/ui/badge';

export interface UsersTableProps {
  onResetPassword: (userId: string, email: string) => void;
  onEditProfile: (userId: string, email: string) => void;
}

export const UsersTable = ({ onResetPassword, onEditProfile }: UsersTableProps) => {
  const { employees, customers, isLoading, error } = useUserManagement();

  if (isLoading) {
    return <div className="text-center py-4">Loading user data...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">Error loading user data</div>;
  }

  return (
    <Tabs defaultValue="employees">
      <TabsList className="mb-4">
        <TabsTrigger value="employees">Employees</TabsTrigger>
        <TabsTrigger value="customers">Customers</TabsTrigger>
      </TabsList>
      
      <TabsContent value="employees">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Password Change</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length > 0 ? (
              employees.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <UIBadge variant={user.role === 'admin' || user.role === 'inactive_admin' ? 'default' : 'secondary'} className={`
                      ${user.role === 'admin' || user.role === 'inactive_admin' 
                        ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' 
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-100'}
                    `}>
                      {user.role === 'inactive_admin' ? 'admin' : 
                       user.role === 'inactive_staff' ? 'staff' : 
                       user.role}
                    </UIBadge>
                  </TableCell>
                  <TableCell>
                    <UIBadge variant={isRoleInactive(user.role) ? 'destructive' : 'default'} className={`
                      ${isRoleInactive(user.role) 
                        ? 'bg-red-100 text-red-800 hover:bg-red-100' 
                        : 'bg-green-100 text-green-800 hover:bg-green-100'}
                    `}>
                      {isRoleInactive(user.role) ? 'inactive' : 'active'}
                    </UIBadge>
                  </TableCell>
                  <TableCell>
                    {user.force_password_change && (
                      <UIBadge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        Required
                      </UIBadge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onEditProfile(user.id, user.email || '')}
                        title="Edit Profile"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onResetPassword(user.id, user.email || '')}
                        title="Reset Password"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No employees found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TabsContent>
      
      <TabsContent value="customers">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Password Change</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length > 0 ? (
              customers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.first_name} {user.last_name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <UIBadge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                      customer
                    </UIBadge>
                  </TableCell>
                  <TableCell>
                    {user.force_password_change && (
                      <UIBadge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        Required
                      </UIBadge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onEditProfile(user.id, user.email || '')}
                        title="Edit Profile"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onResetPassword(user.id, user.email || '')}
                        title="Reset Password"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No customers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  );
};
