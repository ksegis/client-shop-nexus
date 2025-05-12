
import { Database } from './types'

// Export the role types for use throughout the application
export type ExtendedUserRole = 'customer' | 'staff' | 'admin' | 'inactive_staff' | 'inactive_admin'
export type DatabaseUserRole = Database['public']['Enums']['user_role'] | 'inactive_staff' | 'inactive_admin'

// Fix the interface to avoid duplicate identifier issue
export interface ExtendedDatabase {
  // Add any extensions to the Database type here
  public: Database['public'] & {
    // Add any extensions to public schema here
  }
}
