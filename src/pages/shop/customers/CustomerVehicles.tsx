
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Car } from 'lucide-react';
import { useVehicleManagement } from '@/hooks/vehicles/useVehicleManagement';
import { VehicleDialog } from './VehicleDialog';
import { Vehicle } from '@/types/vehicle';

interface CustomerVehiclesProps {
  customerId: string;
  customerName: string;
}

export function CustomerVehicles({ customerId, customerName }: CustomerVehiclesProps) {
  const { vehicles, loading } = useVehicleManagement();
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Filter vehicles for this customer
  const customerVehicles = vehicles.filter(vehicle => vehicle.owner_id === customerId);

  const handleAddVehicle = () => {
    setSelectedVehicle(null);
    setVehicleDialogOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleDialogOpen(true);
  };

  const handleVehicleUpdate = () => {
    setVehicleDialogOpen(false);
    setSelectedVehicle(null);
  };

  if (loading) {
    return <div className="p-4">Loading vehicles...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Vehicles for {customerName}</h3>
        <Button onClick={handleAddVehicle}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {customerVehicles.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No vehicles found for this customer</p>
            <Button onClick={handleAddVehicle}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Vehicle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {customerVehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditVehicle(vehicle)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-500">Color</p>
                    <p>{vehicle.color || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500">VIN</p>
                    <p className="font-mono text-xs">{vehicle.vin || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500">License Plate</p>
                    <p>{vehicle.license_plate || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-500">Type</p>
                    <Badge variant="secondary">{vehicle.vehicle_type}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <VehicleDialog
        open={vehicleDialogOpen}
        onOpenChange={setVehicleDialogOpen}
        vehicle={selectedVehicle}
        customerId={customerId}
        onSuccess={handleVehicleUpdate}
      />
    </div>
  );
}
