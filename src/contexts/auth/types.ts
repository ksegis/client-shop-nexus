
import { User, Session } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  getRedirectPathByRole: (role?: string) => string;
  updateUserWithRole?: (userId: string, role: string) => Promise<void>;
}
