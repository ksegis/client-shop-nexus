
import React, { createContext, useContext, ReactNode } from 'react';
import { useMessagingState } from './useMessagingState';
import { useMessagingActions } from './useMessagingActions';
import { MessagingContextType } from './types';
import { useToast } from '@/hooks/use-toast';

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  
  // Get state and base actions
  const {
    threads,
    activeThread,
    messages,
    isLoading,
    error,
    setActiveThread,
    fetchThreads: refreshThreads,
    fetchMessages: refreshMessages,
    setError
  } = useMessagingState();

  // Get messaging actions
  const {
    sendMessage: sendMessageBase,
    createThread: createThreadBase,
    markThreadAsRead
  } = useMessagingActions(activeThread, refreshThreads, refreshMessages, setError);

  // Add toast notifications to core actions
  const sendMessage = async (content: string, attachments: File[] = []) => {
    try {
      await sendMessageBase(content, attachments);
    } catch (err) {
      toast({
        title: 'Error',
        description: `Failed to send message: ${(err as Error).message}`,
        variant: 'destructive'
      });
    }
  };

  const createThread = async (customerId: string, subject: string, vehicleId?: string) => {
    try {
      const threadId = await createThreadBase(customerId, subject, vehicleId);
      toast({
        title: 'Success',
        description: 'New conversation created',
      });
      return threadId;
    } catch (err) {
      toast({
        title: 'Error',
        description: `Failed to create conversation: ${(err as Error).message}`,
        variant: 'destructive'
      });
      throw err;
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
        refreshThreads,
        refreshMessages
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

// Re-export from types for convenience
export { type Message, type MessageThread } from './types';
