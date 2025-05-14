import { useState, useEffect } from 'react';
import { Vehicle } from '@/types/vehicle';
import { useAuth } from '@/contexts/auth';
import { useVehicleCrud } from './useVehicleCrud';
import { useVehicleImages } from './useVehicleImages';

export const useVehicleManagement = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();
  
  const { 
    fetchVehicles, 
    addVehicle: addVehicleBase, 
    updateVehicle: updateVehicleBase,
    removeVehicle: removeVehicleBase
  } = useVehicleCrud();
  
  const {
    uploadVehicleImage,
    removeVehicleImage
  } = useVehicleImages();

  const fetchAndSetVehicles = async (ownerId?: string) => {
    const userIdToFetch = ownerId || user?.id;
    
    if (!userIdToFetch) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fetchedVehicles = await fetchVehicles(userIdToFetch);
      setVehicles(fetchedVehicles);
    } finally {
      setLoading(false);
    }
  };

  const addVehicle = async (
    vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'owner_id' | 'images'>,
    customerId?: string
  ) => {
    const newVehicle = await addVehicleBase(vehicleData, customerId);
    
    // If we're adding a vehicle for the current user or for the customer we're viewing,
    // add it to the state
    if (!customerId || (user?.id && customerId === user.id)) {
      setVehicles(prev => [newVehicle, ...prev]);
    }
    
    return true;
  };

  const updateVehicle = async (id: string, vehicleData: Partial<Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'owner_id'>>) => {
    const updatedVehicle = await updateVehicleBase(id, vehicleData);
    setVehicles(prev => prev.map(vehicle => vehicle.id === id ? updatedVehicle : vehicle));
    return true;
  };

  const removeVehicle = async (id: string) => {
    const success = await removeVehicleBase(id);
    if (success) {
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
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
