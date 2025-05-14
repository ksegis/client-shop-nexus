
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // All routes are accessible without authentication
  return <>{children}</>;
};

export default ProtectedRoute;
