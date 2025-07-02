
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VehicleForm } from './VehicleForm';
import { Vehicle } from '@/types/vehicle';

interface VehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  customerId: string;
  onSuccess: () => void;
}

export function VehicleDialog({ 
  open, 
  onOpenChange, 
  vehicle, 
  customerId, 
  onSuccess 
}: VehicleDialogProps) {
  const isEditing = !!vehicle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}
          </DialogTitle>
        </DialogHeader>
        <VehicleForm 
          vehicle={vehicle}
          customerId={customerId}
          onCancel={() => onOpenChange(false)}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
