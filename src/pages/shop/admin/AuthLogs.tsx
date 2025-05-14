
import { AuthLogsViewer } from "@/components/admin/AuthLogsViewer";
import { useAuth } from "@/contexts/auth";
import { Navigate } from "react-router-dom";

const AuthLogs = () => {
  const { profile } = useAuth();
  
  // Only allow admins to access this page
  if (!profile?.role?.includes('admin')) {
    return <Navigate to="/shop" replace />;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Authentication Logs</h2>
        <p className="text-muted-foreground">
          Monitor and audit authentication activity across both portals
        </p>
      </div>
      
      <AuthLogsViewer />
    </div>
  );
};

export default AuthLogs;
