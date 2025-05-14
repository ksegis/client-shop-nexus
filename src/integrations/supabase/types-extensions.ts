
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
    Tables: Database['public']['Tables'] & {
      service_appointments: {
        Row: {
          id: string;
          customer_id: string;
          vehicle_id: string;
          appointment_date: string;
          appointment_time: string;
          service_type: string;
          description: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          vehicle_id: string;
          appointment_date: string;
          appointment_time: string;
          service_type: string;
          description?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          vehicle_id?: string;
          appointment_date?: string;
          appointment_time?: string;
          service_type?: string;
          description?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      service_history: {
        Row: {
          id: string;
          customer_id: string;
          vehicle_id: string;
          service_date: string;
          service_type: string;
          description: string;
          technician_notes: string | null;
          parts_used: string[] | null;
          labor_hours: number;
          total_cost: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          vehicle_id: string;
          service_date: string;
          service_type: string;
          description: string;
          technician_notes?: string | null;
          parts_used?: string[] | null;
          labor_hours?: number;
          total_cost?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          vehicle_id?: string;
          service_date?: string;
          service_type?: string;
          description?: string;
          technician_notes?: string | null;
          parts_used?: string[] | null;
          labor_hours?: number;
          total_cost?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    }
  }
}
