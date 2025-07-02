
import { useState } from 'react';
import { Vehicle } from '@/types/vehicle';
import { useVehicles as useFetchVehiclesHook } from './vehicles';
import { useVehicleManagement as useRefactoredVehicleManagement } from './vehicles/useVehicleManagement';

// Re-export the refactored hook with same functionality
export const useVehicleManagement = useRefactoredVehicleManagement;

// Legacy implementation - can be removed after migration is complete
// This hook provides a simplified interface for vehicle management
export function useLegacyVehicleManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { vehicles: fetchedVehicles, fetchVehicles } = useFetchVehiclesHook();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

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

  return {
    vehicles: fetchedVehicles || vehicles,
    loading,
    error,
    removeVehicle,
    refreshVehicles: fetchVehicles
  };
}
