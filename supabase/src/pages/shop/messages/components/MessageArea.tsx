
import React from 'react';
import { MessageList } from '@/components/shared/messaging/MessageList';
import { MessageInput } from '@/components/shared/messaging/MessageInput';
import { useAuth } from '@/contexts/auth';
import { Message, MessageThread } from '@/contexts/messaging/types';
import { useToast } from '@/hooks/use-toast';

interface MessageAreaProps {
  activeThread: MessageThread | null;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string, attachments: File[]) => Promise<void>;
}

export const MessageArea: React.FC<MessageAreaProps> = ({
  activeThread,
  messages,
  isLoading,
  onSendMessage
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSendMessage = async (content: string, attachments: File[]) => {
    try {
      await onSendMessage(content, attachments);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (!activeThread) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a conversation or start a new one with a customer
      </div>
    );
  }

  return (
    <>
      <div className="p-4 border-b">
        <h2 className="font-semibold">{activeThread.subject}</h2>
        <p className="text-sm text-muted-foreground">Customer: {activeThread.customer_name}</p>
        {activeThread.vehicle_info && (
          <p className="text-sm text-muted-foreground">Vehicle: {activeThread.vehicle_info}</p>
        )}
      </div>
      
      <MessageList
        messages={messages}
        currentUserId={user?.id || ''}
      />
      
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isLoading}
      />
    </>
  );
};
