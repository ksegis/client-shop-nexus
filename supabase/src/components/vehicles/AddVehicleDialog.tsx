
import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { vehicleSchema, VehicleFormValues, getDefaultVehicleFormValues } from './VehicleFormSchema';
import { Vehicle } from '@/types/vehicle';
import { VehicleForm } from './form/VehicleForm';

interface AddVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export const AddVehicleDialog: React.FC<AddVehicleDialogProps> = ({ 
  open, 
  onOpenChange, 
  onSubmit 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: getDefaultVehicleFormValues()
  });

  const handleSubmit = async (data: VehicleFormValues) => {
    try {
      setIsSubmitting(true);
      await onSubmit({
        owner_id: '', // This should be set by the parent component
        make: data.make,
        model: data.model,
        year: Number(data.year),
        vehicle_type: data.vehicle_type,
        vin: data.vin || '',
        color: data.color,
        license_plate: data.license_plate,
        mileage: data.mileage ? Number(data.mileage) : undefined,
      });
      onOpenChange(false);
      form.reset(getDefaultVehicleFormValues());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
          <DialogDescription>
            Enter your vehicle details. This helps us provide better service for your specific vehicle.
          </DialogDescription>
        </DialogHeader>
        <VehicleForm 
          form={form}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          submitButtonText="Add Vehicle"
        />
      </DialogContent>
    </Dialog>
  );
};
