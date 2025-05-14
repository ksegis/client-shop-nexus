
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types/vehicle';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';

// Helper function to check if a userId is a valid UUID
const isValidUuid = (id: string): boolean => {
  return id?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) !== null;
};

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
    
    // For non-UUID user IDs (mock or test users), return mock vehicles
    if (!isValidUuid(user.id)) {
      console.log(`Using mock vehicles data for non-UUID user ID: ${user.id}`);
      
      // Return mock vehicles data for test/mock users
      const mockVehicles: Vehicle[] = [
        {
          id: 'mock-vehicle-1',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          owner_id: user.id,
          vehicle_type: 'car',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          color: 'Blue',
          images: []
        },
        {
          id: 'mock-vehicle-2',
          make: 'Honda',
          model: 'CR-V',
          year: 2019,
          owner_id: user.id,
          vehicle_type: 'suv',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          color: 'Red',
          images: []
        }
      ];
      
      setVehicles(mockVehicles);
      setLoading(false);
      return mockVehicles;
    }
    
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
