import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/components/ui/use-toast';
import { Database } from '@/integrations/supabase/types';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    
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
        toast({
          title: 'Error fetching vehicles',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [user, toast]);

  const addVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'owner_id'>) => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          ...vehicleData,
          owner_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setVehicles(prev => [data, ...prev]);
      
      toast({
        title: 'Vehicle added',
        description: `${vehicleData.year} ${vehicleData.make} ${vehicleData.model} added successfully`,
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: 'Error adding vehicle',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  const updateVehicle = async (id: string, vehicleData: Partial<Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'owner_id'>>) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update(vehicleData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      setVehicles(prev => prev.map(vehicle => vehicle.id === id ? data : vehicle));
      
      toast({
        title: 'Vehicle updated',
        description: `Vehicle information updated successfully`,
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: 'Error updating vehicle',
        description: error.message,
        variant: 'destructive',
      });
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
      
      toast({
        title: 'Vehicle removed',
        description: 'Vehicle has been removed from your account',
      });
    } catch (error: any) {
      toast({
        title: 'Error removing vehicle',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    vehicles,
    loading,
    addVehicle,
    updateVehicle,
    deleteVehicle
  };
};
