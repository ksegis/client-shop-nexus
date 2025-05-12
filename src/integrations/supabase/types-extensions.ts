
import type { Database as OriginalDatabase } from './types';

// Extend the user_role enum from Supabase to include inactive roles
export type ExtendedUserRole = 
  | OriginalDatabase['public']['Enums']['user_role'] 
  | 'inactive_staff' 
  | 'inactive_admin';

// Export the Database type to be used throughout the application
export interface ExtendedDatabase {
  public: {
    Tables: OriginalDatabase['public']['Tables'];
    Views: OriginalDatabase['public']['Views'];
    Functions: OriginalDatabase['public']['Functions'];
    Enums: {
      user_role: ExtendedUserRole;
    } & Omit<OriginalDatabase['public']['Enums'], 'user_role'>;
    CompositeTypes: OriginalDatabase['public']['CompositeTypes'];
  }
}

// Export the original database type with a different name for reference if needed
export type { OriginalDatabase };

// Export a type that OriginalDatabase's user_role can be assigned to
export type DatabaseUserRole = OriginalDatabase['public']['Enums']['user_role'];
