// Re-export from the vehicles index file
export { useVehicles, useAddVehicle, useUpdateVehicle } from './vehicles';

// Optional: If there's additional functionality needed in this file,
// we can implement it here.
import { Vehicle } from '@/types/vehicle';
import { useState } from 'react';
import { useVehicles as useFetchVehiclesHook } from './vehicles';

// This hook provides a simplified interface for vehicle management
export function useVehicleManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { vehicles, fetchVehicles } = useFetchVehiclesHook();

  // Remove a vehicle by ID
  const removeVehicle = (id: string) => {
    setLoading(true);
    try {
      // Update state to remove the vehicle
      setVehicles((prevVehicles) => prevVehicles.filter((vehicle) => vehicle.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to remove vehicle');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update vehicles state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  return {
    vehicles,
    loading,
    error,
    removeVehicle,
    refreshVehicles: fetchVehicles
  };
}
