
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Search, Car, User } from 'lucide-react';
import { useVehicleManagement } from '@/hooks/vehicles/useVehicleManagement';
import { VehicleDialog } from './customers/VehicleDialog';
import { Vehicle } from '@/types/vehicle';
import { useCustomers } from './customers/CustomersContext';

const VehicleManagement = () => {
  const { vehicles, loading } = useVehicleManagement();
  const { customers } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Filter vehicles based on search query
  const filteredVehicles = vehicles.filter(vehicle => {
    const customer = customers.find(c => c.id === vehicle.owner_id);
    const customerName = customer ? `${customer.first_name} ${customer.last_name}` : '';
    const searchTerm = searchQuery.toLowerCase();
    
    return (
      `${vehicle.year} ${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchTerm) ||
      vehicle.vin?.toLowerCase().includes(searchTerm) ||
      vehicle.license_plate?.toLowerCase().includes(searchTerm) ||
      customerName.toLowerCase().includes(searchTerm)
    );
  });

  const handleAddVehicle = () => {
    setSelectedVehicle(null);
    setSelectedCustomerId('');
    setVehicleDialogOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedCustomerId(vehicle.owner_id);
    setVehicleDialogOpen(true);
  };

  const handleVehicleUpdate = () => {
    setVehicleDialogOpen(false);
    setSelectedVehicle(null);
    setSelectedCustomerId('');
  };

  const getCustomerName = (ownerId: string) => {
    const customer = customers.find(c => c.id === ownerId);
    return customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown Customer';
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading vehicles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vehicle Management</h1>
          <p className="text-muted-foreground">
            Manage all customer vehicles in the system
          </p>
        </div>
        <Button onClick={handleAddVehicle}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by vehicle info, VIN, license plate, or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'No vehicles found matching your search' : 'No vehicles in the system'}
            </p>
            {!searchQuery && (
              <Button onClick={handleAddVehicle}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Vehicle
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {getCustomerName(vehicle.owner_id)}
                      </span>
                    </div>
                  </div>
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
        customerId={selectedCustomerId}
        onSuccess={handleVehicleUpdate}
      />
    </div>
  );
};

export default VehicleManagement;
