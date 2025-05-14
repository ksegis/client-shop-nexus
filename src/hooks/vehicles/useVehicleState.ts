
import { useState } from 'react';
import { Vehicle } from '@/types/vehicle';

export const useVehicleState = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const updateVehicleState = (updatedVehicles: Vehicle[]) => {
    setVehicles(updatedVehicles);
  };

  const addVehicleToState = (newVehicle: Vehicle) => {
    setVehicles(prev => [newVehicle, ...prev]);
  };

  const updateVehicleInState = (id: string, updatedVehicle: Vehicle) => {
    setVehicles(prev => prev.map(vehicle => 
      vehicle.id === id ? updatedVehicle : vehicle
    ));
  };

  const removeVehicleFromState = (id: string) => {
    setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
  };

  return {
    vehicles,
    loading,
    setLoading,
    updateVehicleState,
    addVehicleToState,
    updateVehicleInState,
    removeVehicleFromState
  };
};
