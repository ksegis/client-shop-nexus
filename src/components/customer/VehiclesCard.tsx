
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Vehicle, NewVehicleData } from '@/types/vehicle';
import VehiclesList from './VehiclesList';
import AddVehicleDialog from './AddVehicleDialog';

interface VehiclesCardProps {
  vehicles: Vehicle[];
  loading: boolean;
  onAddVehicle: (vehicle: NewVehicleData, customerId?: string) => Promise<boolean>;
  onRemoveVehicle: (id: string) => Promise<boolean>;
  onUpdateVehicle: (id: string, vehicleData: Partial<Vehicle>) => Promise<boolean>;
  customerId?: string; // New prop for customer ID
}

const VehiclesCard = ({ 
  vehicles, 
  loading, 
  onAddVehicle, 
  onRemoveVehicle, 
  onUpdateVehicle,
  customerId 
}: VehiclesCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Vehicles</h2>
        
        <Button 
          className="bg-shop-primary hover:bg-shop-primary/90" 
          onClick={() => setDialogOpen(true)}
        >
          Add Vehicle
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-4">Loading vehicles...</div>
      ) : (
        <VehiclesList 
          vehicles={vehicles} 
          onRemoveVehicle={onRemoveVehicle}
          onUpdateVehicle={onUpdateVehicle}
        />
      )}
      
      <AddVehicleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAddVehicle={onAddVehicle}
        customerId={customerId}
      />
    </Card>
  );
};

export default VehiclesCard;
