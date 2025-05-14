
import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Webhook, UserCheck } from 'lucide-react';

// Admin components
import { UserManagementProvider } from './users/UserManagementContext';
import { UsersTable } from './users/UsersTable';
import { UserHeader } from './users/UserHeader';
import { UserDialog } from './users/UserDialog';
import { ProfileDialog } from './users/ProfileDialog';
import { ResetPasswordDialog } from './users/ResetPasswordDialog';
import { useApiConnections } from '@/hooks/useApiConnections';
import { ApiConnectionDialog } from './ApiConnectionDialog';
import { ImpersonationBanner } from './ImpersonationBanner';
import { useImpersonation } from '@/utils/admin/impersonationUtils';

const AdminPage = () => {
  // State for user management
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);
  
  // State for API connections
  const [apiDialogOpen, setApiDialogOpen] = useState(false);
  
  // Get impersonation utility
  const { isImpersonating } = useImpersonation();
  
  const handleResetPassword = (userId: string, email: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(email);
    setResetDialogOpen(true);
  };
  
  const handleEditProfile = (userId: string, email: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(email);
    setProfileDialogOpen(true);
  };

  const handleImpersonateUser = (userId: string, email: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(email);
  };
  
  return (
    <div className="space-y-6">
      {/* Impersonation banner */}
      {isImpersonating() && <ImpersonationBanner />}
      
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your shop's users, API connections, and more.
        </p>
      </div>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            <span>API Connections</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> 
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts and their permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagementProvider>
                <UserHeader onAddUser={() => setUserDialogOpen(true)} />
                <div className="mt-4">
                  <UsersTable 
                    onResetPassword={handleResetPassword}
                    onEditProfile={handleEditProfile}
                    onImpersonate={handleImpersonateUser}
                  />
                </div>
                
                {/* Add User Dialog */}
                <UserDialog 
                  open={userDialogOpen} 
                  onOpenChange={setUserDialogOpen} 
                  onSuccess={() => {
                    setUserDialogOpen(false);
                  }}
                  userData={null}
                />
                
                {/* Reset Password Dialog */}
                {selectedUserId && selectedUserEmail && (
                  <ResetPasswordDialog
                    open={resetDialogOpen}
                    onOpenChange={setResetDialogOpen}
                    userId={selectedUserId}
                    email={selectedUserEmail}
                  />
                )}
                
                {/* Profile Dialog */}
                {selectedUserId && selectedUserEmail && (
                  <ProfileDialog
                    open={profileDialogOpen}
                    onOpenChange={setProfileDialogOpen}
                    userId={selectedUserId}
                    email={selectedUserEmail}
                  />
                )}
              </UserManagementProvider>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api" className="space-y-4 mt-2">
          <ApiConnectionsTab
            isDialogOpen={apiDialogOpen}
            setIsDialogOpen={setApiDialogOpen}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Separate component for API connections tab content
const ApiConnectionsTab = ({ 
  isDialogOpen, 
  setIsDialogOpen 
}: { 
  isDialogOpen: boolean, 
  setIsDialogOpen: (open: boolean) => void 
}) => {
  const { 
    connections, 
    loading, 
    fetchConnections,
    deleteConnection, 
    testConnection 
  } = useApiConnections();
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" /> 
          API Connections
        </CardTitle>
        <CardDescription>
          Manage external API connections and integrations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">API Connections</h2>
            <p className="text-sm text-muted-foreground">
              {connections.length} connection{connections.length !== 1 ? 's' : ''} configured
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => fetchConnections()}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Refresh
            </button>
            <button 
              onClick={() => setIsDialogOpen(true)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Add Connection
            </button>
          </div>
        </div>

        {/* API Connections Table */}
        <div className="border rounded-md">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Added</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading connections...</p>
                  </td>
                </tr>
              ) : connections.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center">
                    <p className="text-muted-foreground">No API connections found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click "Add Connection" to set up your first integration
                    </p>
                  </td>
                </tr>
              ) : (
                connections.map((connection) => (
                  <tr key={connection.id} className="border-b">
                    <td className="p-3">{connection.name}</td>
                    <td className="p-3 capitalize">{connection.type}</td>
                    <td className="p-3">{new Date(connection.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => testConnection(connection)}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => deleteConnection(connection.id)}
                          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add API Connection Dialog */}
        <ApiConnectionDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
        />
      </CardContent>
    </Card>
  );
};

export default AdminPage;
