
import { useFetchVehicles } from './useFetchVehicles';
import { useAddVehicle } from './useAddVehicle';
import { useUpdateVehicle } from './useUpdateVehicle';
import { useRemoveVehicle } from './useRemoveVehicle';

export const useVehicleCrud = () => {
  const { fetchVehicles } = useFetchVehicles();
  const { addVehicle } = useAddVehicle();
  const { updateVehicle } = useUpdateVehicle();
  const { removeVehicle } = useRemoveVehicle();

  return {
    fetchVehicles,
    addVehicle,
    updateVehicle,
    removeVehicle
  };
};
