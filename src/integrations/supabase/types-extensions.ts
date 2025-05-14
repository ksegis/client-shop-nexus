
import { Database } from './types';

// Define the database role type from the Supabase schema
export type DatabaseUserRole = Database['public']['Enums']['user_role'];

// Extended roles include both database roles and application-specific roles
export type ExtendedUserRole = 
  | DatabaseUserRole 
  | 'test_customer' 
  | 'test_staff' 
  | 'test_admin';

// Function to map extended roles to valid database roles
export function mapExtendedRoleToDbRole(extendedRole: ExtendedUserRole): DatabaseUserRole {
  // Map test roles to their corresponding database roles
  switch(extendedRole) {
    case 'test_customer':
      return 'customer';
    case 'test_staff':
      return 'staff';
    case 'test_admin':
      return 'admin';
    default:
      // For all other values, assume they are already valid database roles
      return extendedRole as DatabaseUserRole;
  }
}

// Function to determine if a role is a test role
export function isTestRole(role: ExtendedUserRole): boolean {
  return role.startsWith('test_');
}

// Function to get the base role from an extended role
export function getBaseRole(role: ExtendedUserRole): DatabaseUserRole {
  return mapExtendedRoleToDbRole(role);
}
