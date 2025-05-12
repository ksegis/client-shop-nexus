
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Vehicle } from '@/types/vehicle';

interface VehiclesListProps {
  vehicles: Vehicle[];
  onRemoveVehicle: (id: string) => Promise<boolean>;
}

const VehiclesList = ({ vehicles, onRemoveVehicle }: VehiclesListProps) => {
  const { toast } = useToast();
  
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
          </div>
          
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={() => {
              // Future implementation: Edit vehicle
              toast({
                title: "Coming Soon",
                description: "Vehicle editing will be available in a future update."
              });
            }}>Edit</Button>
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
    </div>
  );
};

export default VehiclesList;
