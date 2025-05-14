
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/components/ui/use-toast';
import { Vehicle } from '@/types/vehicle';

export const useFetchVehicles = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVehicles = async (userId?: string): Promise<Vehicle[]> => {
    const currentUserId = userId || user?.id;
    
    if (!currentUserId) {
      return [];
    }
    
    // Handle mock user ID case
    if (currentUserId === 'mock-user-id') {
      console.log('Using mock data for vehicles');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Ensure all data is properly typed with explicit mileage handling
      const typedVehicles: Vehicle[] = data?.map(vehicle => ({
        ...vehicle,
        year: Number(vehicle.year),
        mileage: vehicle.mileage
      })) || [];
      
      return typedVehicles;
    } catch (error: any) {
      toast({
        title: 'Error fetching vehicles',
        description: error.message,
        variant: 'destructive',
      });
      console.error('Error fetching vehicles:', error);
      return [];
    }
  };

  return { fetchVehicles };
};
