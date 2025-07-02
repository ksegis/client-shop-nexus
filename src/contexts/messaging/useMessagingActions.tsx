
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import { MessageThread } from './types';

export function useMessagingActions(
  activeThread: MessageThread | null,
  refreshThreads: () => Promise<void>,
  refreshMessages: () => Promise<void>,
  setError: (error: Error | null) => void
) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

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
        setIsUploading(true);
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
        setIsUploading(false);
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
      refreshMessages();
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
      refreshThreads();
      
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
      refreshThreads();
    } catch (err) {
      console.error('Error marking thread as read:', err);
      // Not showing toast for this operation as it's background
      setError(err as Error);
    }
  };

  return {
    isUploading,
    sendMessage,
    createThread,
    markThreadAsRead
  };
}
