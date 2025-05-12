
import { Database } from './types'

// Export the role types for use throughout the application
export type ExtendedUserRole = 'customer' | 'staff' | 'admin' | 'inactive_staff' | 'inactive_admin'
export type DatabaseUserRole = 'staff' | 'admin' | 'customer' | 'inactive_staff' | 'inactive_admin'

// Fix the duplicate interface issue by renaming it
export interface ExtendedDatabase extends Database {
  // Add any extensions to the Database type here
}
