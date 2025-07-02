
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Shield, UserCheck, UserX, Mail } from 'lucide-react';
import { AdminUserDirectory } from './components/AdminUserDirectory';
import { AdminDashboard } from './components/AdminDashboard';
import { AuditLogs } from './components/AuditLogs';
import { CreateUserDialog } from './components/CreateUserDialog';
import { InviteUserDialog } from './components/InviteUserDialog';
import { useAdminUserManagement } from './hooks/useAdminUserManagement';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [inviteUserOpen, setInviteUserOpen] = useState(false);
  const { users, isLoading, refetch } = useAdminUserManagement();

  const handleInviteSuccess = () => {
    // Refresh the user list if needed
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage customers, staff, and administrators
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setInviteUserOpen(true)} variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Invite User
          </Button>
          <Button onClick={() => setCreateUserOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">User Directory</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <AdminDashboard users={users} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="users">
          <AdminUserDirectory />
        </TabsContent>
        
        <TabsContent value="audit">
          <AuditLogs />
        </TabsContent>
      </Tabs>

      <CreateUserDialog 
        open={createUserOpen} 
        onOpenChange={setCreateUserOpen} 
      />

      <InviteUserDialog
        open={inviteUserOpen}
        onOpenChange={setInviteUserOpen}
        onInviteSuccess={handleInviteSuccess}
      />
    </div>
  );
};

export default UserManagement;
