
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Vehicle } from '@/types/vehicle';
import { useState } from 'react';
import EditVehicleDialog from './EditVehicleDialog';

interface VehiclesListProps {
  vehicles: Vehicle[];
  onRemoveVehicle: (id: string) => Promise<boolean>;
  onUpdateVehicle: (id: string, vehicleData: Partial<Vehicle>) => Promise<boolean>;
}

const VehiclesList = ({ vehicles, onRemoveVehicle, onUpdateVehicle }: VehiclesListProps) => {
  const { toast } = useToast();
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  
  if (vehicles.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No vehicles yet. Add your first vehicle to get started.
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {vehicles.map((vehicle) => (
        <div 
          key={vehicle.id} 
          className="p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50"
        >
          <div>
            <h3 className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
            <p className="text-sm text-gray-500">VIN: {vehicle.vin || 'Not provided'}</p>
            {vehicle.license_plate && (
              <p className="text-sm text-gray-500">License Plate: {vehicle.license_plate}</p>
            )}
            {vehicle.color && (
              <p className="text-sm text-gray-500">Color: {vehicle.color}</p>
            )}
          </div>
          
          <div className="space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setEditingVehicle(vehicle)}
            >
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-500 hover:text-red-700"
              onClick={() => onRemoveVehicle(vehicle.id)}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}

      {editingVehicle && (
        <EditVehicleDialog
          open={!!editingVehicle}
          onOpenChange={(open) => {
            if (!open) setEditingVehicle(null);
          }}
          vehicle={editingVehicle}
          onUpdateVehicle={onUpdateVehicle}
        />
      )}
    </div>
  );
};

export default VehiclesList;
