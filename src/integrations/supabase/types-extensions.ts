
import { Database } from './types';

// Extend the user_role enum from Supabase to include inactive roles
export type ExtendedUserRole = 
  Database['public']['Enums']['user_role'] | 
  'inactive_staff' | 
  'inactive_admin';

// This helps us override the type from Supabase
declare module './types' {
  interface Database {
    public: {
      Enums: {
        user_role: ExtendedUserRole;
      } & Omit<Database['public']['Enums'], 'user_role'>;
    } & Omit<Database['public'], 'Enums'>;
  } & Omit<Database, 'public'>;
}

// Export the extended types to ensure they're used throughout the application
export { Database };
