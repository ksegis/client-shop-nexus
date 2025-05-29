
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useVehicleManagement } from '@/hooks/vehicles/useVehicleManagement';
import { Vehicle, VehicleType } from '@/types/vehicle';
import { useToast } from '@/hooks/use-toast';

const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().min(1900, "Invalid year").max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  color: z.string().optional(),
  vin: z.string().optional(),
  license_plate: z.string().optional(),
  vehicle_type: z.enum(['car', 'truck', 'motorcycle', 'other'] as const),
  mileage: z.number().min(0, "Mileage cannot be negative").optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  vehicle: Vehicle | null;
  customerId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function VehicleForm({ vehicle, customerId, onCancel, onSuccess }: VehicleFormProps) {
  const { addVehicle, updateVehicle } = useVehicleManagement();
  const { toast } = useToast();
  const isEditing = !!vehicle;

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: isEditing && vehicle
      ? {
          make: vehicle.make || '',
          model: vehicle.model || '',
          year: vehicle.year || new Date().getFullYear(),
          color: vehicle.color || '',
          vin: vehicle.vin || '',
          license_plate: vehicle.license_plate || '',
          vehicle_type: vehicle.vehicle_type || 'car',
          mileage: vehicle.mileage || 0,
        }
      : {
          make: '',
          model: '',
          year: new Date().getFullYear(),
          color: '',
          vin: '',
          license_plate: '',
          vehicle_type: 'car' as VehicleType,
          mileage: 0,
        },
  });

  const onSubmit = async (values: VehicleFormValues) => {
    try {
      if (isEditing && vehicle) {
        await updateVehicle(vehicle.id, {
          make: values.make,
          model: values.model,
          year: values.year,
          color: values.color,
          vin: values.vin,
          license_plate: values.license_plate,
          vehicle_type: values.vehicle_type,
          mileage: values.mileage || 0,
        });
        toast({
          title: "Success",
          description: "Vehicle updated successfully",
        });
      } else {
        await addVehicle({
          make: values.make,
          model: values.model,
          year: values.year,
          color: values.color,
          vin: values.vin,
          license_plate: values.license_plate,
          vehicle_type: values.vehicle_type,
          mileage: values.mileage || 0,
        }, customerId);
        toast({
          title: "Success",
          description: "Vehicle added successfully",
        });
      }
      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save vehicle",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="make"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Make</FormLabel>
                <FormControl>
                  <Input placeholder="Toyota, Ford, etc." {...field} />
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
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input placeholder="Camry, F-150, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="2023" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Input placeholder="Red, Blue, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="vehicle_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
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

        <FormField
          control={form.control}
          name="vin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>VIN (optional)</FormLabel>
              <FormControl>
                <Input placeholder="17-character VIN" {...field} />
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
              <FormLabel>License Plate (optional)</FormLabel>
              <FormControl>
                <Input placeholder="ABC123" {...field} />
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
              <FormLabel>Mileage (optional)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="50000" 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            type="button" 
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={form.formState.isSubmitting}
          >
            {isEditing ? 'Update Vehicle' : 'Add Vehicle'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
