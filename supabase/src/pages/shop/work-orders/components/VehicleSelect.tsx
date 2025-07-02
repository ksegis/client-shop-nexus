
import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { WorkOrderFormValues } from '../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { FormFieldWrapper } from './FormField';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  owner_id: string;
}

interface VehicleSelectProps {
  form: UseFormReturn<WorkOrderFormValues>;
  loading: boolean;
  selectedCustomerId: string;
}

export const VehicleSelect = ({
  form,
  loading,
  selectedCustomerId,
}: VehicleSelectProps) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!selectedCustomerId) {
        setVehicles([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('id, make, model, year, owner_id')
          .eq('owner_id', selectedCustomerId)
          .order('make', { ascending: true });
        
        if (error) throw error;
        setVehicles(data || []);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };
    
    fetchVehicles();
  }, [selectedCustomerId]);

  return (
    <FormFieldWrapper
      form={form}
      name="vehicle_id"
      label="Vehicle"
    >
      <Select
        onValueChange={form.setValue.bind(null, 'vehicle_id')}
        defaultValue={form.getValues('vehicle_id')}
        disabled={!selectedCustomerId || loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={selectedCustomerId ? "Select vehicle" : "Select customer first"} />
        </SelectTrigger>
        <SelectContent>
          {vehicles.map((vehicle) => (
            <SelectItem key={vehicle.id} value={vehicle.id}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormFieldWrapper>
  );
};
