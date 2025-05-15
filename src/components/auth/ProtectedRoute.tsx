
import { ReactNode } from 'react';
import { UserRole } from '@/contexts/auth/types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ 
  children 
}: ProtectedRouteProps) => {
  // No auth checks - just render the children
  return <>{children}</>;
};

export default ProtectedRoute;
