
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApiConnectionsManager from './ApiConnectionsManager';
import TestUsers from './TestUsers';
import AuthLogs from './AuthLogs';
import AuditLogsViewer from '@/components/admin/AuditLogsViewer';
import SessionManagement from './SessionManagement';
import { useAuth } from "@/contexts/auth";

const AdminPage = () => {
  const { profile, isLoading } = useAuth();
  
  // Determine if user has admin access based on profile role
  const isAdmin = profile?.role === 'admin';
  
  // Show loading state while auth is being checked
  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Loading Admin Panel...</h2>
        <p>Verifying permissions...</p>
      </div>
    );
  }
  
  // If not an admin, show access denied
  if (!isAdmin) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p>You do not have permission to view this page.</p>
        <p className="mt-2">Current role: {profile?.role || 'Not authenticated'}</p>
      </div>
    );
  }
  
  // User is admin, show admin panel
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Controls</h2>
        <p className="text-muted-foreground">
          System administration and configuration settings
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Test Users</TabsTrigger>
          <TabsTrigger value="connections">API Connections</TabsTrigger>
          <TabsTrigger value="auth-logs">Auth Logs</TabsTrigger>
          <TabsTrigger value="audit-logs">System Audit Logs</TabsTrigger>
          <TabsTrigger value="sessions">Session Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <TestUsers />
        </TabsContent>
        
        <TabsContent value="connections" className="space-y-4">
          <ApiConnectionsManager />
        </TabsContent>
        
        <TabsContent value="auth-logs" className="space-y-4">
          <AuthLogs />
        </TabsContent>
        
        <TabsContent value="audit-logs" className="space-y-4">
          <AuditLogsViewer />
        </TabsContent>
        
        <TabsContent value="sessions" className="space-y-4">
          <SessionManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
