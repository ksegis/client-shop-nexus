import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useAddVehicle = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>): Promise<Vehicle | null> => {
    setLoading(true);
    try {
      // Normalize the vehicle data to remove mileage
      const normalizedVehicleData = normalizeVehicleData(vehicleData);

      const { data, error } = await supabase
        .from('vehicles')
        .insert([normalizedVehicleData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Vehicle added successfully.',
      });

      return data as Vehicle;
    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Just fixing the mileage property issue by removing references to it
  const normalizeVehicleData = (data: any) => {
    const { mileage, ...rest } = data;
    return rest;
  };

  return { addVehicle, loading };
};
