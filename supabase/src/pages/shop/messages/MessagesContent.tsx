
import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useMessaging } from '@/contexts/messaging';
import { ThreadList } from '@/components/shared/messaging/ThreadList';
import { MessageArea } from './components/MessageArea';
import { NewThreadDialog } from './components/NewThreadDialog';

export function MessagesContent() {
  const { threads, activeThread, messages, isLoading, setActiveThread, sendMessage } = useMessaging();
  const { user } = useAuth();
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  if (!user) {
    return <div className="p-8 text-center">Please log in to view messages</div>;
  }
  
  // Filter threads based on search query
  const filteredThreads = threads.filter(thread => 
    thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (thread.customer_name && thread.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (thread.vehicle_info && thread.vehicle_info.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-12rem)] flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Customer Messages</h1>
      
      <div className="flex flex-col md:flex-row border rounded-lg overflow-hidden flex-1">
        {/* Thread List */}
        <ThreadList
          threads={filteredThreads}
          activeThreadId={activeThread?.id || null}
          onSelectThread={setActiveThread}
          onCreateNewThread={() => setShowNewThreadDialog(true)}
          isShopPortal={true}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        
        {/* Message Area */}
        <div className="flex-1 flex flex-col h-full">
          <MessageArea 
            activeThread={activeThread}
            messages={messages}
            isLoading={isLoading}
            onSendMessage={sendMessage}
          />
        </div>
      </div>
      
      {/* New Thread Dialog */}
      <NewThreadDialog 
        open={showNewThreadDialog} 
        onOpenChange={setShowNewThreadDialog} 
      />
    </div>
  );
}
