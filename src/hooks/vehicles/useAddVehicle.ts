
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types/vehicle';
import { toast } from '@/hooks/use-toast';

export function useAddVehicle() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addVehicle = async (vehicleData: Omit<Vehicle, 'id'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Vehicle added",
        description: "Vehicle has been added successfully"
      });
      
      return data as Vehicle;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add vehicle';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Error adding vehicle",
        description: errorMessage
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    addVehicle,
    loading,
    error
  };
}
