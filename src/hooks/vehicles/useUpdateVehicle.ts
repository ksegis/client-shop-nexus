
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Vehicle } from '@/types/vehicle';

export const useUpdateVehicle = () => {
  const { toast } = useToast();

  const updateVehicle = async (id: string, vehicleData: Partial<Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'owner_id'>>) => {
    try {
      // Convert year to number if it's included in the update data
      const dbVehicleData: any = { ...vehicleData };
      if (vehicleData.year) {
        dbVehicleData.year = Number(vehicleData.year); // Convert string to number explicitly
      }

      const { data, error } = await supabase
        .from('vehicles')
        .update(dbVehicleData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Convert back to our interface format
      const updatedVehicle: Vehicle = {
        ...data,
        year: data.year.toString(), // Convert number back to string
        mileage: data.mileage // Include mileage
      };
      
      toast({
        title: 'Vehicle updated',
        description: `Vehicle information updated successfully`,
      });
      
      return updatedVehicle;
    } catch (error: any) {
      toast({
        title: 'Error updating vehicle',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return { updateVehicle };
};
