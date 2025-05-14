
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WorkOrderVehicleTabProps {
  workOrder: any;
}

export const WorkOrderVehicleTab: React.FC<WorkOrderVehicleTabProps> = ({ workOrder }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Vehicle</h3>
              <p>2019 Honda Accord</p>
              <p className="text-sm text-muted-foreground">VIN: 1HGCV1F34MA000000</p>
              <p className="text-sm text-muted-foreground">License: ABC123</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Details</h3>
              <p>Color: White</p>
              <p className="text-sm text-muted-foreground">Mileage: 45,000 mi</p>
              <p className="text-sm text-muted-foreground">Last Service: 03/15/2023</p>
            </div>
          </div>
          
          <Button variant="outline" asChild>
            <Link to={`/shop/vehicles/details/${workOrder.vehicle_id}`}>
              View Vehicle History
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
