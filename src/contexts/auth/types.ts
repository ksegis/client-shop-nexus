
export interface AuthContextType {
  user: {
    id: string;
    email: string | null;
    app_metadata?: {
      role?: string;
    };
    user_metadata?: {
      first_name?: string;
      last_name?: string;
      phone?: string;
      role?: string;
    };
  };
  session: null;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  getRedirectPathByRole: (role?: string) => string;
  updateUserWithRole?: (userId: string, role: string) => Promise<void>;
}
