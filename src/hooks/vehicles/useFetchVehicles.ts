
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types/vehicle';
import { useToast } from '@/components/ui/use-toast';

export const useFetchVehicles = () => {
  const { toast } = useToast();
  
  const fetchVehicles = async (ownerId: string): Promise<Vehicle[]> => {
    // Mock user case
    if (ownerId === 'mock-user-id') {
      const mockVehicles: Vehicle[] = [
        {
          id: 'mock-vehicle-1',
          owner_id: 'mock-user-id',
          year: 2020,
          make: 'Tesla',
          model: 'Model 3',
          color: 'Red',
          vin: 'MOCK12345678901',
          license_plate: 'MOCK123',
          vehicle_type: 'car',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          images: [],
          mileage: 12000
        },
        {
          id: 'mock-vehicle-2',
          owner_id: 'mock-user-id',
          year: 2019,
          make: 'Ford',
          model: 'F-150',
          color: 'Blue',
          vin: 'MOCK98765432101',
          license_plate: 'MOCK456',
          vehicle_type: 'truck',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          images: [],
          mileage: 25000
        }
      ];
      
      return mockVehicles;
    }
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Convert to our Vehicle interface
      const vehicles: Vehicle[] = data.map(item => ({
        ...item,
        mileage: item.mileage, // Ensure mileage is properly included
        images: item.images || []
      }));
      
      return vehicles;
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: 'Error fetching vehicles',
        description: error.message || 'Failed to fetch vehicles',
        variant: 'destructive',
      });
      return [];
    }
  };
  
  return { fetchVehicles };
};
