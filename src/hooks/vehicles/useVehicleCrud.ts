
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Vehicle } from '@/types/vehicle';

export const useVehicleCrud = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVehicles = async (userId?: string): Promise<Vehicle[]> => {
    const currentUserId = userId || user?.id;
    
    if (!currentUserId) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Ensure all data is properly typed
      const typedVehicles: Vehicle[] = data?.map(vehicle => ({
        ...vehicle,
        year: vehicle.year.toString() // Convert number to string to match our interface
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

  const addVehicle = async (
    vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'owner_id' | 'images'>, 
    ownerId?: string
  ) => {
    // Use provided ownerId or fall back to current user (for customer-facing scenario)
    const effectiveOwnerId = ownerId || user?.id;
    
    if (!effectiveOwnerId) {
      toast({
        title: 'Owner ID required',
        description: 'A vehicle must be associated with a customer',
        variant: 'destructive',
      });
      throw new Error('Owner ID is required');
    }

    try {
      console.log('Adding vehicle with owner ID:', effectiveOwnerId);
      
      // Convert year to number for database insertion
      const dbVehicleData = {
        ...vehicleData,
        year: parseInt(vehicleData.year, 10), // Convert string to number explicitly
        owner_id: effectiveOwnerId // This is crucial for RLS - set owner_id to the customer's ID
      };

      console.log('Vehicle data to insert:', dbVehicleData);

      const { data, error } = await supabase
        .from('vehicles')
        .insert(dbVehicleData)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      // Convert back to our interface format
      const newVehicle: Vehicle = {
        ...data,
        year: data.year.toString() // Convert number back to string
      };
      
      toast({
        title: 'Vehicle added',
        description: `${vehicleData.year} ${vehicleData.make} ${vehicleData.model} added successfully`,
      });
      
      return newVehicle;
    } catch (error: any) {
      console.error('Full error adding vehicle:', error);
      toast({
        title: 'Error adding vehicle',
        description: error.message || 'Failed to add vehicle',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateVehicle = async (id: string, vehicleData: Partial<Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'owner_id'>>) => {
    try {
      // Convert year to number if it's included in the update data
      const dbVehicleData: any = { ...vehicleData };
      if (vehicleData.year) {
        dbVehicleData.year = Number(vehicleData.year); // Convert string to number explicitly
      }

      const { data, error } = await supabase
        .from('vehicles')
        .update(dbVehicleData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Convert back to our interface format
      const updatedVehicle: Vehicle = {
        ...data,
        year: data.year.toString() // Convert number back to string
      };
      
      toast({
        title: 'Vehicle updated',
        description: `Vehicle information updated successfully`,
      });
      
      return updatedVehicle;
    } catch (error: any) {
      toast({
        title: 'Error updating vehicle',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const removeVehicle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Vehicle removed',
        description: 'Vehicle has been removed from your account',
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: 'Error removing vehicle',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    fetchVehicles,
    addVehicle,
    updateVehicle,
    removeVehicle
  };
};
