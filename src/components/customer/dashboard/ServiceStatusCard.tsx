
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkOrderSummary } from '@/hooks/customer/useCustomerDashboard';

interface ServiceStatusCardProps {
  activeWorkOrder: WorkOrderSummary | null;
  loading: boolean;
}

export const ServiceStatusCard = ({ activeWorkOrder, loading }: ServiceStatusCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Status</CardTitle>
        <CardDescription>Current status of your vehicle service</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : activeWorkOrder ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">
                  {activeWorkOrder.vehicle ? 
                    `${activeWorkOrder.vehicle.year} ${activeWorkOrder.vehicle.make} ${activeWorkOrder.vehicle.model}` 
                    : 'Vehicle Service'}
                </h3>
                <p className="text-sm text-gray-500">{activeWorkOrder.title}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                In Progress
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${activeWorkOrder.progress}%` }}></div>
            </div>
            
            <p className="text-xs text-gray-500">
              Estimated completion: {activeWorkOrder.estimated_completion || 'To be determined'}
            </p>
            
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link to={`/customer/work-orders/${activeWorkOrder.id}`}>
                View Details
              </Link>
            </Button>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p>No active service orders</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
