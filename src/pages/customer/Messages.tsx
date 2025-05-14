
import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { MessageList } from '@/components/shared/messaging/MessageList';
import { MessageInput } from '@/components/shared/messaging/MessageInput';
import { ThreadList } from '@/components/shared/messaging/ThreadList';
import { MessagingProvider, useMessaging } from '@/contexts/messaging/MessagingContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

function MessagesContent() {
  const { threads, activeThread, messages, isLoading, setActiveThread, sendMessage, createThread } = useMessaging();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  if (!user) {
    return <div className="p-8 text-center">Please log in to view your messages</div>;
  }
  
  // Filter threads based on search query
  const filteredThreads = threads.filter(thread => 
    thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (thread.vehicle_info && thread.vehicle_info.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const handleSendMessage = async (content: string, attachments: File[]) => {
    try {
      await sendMessage(content, attachments);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  const handleCreateNewThread = async () => {
    if (!newSubject.trim()) return;
    
    try {
      // For customer portal, we would typically create a thread with the shop
      // This is simplified - in a real app, you would select a shop staff or department
      
      // For now, we'll use a placeholder shop ID
      const shopId = "shop-placeholder-id"; // This should come from your auth system
      
      // Create the thread
      await createThread(user.id, newSubject);
      
      // Close dialog and reset form
      setShowNewThreadDialog(false);
      setNewSubject('');
      
      toast({
        title: 'Success',
        description: 'New conversation started',
      });
    } catch (error) {
      console.error('Error creating thread:', error);
      toast({
        title: 'Error',
        description: 'Failed to create conversation. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-12rem)] flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      
      <div className="flex flex-col md:flex-row border rounded-lg overflow-hidden flex-1">
        {/* Thread List */}
        <ThreadList
          threads={filteredThreads}
          activeThreadId={activeThread?.id || null}
          onSelectThread={setActiveThread}
          onCreateNewThread={() => setShowNewThreadDialog(true)}
          isShopPortal={false}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        
        {/* Message Area */}
        <div className="flex-1 flex flex-col h-full">
          {activeThread ? (
            <>
              <div className="p-4 border-b">
                <h2 className="font-semibold">{activeThread.subject}</h2>
                {activeThread.vehicle_info && (
                  <p className="text-sm text-muted-foreground">{activeThread.vehicle_info}</p>
                )}
              </div>
              
              <MessageList
                messages={messages}
                currentUserId={user.id}
              />
              
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={isLoading}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation or start a new one
            </div>
          )}
        </div>
      </div>
      
      {/* New Thread Dialog */}
      <Dialog open={showNewThreadDialog} onOpenChange={setShowNewThreadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Subject</label>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="e.g., Question about my recent service"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewThreadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNewThread}>
              Start Conversation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const CustomerMessages = () => {
  return (
    <MessagingProvider>
      <MessagesContent />
    </MessagingProvider>
  );
};

export default CustomerMessages;
