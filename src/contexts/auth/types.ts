
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
