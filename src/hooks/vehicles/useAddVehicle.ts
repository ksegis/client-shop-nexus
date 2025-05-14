
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/components/ui/use-toast';
import { Vehicle } from '@/types/vehicle';

export const useAddVehicle = () => {
  const { user } = useAuth();
  const { toast } = useToast();

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
    
    // Handle mock user case
    if (effectiveOwnerId === 'mock-user-id') {
      const mockVehicle: Vehicle = {
        id: `mock-vehicle-${Date.now()}`,
        ...vehicleData,
        owner_id: 'mock-user-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      toast({
        title: 'Vehicle added',
        description: `${vehicleData.year} ${vehicleData.make} ${vehicleData.model} added successfully`,
      });
      
      return mockVehicle;
    }

    try {
      console.log('Adding vehicle with owner ID:', effectiveOwnerId);
      
      // Convert year to number for database insertion
      const dbVehicleData = {
        ...vehicleData,
        year: parseInt(vehicleData.year, 10), // Convert string to number explicitly
        mileage: vehicleData.mileage, // Include mileage
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
        year: data.year.toString(), // Convert number back to string
        mileage: data.mileage // Include mileage
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

  return { addVehicle };
};
