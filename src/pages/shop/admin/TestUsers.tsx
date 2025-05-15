
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";

const TestUsers = () => {
  const { profile } = useAuth();
  
  // Only allow admins to access this page
  if (profile?.role !== 'admin') {
    return <Navigate to="/shop" replace />;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">
          Manage user accounts and permissions
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Important information about managing user accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">User Roles</h3>
            <p className="text-sm text-muted-foreground">
              The system supports three main user roles: Customer, Staff, and Admin.
              Each role has different permissions and access levels within the application.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Data Access</h3>
            <p className="text-sm text-muted-foreground">
              User access is controlled through role-based permissions.
              Admin users have full access to all system features, while staff and customers
              have progressively more limited access.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestUsers;
