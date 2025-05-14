
// Define types for the messaging context

// MessageThread and Message interfaces
export interface MessageThread {
  id: string;
  customer_id: string;
  vehicle_id?: string;
  subject: string;
  last_message_at: string;
  is_closed: boolean;
  unread_count: number;
  customer_name?: string;
  vehicle_info?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_name?: string;
  sender_type: 'customer' | 'shop';
  content: string;
  attachments?: string[];
  is_read: boolean;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

// Context type
export interface MessagingContextType {
  threads: MessageThread[];
  activeThread: MessageThread | null;
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  setActiveThread: (thread: MessageThread | null) => void;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  createThread: (customer_id: string, subject: string, vehicleId?: string) => Promise<string>;
  markThreadAsRead: (threadId: string) => Promise<void>;
  refreshThreads: () => Promise<void>;
  refreshMessages: () => Promise<void>;
}
