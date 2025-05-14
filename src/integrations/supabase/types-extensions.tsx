
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
