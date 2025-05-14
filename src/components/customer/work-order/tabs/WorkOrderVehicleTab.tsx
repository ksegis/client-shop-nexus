
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Vehicle {
  year: string;
  make: string;
  model: string;
  vin: string;
  license: string;
}

interface WorkOrderVehicleTabProps {
  vehicle: Vehicle;
}

export const WorkOrderVehicleTab: React.FC<WorkOrderVehicleTabProps> = ({
  vehicle
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium">Vehicle</h3>
            <p className="text-gray-600">{vehicle.year} {vehicle.make} {vehicle.model}</p>
            <p className="text-gray-500 text-sm">VIN: {vehicle.vin}</p>
            <p className="text-gray-500 text-sm">License: {vehicle.license}</p>
          </div>
        </div>
        
        <div className="pt-4">
          <Link to={`/customer/vehicles`}>
            <Button variant="outline">
              <Car className="mr-2 h-4 w-4" />
              View All Vehicles
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
