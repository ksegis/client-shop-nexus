
import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApiConnectionsManager from './ApiConnectionsManager';
import TestUsers from './TestUsers';
import AuthLogs from './AuthLogs';
import AuditLogsViewer from '@/components/admin/AuditLogsViewer';
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  // Add console logging to verify we're hitting this component
  useEffect(() => {
    console.log("AdminPage component loaded", { profile });
  }, [profile]);
  
  // Check for admin access - only admins should see this page
  const isAdmin = profile?.role === 'admin';
  
  // If no profile or not an admin, redirect to dashboard
  useEffect(() => {
    if (profile && !isAdmin) {
      console.log("Not an admin, redirecting to dashboard");
      navigate("/shop", { replace: true });
    }
  }, [profile, isAdmin, navigate]);
  
  // Show message while checking authorization
  if (!profile) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Loading Admin Panel...</h2>
        <p>Verifying permissions...</p>
      </div>
    );
  }
  
  // If we have a profile but not an admin, show access denied (the redirect should happen)
  if (!isAdmin) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }
  
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
