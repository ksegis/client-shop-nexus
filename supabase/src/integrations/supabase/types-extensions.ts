
import { Database } from './types';

// Define the database role type from the Supabase schema
export type DatabaseUserRole = Database['public']['Enums']['user_role'];

// Extended roles include both database roles and application-specific roles
export type ExtendedUserRole = 
  | DatabaseUserRole 
  | 'test_customer' 
  | 'test_staff' 
  | 'test_admin'
  | 'inactive_staff'
  | 'inactive_admin';

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
    case 'inactive_staff':
      return 'staff';
    case 'inactive_admin':
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

// Define interfaces for message-related types
export interface MessageThread {
  id: string;
  customer_id: string;
  vehicle_id?: string;
  subject: string;
  last_message_at: string;
  is_closed: boolean;
  unread_count: number;
  created_at: string;
  updated_at: string;
  // These are joined fields, not in the actual table schema
  customer_name?: string;
  vehicle_info?: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_type: 'customer' | 'shop';
  content: string;
  attachments?: string[];
  is_read: boolean;
  timestamp: string;
  created_at: string;
  updated_at: string;
  // This is a joined field, not in the actual table schema
  sender_name?: string;
}

// Define database table types
export interface ServiceAppointment {
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
  contact_email?: string;
  contact_phone?: string | null;
  vehicles?: {
    make: string;
    model: string;
    year: number | string;
  };
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export interface ServiceHistoryEntry {
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
}

export type NewAppointmentData = {
  customer_id: string;
  vehicle_id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  description?: string | null;
  status?: string;
  contact_email?: string;
  contact_phone?: string | null;
};
