
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Vehicle, NewVehicleData } from '@/types/vehicle';
import { useAuth } from '@/contexts/AuthContext';

export const useVehicleManagement = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    async function fetchVehicles() {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('owner_id', user.id);
          
        if (error) throw error;
        
        // Convert year to string to match the Vehicle interface
        const formattedData = data?.map(vehicle => ({
          ...vehicle,
          year: vehicle.year.toString() // Convert number to string
        })) || [];
        
        setVehicles(formattedData);
      } catch (error: any) {
        console.error('Error fetching vehicles:', error);
        toast({
          variant: "destructive",
          title: "Failed to load vehicles",
          description: error.message
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchVehicles();
  }, [user, toast]);

  const addVehicle = async (newVehicle: NewVehicleData) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          owner_id: user.id,
          make: newVehicle.make,
          model: newVehicle.model,
          year: parseInt(newVehicle.year) || new Date().getFullYear(),
          vin: newVehicle.vin,
          vehicle_type: newVehicle.vehicle_type,
          color: newVehicle.color || null,
          license_plate: newVehicle.license_plate || null
        })
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Convert the returned data to match our Vehicle interface
        const addedVehicle: Vehicle = {
          ...data[0],
          year: data[0].year.toString() // Convert year to string
        };
        setVehicles(prev => [...prev, addedVehicle]);
      }
      
      toast({
        title: "Vehicle Added",
        description: "Your vehicle has been added to your profile."
      });
      
      return true;
    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      toast({
        variant: "destructive",
        title: "Failed to add vehicle",
        description: error.message
      });
      return false;
    }
  };
  
  const removeVehicle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
      
      toast({
        title: "Vehicle Removed",
        description: "The vehicle has been removed from your profile."
      });
      
      return true;
    } catch (error: any) {
      console.error('Error removing vehicle:', error);
      toast({
        variant: "destructive",
        title: "Failed to remove vehicle",
        description: error.message
      });
      return false;
    }
  };

  return {
    vehicles,
    loading,
    addVehicle,
    removeVehicle
  };
};
