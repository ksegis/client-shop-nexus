
import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { vehicleSchema, VehicleFormValues } from './VehicleFormSchema';
import { Vehicle } from '@/types/vehicle';
import { VehicleForm } from './form/VehicleForm';
import { DeleteVehicleDialog } from './dialogs/DeleteVehicleDialog';
import { VehicleImageTab } from './dialogs/VehicleImageTab';

interface EditVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  onSubmit: (id: string, data: Partial<Vehicle>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, vehicleId: string) => Promise<void>;
  uploadingImage: boolean;
}

export const EditVehicleDialog: React.FC<EditVehicleDialogProps> = ({ 
  open, 
  onOpenChange, 
  vehicle, 
  onSubmit, 
  onDelete,
  onImageUpload,
  uploadingImage
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: '',
      model: '',
      year: '',
      vehicle_type: 'car',
      vin: '',
      license_plate: '',
      color: '',
      mileage: '',
    }
  });
  
  useEffect(() => {
    if (vehicle) {
      form.reset({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year.toString(),
        vehicle_type: vehicle.vehicle_type,
        vin: vehicle.vin || '',
        license_plate: vehicle.license_plate || '',
        color: vehicle.color || '',
        mileage: vehicle.mileage ? vehicle.mileage.toString() : '',
      });
    }
  }, [vehicle, form]);
  
  const handleSubmit = async (data: VehicleFormValues) => {
    if (!vehicle) return;
    
    try {
      setIsSubmitting(true);
      await onSubmit(vehicle.id, {
        make: data.make,
        model: data.model,
        year: Number(data.year),
        vehicle_type: data.vehicle_type,
        vin: data.vin || undefined,
        color: data.color || undefined,
        license_plate: data.license_plate || undefined,
        mileage: data.mileage ? Number(data.mileage) : undefined,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!vehicle) return;
    
    try {
      setIsDeleting(true);
      await onDelete(vehicle.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleCancel = () => {
    onOpenChange(false);
  };
  
  if (!vehicle) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
          <DialogDescription>
            Update your vehicle details below.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <VehicleForm 
              form={form}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              submitButtonText="Update Vehicle"
            />
            
            <div className="flex justify-start mt-4">
              <DeleteVehicleDialog 
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="images" className="space-y-4">
            <VehicleImageTab 
              form={form}
              vehicle={vehicle}
              onImageUpload={onImageUpload}
              uploadingImage={uploadingImage}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
