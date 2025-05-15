
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, MessageCircle, Car, Clock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { ServiceUpdatesList } from '@/components/shared/service/ServiceUpdatesList';
import { 
  CustomerWorkOrderHeader,
  WorkOrderSkeleton,
  WorkOrderNotFound
} from '@/components/customer/work-order';
import {
  WorkOrderDetailsTab,
  WorkOrderVehicleTab
} from '@/components/customer/work-order/tabs';
import {
  useServiceUpdates
} from '@/hooks/work-orders';
import { useCustomerWorkOrderDetail } from '@/hooks/customer';

const CustomerWorkOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('details');
  
  // Handle possible undefined id
  const workOrderId = id || '';
  
  const { workOrder, loading: workOrderLoading } = useCustomerWorkOrderDetail(workOrderId);
  const { updates, loading: updatesLoading } = useServiceUpdates(workOrderId);

  if (workOrderLoading) {
    return <WorkOrderSkeleton />;
  }

  if (!workOrder) {
    return <WorkOrderNotFound />;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <CustomerWorkOrderHeader 
        title={workOrder.title} 
        status={workOrder.status} 
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details" className="flex items-center">
            <Info className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Updates
          </TabsTrigger>
          <TabsTrigger value="vehicle" className="flex items-center">
            <Car className="mr-2 h-4 w-4" />
            Vehicle
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <WorkOrderDetailsTab 
            description={workOrder.description}
            lineItems={workOrder.lineItems}
            total={workOrder.total}
          />
        </TabsContent>
        
        <TabsContent value="updates" className="mt-6">
          <ServiceUpdatesList 
            updates={updates}
            loading={updatesLoading}
            isShopPortal={false}
          />
        </TabsContent>
        
        <TabsContent value="vehicle" className="mt-6">
          <WorkOrderVehicleTab vehicle={workOrder.vehicle} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerWorkOrderDetail;
