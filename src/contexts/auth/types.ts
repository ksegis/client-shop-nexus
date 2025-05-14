
export interface AuthContextType {
  user: {
    id: string;
    email: string | null; // Changed from string to string | null to match Supabase's User type
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
  session: any;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ 
    success: boolean;
    data?: any;
    error?: any;
  }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ 
    success: boolean;
    data?: any;
    error?: any;
  }>;
  signOut: () => Promise<{ 
    success: boolean;
    error?: any;
  }>;
  loading: boolean;
  getRedirectPathByRole: (role?: string) => string;
  updateUserWithRole?: (userId: string, role: string) => Promise<void>;
}
