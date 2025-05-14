
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types/vehicle';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchVehicles = async () => {
    if (!user) {
      setVehicles([]);
      return [];
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setVehicles(data as Vehicle[]);
      return data as Vehicle[];
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch vehicles';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Error fetching vehicles",
        description: errorMessage
      });
      
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user]);

  return {
    vehicles,
    loading,
    error,
    fetchVehicles
  };
}
