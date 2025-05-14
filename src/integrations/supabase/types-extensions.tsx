
import { Database } from './types'

// Define types for message tables (which were just added to the database)
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

// Define extended database type as an interface extension rather than redefining Database
export interface ExtendedDatabase {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      message_threads: {
        Row: MessageThread;
        Insert: Omit<MessageThread, 'id' | 'created_at' | 'updated_at' | 'last_message_at' | 'unread_count' | 'is_closed'> & {
          id?: string;
          last_message_at?: string;
          is_closed?: boolean;
          unread_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<MessageThread>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at' | 'updated_at' | 'timestamp' | 'is_read'> & {
          id?: string;
          timestamp?: string;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Message>;
      };
    }
  }
}

// Define types for user roles
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
      service_updates: {
        Row: {
          id: string;
          work_order_id: string;
          content: string;
          images?: string[];
          created_at: string;
          updated_at: string;
          milestone?: string;
          milestone_completed: boolean;
        };
        Insert: {
          id?: string;
          work_order_id: string;
          content: string;
          images?: string[];
          created_at?: string;
          updated_at?: string;
          milestone?: string;
          milestone_completed?: boolean;
        };
        Update: {
          id?: string;
          work_order_id?: string;
          content?: string;
          images?: string[];
          created_at?: string;
          updated_at?: string;
          milestone?: string;
          milestone_completed?: boolean;
        };
      };
    }
  }
}
