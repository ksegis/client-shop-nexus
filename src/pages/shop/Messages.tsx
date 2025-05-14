
import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { MessageList } from '@/components/shared/messaging/MessageList';
import { MessageInput } from '@/components/shared/messaging/MessageInput';
import { ThreadList } from '@/components/shared/messaging/ThreadList';
import { MessagingProvider, useMessaging } from '@/contexts/messaging/MessagingContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCustomers } from '@/hooks/useCustomers';
import { useVehicles } from '@/hooks/useVehicles';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

function MessagesContent() {
  const { threads, activeThread, messages, isLoading, setActiveThread, sendMessage, createThread } = useMessaging();
  const { customers, isLoading: isLoadingCustomers } = useCustomers();
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [newSubject, setNewSubject] = useState('');
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
  
  // Get vehicles for the selected customer
  const customerVehicles = selectedCustomerId
    ? vehicles.filter(vehicle => vehicle.owner_id === selectedCustomerId)
    : [];
  
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
    if (!selectedCustomerId || !newSubject.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please select a customer and enter a subject',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Create the thread
      await createThread(
        selectedCustomerId, 
        newSubject,
        selectedVehicleId || undefined
      );
      
      // Close dialog and reset form
      setShowNewThreadDialog(false);
      setSelectedCustomerId('');
      setSelectedVehicleId('');
      setNewSubject('');
      
      toast({
        title: 'Success',
        description: 'New conversation started with customer',
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
          {activeThread ? (
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
                currentUserId={user.id}
              />
              
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={isLoading}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation or start a new one with a customer
            </div>
          )}
        </div>
      </div>
      
      {/* New Thread Dialog */}
      <Dialog open={showNewThreadDialog} onOpenChange={setShowNewThreadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Customer Conversation</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Customer</Label>
              <Select
                value={selectedCustomerId}
                onValueChange={setSelectedCustomerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCustomers ? (
                    <SelectItem value="loading" disabled>Loading customers...</SelectItem>
                  ) : customers.length > 0 ? (
                    customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.first_name} {customer.last_name} ({customer.email})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No customers found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Vehicle (optional)</Label>
              <Select
                value={selectedVehicleId}
                onValueChange={setSelectedVehicleId}
                disabled={!selectedCustomerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific vehicle</SelectItem>
                  {isLoadingVehicles ? (
                    <SelectItem value="loading" disabled>Loading vehicles...</SelectItem>
                  ) : customerVehicles.length > 0 ? (
                    customerVehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No vehicles found for this customer</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Subject</Label>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="e.g., Updates about your recent service"
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

const ShopMessages = () => {
  return (
    <MessagingProvider>
      <MessagesContent />
    </MessagingProvider>
  );
};

export default ShopMessages;
