
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TestUserManagement } from "@/components/admin/TestUserManagement";
import { useAuth } from "@/contexts/auth";
import { Navigate } from "react-router-dom";

const TestUsers = () => {
  const { profile } = useAuth();
  
  // Only allow admins to access this page
  if (!profile?.role?.includes('admin')) {
    return <Navigate to="/shop" replace />;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Test Users</h2>
        <p className="text-muted-foreground">
          Create and manage test accounts for different user roles
        </p>
      </div>
      
      <TestUserManagement />
      
      <Card>
        <CardHeader>
          <CardTitle>Test User Guidelines</CardTitle>
          <CardDescription>
            Important information about using test accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Test User Visibility</h3>
            <p className="text-sm text-muted-foreground">
              Test users are clearly identified in the UI with yellow indicators and badges.
              All actions performed by test users are marked in the database and do not affect 
              production statistics or reporting.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Data Isolation</h3>
            <p className="text-sm text-muted-foreground">
              Test users interact with isolated data that does not affect production analytics.
              This allows staff to safely test features without impacting business operations.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">When to Use Test Accounts</h3>
            <p className="text-sm text-muted-foreground">
              Use test accounts when training new staff, testing new features,
              or troubleshooting customer issues by reproducing them in a safe environment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestUsers;
