
import React from 'react';
import { Thread } from '@/contexts/messaging/MessagingContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ThreadListProps {
  threads: Thread[];
  activeThreadId: string | null;
  onSelectThread: (thread: Thread) => void;
  onCreateNewThread?: () => void;
  isShopPortal?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const ThreadList: React.FC<ThreadListProps> = ({
  threads,
  activeThreadId,
  onSelectThread,
  onCreateNewThread,
  isShopPortal = false,
  searchQuery = '',
  onSearchChange
}) => {
  return (
    <div className="border-r w-full md:w-80 shrink-0 flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold mb-2">Messages</h2>
        
        {onSearchChange && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
        
        {onCreateNewThread && (
          <Button
            onClick={onCreateNewThread}
            variant="default"
            className="mt-2 w-full"
          >
            New Message
          </Button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No conversations yet.
          </div>
        ) : (
          threads.map((thread) => (
            <Button
              key={thread.id}
              variant="ghost"
              className={`w-full justify-start px-4 py-3 h-auto border-b ${
                thread.id === activeThreadId ? 'bg-muted' : ''
              }`}
              onClick={() => onSelectThread(thread)}
            >
              <div className="flex items-start w-full">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback>
                    {isShopPortal
                      ? thread.customer_name?.substring(0, 2) || 'CU'
                      : 'SH'}
                  </AvatarFallback>
                  <AvatarImage src={undefined} />
                </Avatar>
                
                <div className="flex-1 text-left">
                  <div className="flex justify-between items-start">
                    <span className="font-medium truncate">
                      {isShopPortal ? thread.customer_name : 'Shop Support'}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground truncate">
                    {thread.subject}
                  </div>
                  
                  {thread.vehicle_info && (
                    <div className="text-xs text-muted-foreground truncate">
                      {thread.vehicle_info}
                    </div>
                  )}
                  
                  {thread.unread_count > 0 && (
                    <Badge className="mt-1 h-5 w-5 p-0 flex items-center justify-center">
                      {thread.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            </Button>
          ))
        )}
      </div>
    </div>
  );
};
