
import { Database as OriginalDatabase } from './types';

// Extend the user_role enum from Supabase to include inactive roles
export type ExtendedUserRole = 
  OriginalDatabase['public']['Enums']['user_role'] | 
  'inactive_staff' | 
  'inactive_admin';

// This helps us override the type from Supabase
declare module './types' {
  interface Database {
    public: {
      Enums: {
        user_role: ExtendedUserRole;
      } & Omit<OriginalDatabase['public']['Enums'], 'user_role'>;
    } & Omit<OriginalDatabase['public'], 'Enums'>;
  }
}

// Re-export the Database type from ./types to be used in the application
export { Database } from './types';

// Export the original database type with a different name for reference if needed
export type { OriginalDatabase };
