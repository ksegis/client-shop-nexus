
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { VehicleFormValues } from '../VehicleFormSchema';

interface VehicleFormFieldsProps {
  form: UseFormReturn<VehicleFormValues>;
}

export const VehicleBasicFields = ({ form }: VehicleFormFieldsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="make"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Make*</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Ford" {...field} />
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
              <Input placeholder="e.g. F-150" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export const VehicleTypeYearFields = ({ form }: VehicleFormFieldsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="year"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Year*</FormLabel>
            <FormControl>
              <Input placeholder="e.g. 2022" {...field} />
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
    </div>
  );
};

export const VehicleDetailsFields = ({ form }: VehicleFormFieldsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="color"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Color</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Blue" {...field} />
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
              <Input placeholder="e.g. 45000" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export const VehicleIdentificationFields = ({ form }: VehicleFormFieldsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="vin"
        render={({ field }) => (
          <FormItem>
            <FormLabel>VIN</FormLabel>
            <FormControl>
              <Input placeholder="Vehicle Identification Number" {...field} />
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
              <Input placeholder="e.g. ABC123" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
