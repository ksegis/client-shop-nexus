
import { useEffect } from 'react';
import { Vehicle, NewVehicleData } from '@/types/vehicle';
import { useAuth } from '@/contexts/auth';
import { useVehicleCrud } from './useVehicleCrud';
import { useVehicleImages } from './useVehicleImages';
import { useMockVehicles } from './useMockVehicles';
import { useVehicleState } from './useVehicleState';

export const useVehicleManagement = () => {
  const { user } = useAuth();
  const { 
    vehicles, 
    loading, 
    setLoading,
    updateVehicleState,
    addVehicleToState,
    updateVehicleInState,
    removeVehicleFromState
  } = useVehicleState();
  
  const { 
    fetchVehicles, 
    addVehicle: addVehicleBase, 
    updateVehicle: updateVehicleBase,
    deleteVehicle: removeVehicleBase
  } = useVehicleCrud();
  
  const {
    uploadVehicleImage,
    removeVehicleImage
  } = useVehicleImages();

  const { getMockVehicles, createMockVehicle } = useMockVehicles();

  const fetchAndSetVehicles = async (ownerId?: string) => {
    const userIdToFetch = ownerId || user?.id;
    
    if (!userIdToFetch) {
      setLoading(false);
      return;
    }

    // Handle mock user ID scenario
    if (userIdToFetch === 'mock-user-id') {
      const mockVehicles = getMockVehicles();
      updateVehicleState(mockVehicles);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fetchedVehicles = await fetchVehicles();
      updateVehicleState(fetchedVehicles || []);
    } finally {
      setLoading(false);
    }
  };

  // Modified to handle the type conversion correctly
  const addVehicle = async (
    vehicleData: NewVehicleData,
    customerId?: string
  ) => {
    // For mock user, add to local state only
    if (user?.id === 'mock-user-id' || customerId === 'mock-user-id') {
      const ownerId = customerId || user?.id || 'mock-user-id';
      const mockVehicle = createMockVehicle(vehicleData, ownerId);
      addVehicleToState(mockVehicle);
      return true;
    }
    
    // Convert NewVehicleData to the format expected by addVehicleBase
    // by adding required properties for Vehicle type and ensuring vin is not optional
    const fullVehicleData = {
      ...vehicleData,
      owner_id: customerId || user?.id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      vin: vehicleData.vin || '', // Ensure vin is always a string, never undefined
      license_plate: vehicleData.license_plate || '', // Same for license_plate
      images: vehicleData.images || [] // Ensure images is always an array
    };
    
    const newVehicle = await addVehicleBase(fullVehicleData);
    
    // If we're adding a vehicle for the current user or for the customer we're viewing,
    // add it to the state
    if (!customerId || (user?.id && customerId === user.id)) {
      addVehicleToState(newVehicle);
    }
    
    return true;
  };

  const updateVehicle = async (id: string, vehicleData: Partial<Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'owner_id'>>) => {
    // For mock vehicles, update locally
    if (user?.id === 'mock-user-id' || id.startsWith('mock-vehicle')) {
      const updatedVehicle = {
        ...vehicles.find(v => v.id === id)!,
        ...vehicleData,
        updated_at: new Date().toISOString()
      };
      updateVehicleInState(id, updatedVehicle);
      return true;
    }
    
    const updatedVehicle = await updateVehicleBase(id, vehicleData);
    updateVehicleInState(id, updatedVehicle);
    return true;
  };

  const removeVehicle = async (id: string) => {
    // For mock vehicles, remove locally
    if (user?.id === 'mock-user-id' || id.startsWith('mock-vehicle')) {
      removeVehicleFromState(id);
      return true;
    }
    
    const success = await removeVehicleBase(id);
    if (success) {
      removeVehicleFromState(id);
    }
    return success;
  };

  useEffect(() => {
    fetchAndSetVehicles();
  }, [user?.id]);

  return { 
    vehicles, 
    loading, 
    addVehicle,
    updateVehicle,
    removeVehicle,
    uploadVehicleImage,
    removeVehicleImage,
    refreshVehicles: fetchAndSetVehicles
  };
};
