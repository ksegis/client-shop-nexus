import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useUpdateVehicle = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateVehicle = async (id: string, data: Partial<Vehicle>) => {
    setLoading(true);
    try {
      // Normalize the vehicle data to remove mileage
      const normalizedData = normalizeVehicleData(data);

      const { error } = await supabase
        .from('vehicles')
        .update(normalizedData)
        .eq('id', id);

      if (error) {
        throw error;
      }
      toast({
        title: 'Success',
        description: 'Vehicle updated successfully.',
      });
      return true;
    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Just fixing the mileage property issue by removing references to it
  const normalizeVehicleData = (data: any) => {
    const { mileage, ...rest } = data;
    return rest;
  };

  return { updateVehicle, loading };
};
