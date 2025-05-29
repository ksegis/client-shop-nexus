
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Vehicle } from '@/types/vehicle';
import { useVehicleManagement } from '@/hooks/vehicles/useVehicleManagement';
import { useCustomers } from './CustomersContext';

const vehicleFormSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900, 'Year must be valid').max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
  color: z.string().optional(),
  vin: z.string().optional(),
  license_plate: z.string().optional(),
  vehicle_type: z.enum(['car', 'truck', 'motorcycle', 'other']),
  owner_id: z.string().min(1, 'Customer is required'),
});

type VehicleFormData = z.infer<typeof vehicleFormSchema>;

interface VehicleFormProps {
  vehicle: Vehicle | null;
  customerId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function VehicleForm({ vehicle, customerId, onCancel, onSuccess }: VehicleFormProps) {
  const { customers } = useCustomers();
  const { createVehicle, updateVehicle } = useVehicleManagement();
  const { toast } = useToast();
  const isEditing = !!vehicle;

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      make: vehicle?.make || '',
      model: vehicle?.model || '',
      year: vehicle?.year || new Date().getFullYear(),
      color: vehicle?.color || '',
      vin: vehicle?.vin || '',
      license_plate: vehicle?.license_plate || '',
      vehicle_type: vehicle?.vehicle_type || 'car',
      owner_id: vehicle?.owner_id || customerId,
    },
  });

  const onSubmit = async (data: VehicleFormData) => {
    try {
      if (isEditing && vehicle) {
        await updateVehicle(vehicle.id, data);
        toast({
          title: "Success",
          description: "Vehicle updated successfully",
        });
      } else {
        await createVehicle(data);
        toast({
          title: "Success",
          description: "Vehicle created successfully",
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} vehicle`,
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="make">Make</Label>
          <Input
            id="make"
            {...form.register('make')}
            placeholder="Enter vehicle make"
          />
          {form.formState.errors.make && (
            <p className="text-sm text-red-600">{form.formState.errors.make.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            {...form.register('model')}
            placeholder="Enter vehicle model"
          />
          {form.formState.errors.model && (
            <p className="text-sm text-red-600">{form.formState.errors.model.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            type="number"
            {...form.register('year', { valueAsNumber: true })}
            placeholder="Enter year"
          />
          {form.formState.errors.year && (
            <p className="text-sm text-red-600">{form.formState.errors.year.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            {...form.register('color')}
            placeholder="Enter vehicle color"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vehicle_type">Vehicle Type</Label>
        <Select
          value={form.watch('vehicle_type')}
          onValueChange={(value) => form.setValue('vehicle_type', value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select vehicle type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="car">Car</SelectItem>
            <SelectItem value="truck">Truck</SelectItem>
            <SelectItem value="motorcycle">Motorcycle</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="owner_id">Customer</Label>
        <Select
          value={form.watch('owner_id')}
          onValueChange={(value) => form.setValue('owner_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.first_name} {customer.last_name} - {customer.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.owner_id && (
          <p className="text-sm text-red-600">{form.formState.errors.owner_id.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vin">VIN</Label>
          <Input
            id="vin"
            {...form.register('vin')}
            placeholder="Enter VIN number"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="license_plate">License Plate</Label>
          <Input
            id="license_plate"
            {...form.register('license_plate')}
            placeholder="Enter license plate"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting 
            ? (isEditing ? 'Updating...' : 'Creating...') 
            : (isEditing ? 'Update Vehicle' : 'Create Vehicle')
          }
        </Button>
      </div>
    </form>
  );
}
