
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { VehiclesList } from '@/components/vehicles/VehiclesList';
import { AddVehicleDialog } from '@/components/vehicles/AddVehicleDialog';
import { EditVehicleDialog } from '@/components/vehicles/EditVehicleDialog';
import { Vehicle } from '@/types/vehicle';
import { useAuth } from '@/contexts/auth';
import { useVehicleManagement } from '@/hooks/vehicles/useVehicleManagement';

const Vehicles = () => {
  const { user } = useAuth();
  const { vehicles, loading, createVehicle, deleteVehicle } = useVehicleManagement();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const handleAddVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    const newVehicleData = {
      ...vehicleData,
      owner_id: user.id,
    };
    
    await createVehicle(newVehicleData);
    setIsAddDialogOpen(false);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
  };

  const handleRemoveVehicle = async (vehicleId: string) => {
    await deleteVehicle(vehicleId);
  };

  const userVehicles = vehicles.filter(vehicle => vehicle.owner_id === user?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Vehicles</h1>
          <p className="text-muted-foreground">Manage your vehicle information</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {userVehicles.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No vehicles found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You haven't added any vehicles yet. Add your first vehicle to get started.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Vehicle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <VehiclesList
          vehicles={userVehicles}
          onEdit={handleEditVehicle}
          onRemove={handleRemoveVehicle}
        />
      )}

      <AddVehicleDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddVehicle}
      />

      <EditVehicleDialog
        vehicle={editingVehicle}
        open={!!editingVehicle}
        onOpenChange={(open) => !open && setEditingVehicle(null)}
      />
    </div>
  );
};

export default Vehicles;
