
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Vehicle } from '@/types/vehicle';

export const useVehicleManagement = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVehicles = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Ensure all data is properly typed
      const typedVehicles: Vehicle[] = data?.map(vehicle => ({
        ...vehicle,
        year: vehicle.year.toString() // Convert number to string to match our interface
      })) || [];
      
      setVehicles(typedVehicles);
    } catch (error: any) {
      toast({
        title: 'Error fetching vehicles',
        description: error.message,
        variant: 'destructive',
      });
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const addVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'owner_id' | 'images'>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      // Convert year to number for database insertion
      const dbVehicleData = {
        ...vehicleData,
        year: parseInt(vehicleData.year), // This converts string to number
        owner_id: user.id
      };

      const { data, error } = await supabase
        .from('vehicles')
        .insert(dbVehicleData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Convert back to our interface format
      const newVehicle: Vehicle = {
        ...data,
        year: data.year.toString() // Convert number back to string
      };
      
      setVehicles(prev => [newVehicle, ...prev]);
      
      toast({
        title: 'Vehicle added',
        description: `${vehicleData.year} ${vehicleData.make} ${vehicleData.model} added successfully`,
      });
      
      return true;
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
      // Convert year to number if it's included in the update data
      const dbVehicleData = { ...vehicleData };
      if (vehicleData.year) {
        dbVehicleData.year = parseInt(vehicleData.year); // Convert string to number
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
      
      setVehicles(prev => prev.map(vehicle => vehicle.id === id ? updatedVehicle : vehicle));
      
      toast({
        title: 'Vehicle updated',
        description: `Vehicle information updated successfully`,
      });
      
      return true;
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
      
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
      
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

  const uploadVehicleImage = async (vehicleId: string, file: File) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${vehicleId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `vehicle-images/${fileName}`;
      
      // Check if vehicle_images bucket exists, if not handle gracefully
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('vehicle_images');
      if (bucketError) {
        console.log('Bucket does not exist or other error:', bucketError);
        toast({
          title: 'Storage not configured',
          description: 'Vehicle image storage is not configured yet.',
          variant: 'destructive',
        });
        return null;
      }
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('vehicle_images')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('vehicle_images')
        .getPublicUrl(filePath);
      
      // Get current vehicle images
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('images')
        .eq('id', vehicleId)
        .single();
      
      if (vehicleError) throw vehicleError;
      
      // Update vehicle with new image URL
      const images = vehicleData.images || [];
      images.push(urlData.publicUrl);
      
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ images })
        .eq('id', vehicleId);
      
      if (updateError) throw updateError;
      
      // Refresh vehicles list
      await fetchVehicles();
      
      return urlData.publicUrl;
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const removeVehicleImage = async (vehicleId: string, imageUrl: string) => {
    try {
      // Get current vehicle images
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('images')
        .eq('id', vehicleId)
        .single();
      
      if (vehicleError) throw vehicleError;
      
      // Update vehicle with new image URLs (remove the selected one)
      const images = (vehicleData.images || []).filter(url => url !== imageUrl);
      
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ images })
        .eq('id', vehicleId);
      
      if (updateError) throw updateError;
      
      // Refresh vehicles list
      await fetchVehicles();
    } catch (error: any) {
      toast({
        title: 'Remove image failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user?.id]);

  return { 
    vehicles, 
    loading, 
    addVehicle, 
    updateVehicle, 
    removeVehicle,
    uploadVehicleImage,
    removeVehicleImage,
    refreshVehicles: fetchVehicles 
  };
};
