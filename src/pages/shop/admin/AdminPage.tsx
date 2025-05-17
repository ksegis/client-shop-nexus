
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApiConnectionsManager from './ApiConnectionsManager';
import TestUsers from './TestUsers';
import AuthLogs from './AuthLogs';
import AuditLogsViewer from '@/components/admin/AuditLogsViewer';
import SessionManagement from './SessionManagement';
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Add console logging to verify we're hitting this component
  useEffect(() => {
    console.log("AdminPage component loaded", { profile, user });
    setIsLoading(false);
  }, [profile, user]);
  
  // Check for admin access - either admin role or dev customer with override
  // We need to check both the profile role and for development mode users
  const isAdmin = profile?.role === 'admin' || user?.email === 'customer@example.com';
  
  // If no profile or not an admin, redirect to dashboard
  useEffect(() => {
    // Only redirect if we're finished loading and the user is not an admin
    if (!isLoading && profile && !isAdmin) {
      console.log("Not an admin, redirecting to dashboard");
      navigate("/shop", { replace: true });
    }
  }, [profile, isAdmin, navigate, isLoading]);
  
  // Add additional debug logging to help troubleshoot
  useEffect(() => {
    console.log("Admin access check:", { 
      isAdmin, 
      profileRole: profile?.role,
      isDevCustomer: user?.email === 'customer@example.com',
      isLoading
    });
  }, [isAdmin, profile, user, isLoading]);
  
  // Show message while checking authorization
  if (isLoading || !profile) {
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
        <p className="mt-2">User role: {profile.role}</p>
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
