
import { useState, useEffect } from 'react';
import { Vehicle, NewVehicleData } from '@/types/vehicle';
import { useAddVehicle } from './vehicles/useAddVehicle';
import { useFetchVehicles } from './vehicles/useFetchVehicles';
import { useUpdateVehicle } from './vehicles/useUpdateVehicle';
import { useRemoveVehicle } from './vehicles/useRemoveVehicle';
import { useAuth } from '@/contexts/auth';

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();
  
  const { fetchVehicles } = useFetchVehicles();
  const { addVehicle: addVehicleToDb } = useAddVehicle();
  const { updateVehicle: updateVehicleInDb } = useUpdateVehicle();
  const { removeVehicle } = useRemoveVehicle();
  
  const loadVehicles = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const fetchedVehicles = await fetchVehicles(user.id);
      setVehicles(fetchedVehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const addVehicle = async (vehicleData: NewVehicleData) => {
    const newVehicle = await addVehicleToDb(vehicleData);
    setVehicles(prevVehicles => [newVehicle, ...prevVehicles]);
    return newVehicle;
  };
  
  const updateVehicle = async (id: string, vehicleData: Partial<NewVehicleData>) => {
    const updatedVehicle = await updateVehicleInDb(id, vehicleData);
    setVehicles(prevVehicles => 
      prevVehicles.map(vehicle => vehicle.id === id ? updatedVehicle : vehicle)
    );
    return updatedVehicle;
  };
  
  const deleteVehicle = async (id: string) => {
    await removeVehicle(id);
    setVehicles(prevVehicles => prevVehicles.filter(vehicle => vehicle.id !== id));
  };
  
  useEffect(() => {
    loadVehicles();
  }, [user?.id]);
  
  return {
    vehicles,
    loading,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    refreshVehicles: loadVehicles
  };
};
