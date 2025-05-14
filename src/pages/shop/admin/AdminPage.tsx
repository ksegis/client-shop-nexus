
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ApiConnectionsManager from "./ApiConnectionsManager";
import { FlaskConical, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Settings</h2>
        <p className="text-muted-foreground">
          Manage your shop settings and configurations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>User Management</CardTitle>
            </div>
            <CardDescription>
              Manage shop staff and customer accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/shop/admin/users')}
              className="w-full"
            >
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              <CardTitle>Test Accounts</CardTitle>
            </div>
            <CardDescription>
              Create and manage test accounts for different user roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/shop/admin/test-users')}
              className="w-full"
              variant="secondary"
            >
              <FlaskConical className="mr-2 h-4 w-4" />
              Manage Test Users
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Authentication Audit</CardTitle>
            </div>
            <CardDescription>
              Monitor login activity and authentication events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/shop/admin/auth-logs')}
              className="w-full"
            >
              <Shield className="mr-2 h-4 w-4" />
              View Auth Logs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>API Connections</CardTitle>
            <CardDescription>
              Manage connections to external services and APIs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApiConnectionsManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;
