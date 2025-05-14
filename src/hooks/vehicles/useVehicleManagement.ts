
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

    // Handle mock user ID scenario
    if (userIdToFetch === 'mock-user-id') {
      const mockVehicles: Vehicle[] = [
        {
          id: 'mock-vehicle-1',
          make: 'Toyota',
          model: 'Camry',
          year: '2020',
          vehicle_type: 'car',
          color: 'Silver',
          license_plate: 'ABC123',
          vin: '1HGBH41JXMN109186',
          owner_id: 'mock-user-id',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'mock-vehicle-2',
          make: 'Honda',
          model: 'Civic',
          year: '2019',
          vehicle_type: 'car',
          color: 'Blue',
          license_plate: 'XYZ789',
          vin: '2FMDK3GC4BBA52681',
          owner_id: 'mock-user-id',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setVehicles(mockVehicles);
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
    // For mock user, add to local state only
    if (user?.id === 'mock-user-id' || customerId === 'mock-user-id') {
      const mockVehicle: Vehicle = {
        id: `mock-vehicle-${Date.now()}`,
        ...vehicleData,
        owner_id: customerId || user?.id || 'mock-user-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setVehicles(prev => [mockVehicle, ...prev]);
      return true;
    }
    
    const newVehicle = await addVehicleBase(vehicleData, customerId);
    
    // If we're adding a vehicle for the current user or for the customer we're viewing,
    // add it to the state
    if (!customerId || (user?.id && customerId === user.id)) {
      setVehicles(prev => [newVehicle, ...prev]);
    }
    
    return true;
  };

  const updateVehicle = async (id: string, vehicleData: Partial<Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'owner_id'>>) => {
    // For mock vehicles, update locally
    if (user?.id === 'mock-user-id' || id.startsWith('mock-vehicle')) {
      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === id ? { ...vehicle, ...vehicleData, updated_at: new Date().toISOString() } : vehicle
      ));
      return true;
    }
    
    const updatedVehicle = await updateVehicleBase(id, vehicleData);
    setVehicles(prev => prev.map(vehicle => vehicle.id === id ? updatedVehicle : vehicle));
    return true;
  };

  const removeVehicle = async (id: string) => {
    // For mock vehicles, remove locally
    if (user?.id === 'mock-user-id' || id.startsWith('mock-vehicle')) {
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
      return true;
    }
    
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
