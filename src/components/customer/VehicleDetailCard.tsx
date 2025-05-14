
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Vehicle } from '@/types/vehicle';
import { Car, Calendar, FileText, Tool, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VehicleServiceHistory from './VehicleServiceHistory';

interface VehicleDetailCardProps {
  vehicle: Vehicle;
  onEdit: () => void;
  onRemove: () => void;
}

const VehicleDetailCard = ({ vehicle, onEdit, onRemove }: VehicleDetailCardProps) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            {vehicle.year} {vehicle.make} {vehicle.model}
          </CardTitle>
          
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700" onClick={onRemove}>
              Remove
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="details">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="details">Vehicle Details</TabsTrigger>
            <TabsTrigger value="service-history">Service History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Basic Information</h3>
                <dl className="mt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600">Make:</dt>
                    <dd className="text-sm font-medium">{vehicle.make}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600">Model:</dt>
                    <dd className="text-sm font-medium">{vehicle.model}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600">Year:</dt>
                    <dd className="text-sm font-medium">{vehicle.year}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600">Type:</dt>
                    <dd className="text-sm font-medium capitalize">{vehicle.vehicle_type}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Additional Details</h3>
                <dl className="mt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600">VIN:</dt>
                    <dd className="text-sm font-medium">{vehicle.vin || 'Not provided'}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600">License Plate:</dt>
                    <dd className="text-sm font-medium">{vehicle.license_plate || 'Not provided'}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600">Color:</dt>
                    <dd className="text-sm font-medium">{vehicle.color || 'Not specified'}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            <div className="flex justify-center mt-4 space-x-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Schedule Service
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Tool className="h-4 w-4" /> Request Estimate
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="service-history">
            <VehicleServiceHistory vehicle={vehicle} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default VehicleDetailCard;
