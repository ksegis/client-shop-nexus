
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types/vehicle';
import { useToast } from '@/hooks/use-toast';

export function useVehicleManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vehicles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select()
        .single();

      if (error) throw error;

      setVehicles(prev => [data, ...prev]);
      return data;
    } catch (error: any) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  };

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === id ? data : vehicle
      ));
      return data;
    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
    } catch (error: any) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchVehicles();

    // Set up real-time subscription
    const channel = supabase
      .channel('vehicles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles'
        },
        () => {
          fetchVehicles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    vehicles,
    loading,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    refetch: fetchVehicles
  };
}
