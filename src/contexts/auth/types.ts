
import { User, Session } from '@supabase/supabase-js';

// Define all user roles
export type UserRole = 
  | 'customer' 
  | 'staff' 
  | 'admin'
  | 'test_customer'
  | 'test_staff'
  | 'test_admin';

export interface AuthResult {
  success: boolean;
  data?: any;
  error?: any;
}

export interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role?: UserRole;
  force_password_change?: boolean;
  avatar_url?: string;
  is_test_account?: boolean;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isTestUser: boolean;
  portalType: 'shop' | 'customer' | null;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  getRedirectPathByRole: (role: UserRole) => string;
  impersonateTestUser: (role: UserRole) => void;
  stopImpersonation: () => void;
  validateAccess: (allowedRoles: UserRole[]) => boolean;
  isDevMode: boolean;
}

// Helper functions for determining role characteristics
export const isTestRole = (role: UserRole): boolean => {
  return role.startsWith('test_');
};

export const getBaseRole = (role: UserRole): 'customer' | 'staff' | 'admin' => {
  if (role.includes('customer')) return 'customer';
  if (role.includes('staff')) return 'staff';
  return 'admin';
};

export const getPortalByRole = (role: UserRole): 'shop' | 'customer' => {
  return role.includes('customer') ? 'customer' : 'shop';
};
