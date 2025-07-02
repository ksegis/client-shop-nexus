
import React, { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Message } from '@/contexts/messaging/MessagingContext';
import { formatDistanceToNow } from 'date-fns';
import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <p className="text-muted-foreground text-center">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      {messages.map((message) => {
        const isCurrentUser = message.sender_id === currentUserId;
        
        return (
          <div 
            key={message.id} 
            className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            {!isCurrentUser && (
              <Avatar className="h-8 w-8 mr-2 mt-1">
                <AvatarFallback>
                  {message.sender_name?.substring(0, 2) || 'UN'}
                </AvatarFallback>
                <AvatarImage src={undefined} />
              </Avatar>
            )}
            
            <div className="max-w-[75%]">
              <div 
                className={`rounded-lg p-3 ${
                  isCurrentUser 
                    ? 'bg-primary text-primary-foreground ml-2' 
                    : 'bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((url, index) => {
                      const fileName = url.split('/').pop() || `attachment-${index + 1}`;
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                      
                      return isImage ? (
                        <div key={index} className="rounded overflow-hidden border">
                          <img 
                            src={url} 
                            alt={`Attachment ${index + 1}`}
                            className="max-w-full h-auto"
                          />
                        </div>
                      ) : (
                        <Button 
                          key={index}
                          variant="outline" 
                          size="sm"
                          className="flex items-center w-full"
                          asChild
                        >
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <Paperclip className="h-4 w-4 mr-2" />
                            {fileName}
                          </a>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div 
                className={`text-xs text-muted-foreground mt-1 ${
                  isCurrentUser ? 'text-right' : 'text-left'
                }`}
              >
                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                {isCurrentUser && (
                  <span className="ml-2">
                    {message.is_read ? 'Read' : 'Delivered'}
                  </span>
                )}
              </div>
            </div>
            
            {isCurrentUser && (
              <Avatar className="h-8 w-8 ml-2 mt-1">
                <AvatarFallback>
                  {message.sender_name?.substring(0, 2) || 'ME'}
                </AvatarFallback>
                <AvatarImage src={undefined} />
              </Avatar>
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
