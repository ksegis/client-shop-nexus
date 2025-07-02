
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCustomers } from '@/hooks/useCustomers';
import { useVehicles } from '@/hooks/useVehicles';
import { useMessaging } from '@/contexts/messaging';

interface NewThreadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewThreadDialog: React.FC<NewThreadDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { customers, isLoading: isLoadingCustomers } = useCustomers();
  const { vehicles, loading: isLoadingVehicles } = useVehicles();
  const { toast } = useToast();
  const { createThread } = useMessaging();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [newSubject, setNewSubject] = useState('');

  // Get vehicles for the selected customer
  const customerVehicles = selectedCustomerId
    ? vehicles.filter(vehicle => vehicle.owner_id === selectedCustomerId)
    : [];

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
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateNewThread}>
            Start Conversation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
