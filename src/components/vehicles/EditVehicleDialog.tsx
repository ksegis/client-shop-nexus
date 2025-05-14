
import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Car } from 'lucide-react';
import { vehicleSchema, VehicleFormValues } from './VehicleFormSchema';
import { Vehicle, NewVehicleData } from '@/types/vehicle';

interface EditVehicleDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: Partial<NewVehicleData>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, vehicleId: string) => Promise<void>;
  uploadingImage: boolean;
}

export const EditVehicleDialog: React.FC<EditVehicleDialogProps> = ({
  vehicle,
  open,
  onOpenChange,
  onSubmit,
  onDelete,
  onImageUpload,
  uploadingImage,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  
  // When vehicle changes, reset form with vehicle data
  React.useEffect(() => {
    if (vehicle) {
      form.reset({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vehicle_type: vehicle.vehicle_type || 'car',
        vin: vehicle.vin || '',
        license_plate: vehicle.license_plate || '',
        color: vehicle.color || '',
        mileage: vehicle.mileage ? String(vehicle.mileage) : '',
      });
    }
  }, [vehicle, form]);

  const handleSubmit = async (data: VehicleFormValues) => {
    if (!vehicle) return;
    
    try {
      setIsSubmitting(true);
      await onSubmit(vehicle.id, {
        ...data,
        year: data.year,
        mileage: data.mileage ? Number(data.mileage) : undefined,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!vehicle) return;
    await onDelete(vehicle.id);
    onOpenChange(false);
  };

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
          <DialogDescription>
            Update your vehicle details or upload an image.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vehicle_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="car">Car</SelectItem>
                        <SelectItem value="truck">Truck</SelectItem>
                        <SelectItem value="motorcycle">Motorcycle</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mileage</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VIN</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="license_plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Plate</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Vehicle Image Upload */}
            <div>
              <FormLabel>Vehicle Image</FormLabel>
              <div className="mt-1 flex items-center gap-4">
                <div className="h-16 w-16 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                  {vehicle.images && vehicle.images[0] ? (
                    <img 
                      src={vehicle.images[0]} 
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Car className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onImageUpload(e, vehicle.id)}
                  disabled={uploadingImage}
                  className="max-w-sm"
                />
              </div>
            </div>
            
            <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                className="sm:mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete Vehicle
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
