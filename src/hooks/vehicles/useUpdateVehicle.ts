
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types/vehicle';
import { toast } from '@/hooks/use-toast';

export function useUpdateVehicle() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateVehicle = async (id: string, vehicleData: Partial<Vehicle>) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update(vehicleData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Vehicle updated",
        description: "Vehicle has been updated successfully"
      });
      
      return data as Vehicle;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update vehicle';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Error updating vehicle",
        description: errorMessage
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateVehicle,
    loading,
    error
  };
}
