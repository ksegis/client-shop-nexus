
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { UserTable } from './UserTable';
import { DeletedUsersTable } from './DeletedUsersTable';
import { useAdminUserManagement } from '../hooks/useAdminUserManagement';

export const AdminUserDirectory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const { users, isLoading } = useAdminUserManagement();

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      activeFilter === 'all' ||
      (activeFilter === 'customers' && user.role === 'customer') ||
      (activeFilter === 'staff' && user.role === 'staff') ||
      (activeFilter === 'admins' && user.role === 'admin') ||
      (activeFilter === 'deactivated' && !user.active);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs value={activeFilter} onValueChange={setActiveFilter}>
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="deactivated">Deactivated</TabsTrigger>
          <TabsTrigger value="deleted">Deleted</TabsTrigger>
        </TabsList>
        
        <TabsContent value="deleted">
          <DeletedUsersTable searchTerm={searchTerm} />
        </TabsContent>
        
        <TabsContent value={activeFilter}>
          {activeFilter !== 'deleted' && (
            <UserTable users={filteredUsers} isLoading={isLoading} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
