
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { MessageThread, Message } from './types';

export function useMessagingState() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

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
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err as Error);
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
          () => {
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

  return {
    threads,
    activeThread,
    messages,
    isLoading,
    error,
    setActiveThread,
    fetchThreads,
    fetchMessages,
    setError
  };
}
