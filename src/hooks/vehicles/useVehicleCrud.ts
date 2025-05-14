
import { useState } from 'react';
import { Vehicle, NewVehicleData } from '@/types/vehicle';
import { useVehicles } from './useFetchVehicles';
import { useAddVehicle } from './useAddVehicle';
import { useUpdateVehicle } from './useUpdateVehicle';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useVehicleCrud() {
  const { vehicles, loading: fetchLoading, error: fetchError, fetchVehicles } = useVehicles();
  const { addVehicle, loading: addLoading } = useAddVehicle();
  const { updateVehicle, loading: updateLoading } = useUpdateVehicle();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteVehicle = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh the vehicles list
      await fetchVehicles();
      
      toast({
        title: "Vehicle deleted",
        description: "Vehicle has been removed successfully"
      });
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete vehicle';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Error deleting vehicle",
        description: errorMessage
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    vehicles,
    loading: loading || fetchLoading || addLoading || updateLoading,
    error: error || fetchError,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    fetchVehicles
  };
}
