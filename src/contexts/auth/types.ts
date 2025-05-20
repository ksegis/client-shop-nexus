
import { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'staff' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  updated_at?: string;
  created_at?: string;
  force_password_change?: boolean;
}

export interface AuthResult {
  success: boolean;
  data?: { 
    user: User | null;
    session?: any;
  };
  error?: any;
}

// Keep the same type definitions for compatibility, but all methods will be no-ops
export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  portalType: 'shop' | 'customer' | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  session?: any;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: any }>;
  validateAccess: (allowedRoles?: UserRole[]) => boolean;
}
