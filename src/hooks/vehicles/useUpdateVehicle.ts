
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Vehicle } from '@/types/vehicle';

export const useUpdateVehicle = () => {
  const { toast } = useToast();
  
  const updateVehicle = async (
    id: string, 
    vehicleData: Partial<Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'owner_id'>>,
  ): Promise<Vehicle> => {
    // Handle mock vehicle case
    if (id.startsWith('mock-vehicle')) {
      const mockUpdatedVehicle: Vehicle = {
        id,
        owner_id: 'mock-user-id',
        year: vehicleData.year || 2020,
        make: vehicleData.make || 'Mock Make',
        model: vehicleData.model || 'Mock Model',
        color: vehicleData.color || 'Silver',
        vin: vehicleData.vin || 'MOCK123456789',
        license_plate: vehicleData.license_plate || 'MOCK123',
        vehicle_type: vehicleData.vehicle_type || 'car',
        images: vehicleData.images || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        mileage: vehicleData.mileage
      };
      
      toast({
        title: 'Vehicle updated',
        description: `${mockUpdatedVehicle.year} ${mockUpdatedVehicle.make} ${mockUpdatedVehicle.model} updated successfully`,
      });
      
      return mockUpdatedVehicle;
    }
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update(vehicleData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      const updatedVehicle: Vehicle = {
        ...data,
        color: data.color || 'Unknown',
        license_plate: data.license_plate || '',
        vin: data.vin || '',
        mileage: data.mileage || undefined,
        images: data.images || []
      };
      
      toast({
        title: 'Vehicle updated',
        description: `${updatedVehicle.year} ${updatedVehicle.make} ${updatedVehicle.model} updated successfully`,
      });
      
      return updatedVehicle;
    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      toast({
        title: 'Error updating vehicle',
        description: error.message || 'Failed to update vehicle',
      });
      throw error;
    }
  };
  
  return { updateVehicle };
};
