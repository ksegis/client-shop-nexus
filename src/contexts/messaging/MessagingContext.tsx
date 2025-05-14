
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import { MessageThread, Message } from '@/integrations/supabase/types-extensions';

// Reuse the types from types-extensions
export type { Message, MessageThread as Thread };

interface MessagingContextType {
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

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's threads
  const fetchThreads = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Different queries based on user role (shop staff or customer)
      // This is just a simplified example - in a real app, you'd check user roles
      const isShopStaff = user.email?.includes('shop') || true; // Temporary simple check
      
      // Cast supabase to use our extended types
      const supabaseWithTypes = supabase as any;
      
      let query = supabaseWithTypes
        .from('message_threads')
        .select(`
          *,
          profiles!customer_id (
            first_name,
            last_name,
            email
          ),
          vehicles (
            make,
            model,
            year
          )
        `)
        .order('last_message_at', { ascending: false });
      
      // For shop staff, get all threads
      // For customers, only get their own threads
      if (!isShopStaff) {
        query = query.eq('customer_id', user.id);
      }
      
      const { data, error: queryError } = await query;
      
      if (queryError) throw queryError;
      
      // Process thread data
      const processedThreads = (data || []).map((thread: any) => ({
        ...thread,
        customer_name: thread.profiles 
          ? `${thread.profiles.first_name || ''} ${thread.profiles.last_name || ''}`.trim() || thread.profiles.email
          : 'Unknown Customer',
        vehicle_info: thread.vehicles
          ? `${thread.vehicles.year} ${thread.vehicles.make} ${thread.vehicles.model}`
          : undefined
      }));
      
      setThreads(processedThreads);
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError(err as Error);
      toast({
        title: 'Error',
        description: `Failed to load message threads: ${(err as Error).message}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages for active thread
  const fetchMessages = async () => {
    if (!activeThread) return;
    
    try {
      setIsLoading(true);
      
      // Cast supabase to use our extended types
      const supabaseWithTypes = supabase as any;
      
      const { data, error: queryError } = await supabaseWithTypes
        .from('messages')
        .select(`
          *,
          profiles!sender_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('thread_id', activeThread.id)
        .order('timestamp', { ascending: true });
        
      if (queryError) throw queryError;
      
      // Process message data
      const processedMessages = (data || []).map((msg: any) => ({
        ...msg,
        sender_name: msg.profiles 
          ? `${msg.profiles.first_name || ''} ${msg.profiles.last_name || ''}`.trim() || msg.profiles.email
          : 'Unknown User'
      }));
      
      setMessages(processedMessages);
      
      // Mark thread as read automatically when viewing
      markThreadAsRead(activeThread.id);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err as Error);
      toast({
        title: 'Error',
        description: `Failed to load messages: ${(err as Error).message}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;
    
    // Fetch initial data
    fetchThreads();
    
    // Listen for new/updated threads
    const threadsChannel = supabase
      .channel('message-threads-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'message_threads' },
        () => {
          fetchThreads();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(threadsChannel);
    };
  }, [user]);

  // Fetch messages when active thread changes
  useEffect(() => {
    if (activeThread) {
      fetchMessages();
      
      // Listen for new messages in this thread
      const messagesChannel = supabase
        .channel(`thread-messages-${activeThread.id}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'messages',
            filter: `thread_id=eq.${activeThread.id}`
          },
          (payload) => {
            // If it's a new message and not from current user, show notification
            if (payload.eventType === 'INSERT' && (payload.new as any).sender_id !== user?.id) {
              toast({
                title: 'New Message',
                description: 'You have received a new message',
              });
            }
            
            // Refresh messages
            fetchMessages();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [activeThread]);

  // Send a message
  const sendMessage = async (content: string, attachments: File[] = []) => {
    if (!activeThread || !user) return;
    
    try {
      // Determine if sender is shop staff or customer
      const isShopStaff = user.email?.includes('shop') || true; // Temporary simple check
      const senderType = isShopStaff ? 'shop' : 'customer';
      
      // Upload attachments if any (simplified version)
      const attachmentUrls: string[] = [];
      
      if (attachments.length > 0) {
        for (const file of attachments) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `message-attachments/${activeThread.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('message-attachments')
            .upload(filePath, file);
            
          if (uploadError) throw uploadError;
          
          // Get public URL
          const { data } = supabase.storage
            .from('message-attachments')
            .getPublicUrl(filePath);
            
          attachmentUrls.push(data.publicUrl);
        }
      }
      
      // Insert message
      // Cast supabase to use our extended types
      const supabaseWithTypes = supabase as any;
      
      const { error: insertError } = await supabaseWithTypes
        .from('messages')
        .insert({
          thread_id: activeThread.id,
          sender_id: user.id,
          sender_type: senderType,
          content,
          attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
          is_read: false
        });
        
      if (insertError) throw insertError;
      
      // Update thread's last_message_at
      const { error: updateError } = await supabaseWithTypes
        .from('message_threads')
        .update({ 
          last_message_at: new Date().toISOString(),
          // Increment unread count for the other party
          unread_count: activeThread.unread_count + 1 
        })
        .eq('id', activeThread.id);
        
      if (updateError) throw updateError;
      
      // Refresh messages (although real-time subscription should handle this)
      fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: 'Error',
        description: `Failed to send message: ${(err as Error).message}`,
        variant: 'destructive'
      });
    }
  };

  // Create a new thread
  const createThread = async (customerId: string, subject: string, vehicleId?: string) => {
    if (!user) throw new Error('User must be authenticated');
    
    try {
      // Cast supabase to use our extended types
      const supabaseWithTypes = supabase as any;
      
      const { data, error: insertError } = await supabaseWithTypes
        .from('message_threads')
        .insert({
          customer_id: customerId,
          vehicle_id: vehicleId,
          subject,
          last_message_at: new Date().toISOString(),
          is_closed: false,
          unread_count: 0
        })
        .select()
        .single();
        
      if (insertError) throw insertError;
      
      // Refresh threads list
      fetchThreads();
      
      // Return the new thread ID
      return data.id;
    } catch (err) {
      console.error('Error creating thread:', err);
      toast({
        title: 'Error',
        description: `Failed to create conversation: ${(err as Error).message}`,
        variant: 'destructive'
      });
      throw err;
    }
  };

  // Mark a thread as read
  const markThreadAsRead = async (threadId: string) => {
    if (!user) return;
    
    try {
      // Cast supabase to use our extended types
      const supabaseWithTypes = supabase as any;
      
      // Mark all messages from the other party as read
      const { error: updateError } = await supabaseWithTypes
        .from('messages')
        .update({ is_read: true })
        .eq('thread_id', threadId)
        .not('sender_id', 'eq', user.id);
        
      if (updateError) throw updateError;
      
      // Reset unread count on thread
      const { error: threadError } = await supabaseWithTypes
        .from('message_threads')
        .update({ unread_count: 0 })
        .eq('id', threadId);
        
      if (threadError) throw threadError;
      
      // Refresh thread list to update badges
      fetchThreads();
    } catch (err) {
      console.error('Error marking thread as read:', err);
      // Not showing toast for this operation as it's background
    }
  };

  return (
    <MessagingContext.Provider
      value={{
        threads,
        activeThread,
        messages,
        isLoading,
        error,
        setActiveThread,
        sendMessage,
        createThread,
        markThreadAsRead,
        refreshThreads: fetchThreads,
        refreshMessages: fetchMessages
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};
