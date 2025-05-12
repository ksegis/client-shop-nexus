
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, KeySquare, Users } from 'lucide-react';
import ApiKeysManager from './admin/ApiKeysManager';
import StaffManager from './admin/StaffManager';
import SystemHealth from './admin/SystemHealth';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('api-keys');
  
  return (
    <Layout portalType="shop">
      <div className="space-y-6">
        <div className="flex justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage API keys, staff accounts, and system health.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <KeySquare className="h-4 w-4" />
              <span className="hidden sm:inline">API Keys</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Staff Management</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">System Health</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="api-keys" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Keys Management</CardTitle>
                <CardDescription>
                  Add and manage API keys for distributors and GHL integration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ApiKeysManager />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Staff Management</CardTitle>
                <CardDescription>
                  Add, edit, or remove staff members and their access levels.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StaffManager />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="health" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Monitor system health and data synchronization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SystemHealth />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
