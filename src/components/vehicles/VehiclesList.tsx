
import React from 'react';
import { Vehicle } from '@/types/vehicle';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car } from 'lucide-react';
import { VehicleCard } from './VehicleCard';

interface VehiclesListProps {
  vehicles: Vehicle[];
  loading: boolean;
  onManage: (vehicle: Vehicle) => void;
  onAddNew: () => void;
}

export const VehiclesList: React.FC<VehiclesListProps> = ({ 
  vehicles, 
  loading, 
  onManage, 
  onAddNew 
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }
  
  if (vehicles.length === 0) {
    return (
      <Card className="text-center p-10">
        <div className="flex flex-col items-center justify-center p-6">
          <Car className="h-16 w-16 text-gray-300 mb-4" />
          <CardTitle className="text-xl mb-2">No vehicles added yet</CardTitle>
          <CardDescription className="mb-4">
            Add your vehicles to receive personalized service and maintenance recommendations
          </CardDescription>
          <Button onClick={onAddNew}>Add Your First Vehicle</Button>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vehicles.map(vehicle => (
        <VehicleCard 
          key={vehicle.id} 
          vehicle={vehicle} 
          onManage={onManage} 
        />
      ))}
    </div>
  );
};
