
import { User, Session } from '@supabase/supabase-js';

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
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, metadata?: object) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}
