
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApiConnectionsManager from './ApiConnectionsManager';
import TestUsers from './TestUsers';
import AuthLogs from './AuthLogs';
import AuditLogsViewer from '@/components/admin/AuditLogsViewer';

const AdminPage = () => {
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
      </Tabs>
    </div>
  );
};

export default AdminPage;
