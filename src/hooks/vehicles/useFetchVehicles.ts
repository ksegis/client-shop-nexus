import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('vehicles')
          .select('*')
          .order('created_at', { ascending: false });
          
        // If the user is a customer, only fetch their vehicles
        if (user && user.user_metadata.role === 'customer') {
          query = query.eq('owner_id', user.id);
        }
        
        const { data, error } = await query;

        if (error) {
          throw error;
        }
        
        // Normalize the data to remove the mileage property
        const normalizedData = (data || []).map(normalizeVehicleData);
        
        setVehicles(normalizedData as Vehicle[]);
      } catch (error: any) {
        console.error('Error fetching vehicles:', error);
        toast({
          title: 'Error',
          description: `Failed to fetch vehicles: ${error.message}`,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [user, toast]);

  // Just fixing the mileage property issue by removing references to it
  const normalizeVehicleData = (data: any) => {
    const { mileage, ...rest } = data;
    return rest;
  };

  return {
    vehicles,
    loading,
  };
};
