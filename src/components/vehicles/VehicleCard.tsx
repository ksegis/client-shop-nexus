
import React from 'react';
import { Vehicle } from '@/types/vehicle';
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface VehicleCardProps {
  vehicle: Vehicle;
  onManage: (vehicle: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onManage }) => {
  return (
    <Card key={vehicle.id} className="overflow-hidden">
      <div className="relative h-48 bg-gray-100 flex items-center justify-center">
        {vehicle.images && vehicle.images[0] ? (
          <AspectRatio ratio={16/9}>
            <img 
              src={vehicle.images[0]} 
              alt={`${vehicle.make} ${vehicle.model}`}
              className="object-cover w-full h-full"
            />
          </AspectRatio>
        ) : (
          <Car className="h-20 w-20 text-gray-300" />
        )}
      </div>
      <CardContent className="p-6">
        <CardTitle className="text-xl mb-2">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </CardTitle>
        <div className="text-sm text-gray-500 space-y-1">
          {vehicle.vehicle_type && (
            <p className="capitalize">Type: {vehicle.vehicle_type}</p>
          )}
          {vehicle.color && (
            <p>Color: {vehicle.color}</p>
          )}
          {vehicle.mileage && (
            <p>Mileage: {vehicle.mileage.toLocaleString()} miles</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="px-6 pb-6 pt-0">
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => onManage(vehicle)}
        >
          Manage Vehicle
        </Button>
      </CardFooter>
    </Card>
  );
};
