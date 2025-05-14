
import { User, Session } from '@supabase/supabase-js';

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
  role?: 'admin' | 'staff' | 'customer';
  force_password_change?: boolean;
  avatar_url?: string;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
}
