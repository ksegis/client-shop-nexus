
import { Database } from './types'

// Export the role types for use throughout the application
export type ExtendedUserRole = 'customer' | 'staff' | 'admin' | 'inactive_staff' | 'inactive_admin';

// Define the database user role type that matches what's in the database schema
export type DatabaseUserRole = Database['public']['Enums']['user_role'];

// Define the mapping of extended roles to database roles
export const mapExtendedRoleToDbRole = (role: ExtendedUserRole): DatabaseUserRole => {
  // For inactive roles, we map them to their active versions in the database
  if (role === 'inactive_staff') return 'staff';
  if (role === 'inactive_admin') return 'admin';
  
  // For active roles, we can safely cast as they have the same names
  return role as DatabaseUserRole;
};

// Define extended database type as an interface extension rather than redefining Database
export interface ExtendedDatabase {
  public: Database['public'] & {
    // Add any extensions to public schema here
  }
}
