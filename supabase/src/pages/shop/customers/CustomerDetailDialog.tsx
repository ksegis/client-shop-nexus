
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Customer } from './types';
import { CustomerProfileForm } from './CustomerProfileForm';
import { CustomerVehicles } from './CustomerVehicles';

interface CustomerDetailDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function CustomerDetailDialog({ 
  customer, 
  open, 
  onOpenChange, 
  onUpdate 
}: CustomerDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('profile');

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Customer Details: {customer.first_name} {customer.last_name}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <CustomerProfileForm 
              customer={customer} 
              onUpdate={onUpdate}
              onClose={() => onOpenChange(false)}
            />
          </TabsContent>
          
          <TabsContent value="vehicles">
            <CustomerVehicles 
              customerId={customer.id}
              customerName={`${customer.first_name} ${customer.last_name}`}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
