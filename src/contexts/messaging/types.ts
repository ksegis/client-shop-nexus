
// Define types for the messaging context
import { MessageThread, Message } from '@/integrations/supabase/types-extensions';

// Re-export for easier imports elsewhere
export type { Message, MessageThread };

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
