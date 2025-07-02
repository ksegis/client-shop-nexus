
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InfoIcon, History, MessageSquare, Car } from 'lucide-react';
import { useWorkOrders } from './WorkOrdersContext';
import { useServiceUpdates } from '@/hooks/useServiceUpdates';

import { WorkOrderHeader } from '@/components/shop/work-orders/detail/WorkOrderHeader';
import { WorkOrderTabContent } from '@/components/shop/work-orders/detail/WorkOrderTabContent';
import WorkOrderNotFound from '@/components/shop/work-orders/detail/WorkOrderNotFound';
import WorkOrderLoading from '@/components/shop/work-orders/detail/WorkOrderLoading';

const WorkOrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { workOrders, getWorkOrderLineItems } = useWorkOrders();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const { updates, isLoading: updatesLoading, addUpdate } = useServiceUpdates(id);
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  // Fetch work order data
  useEffect(() => {
    if (!id) return;
    
    const foundWorkOrder = workOrders.find(wo => wo.id === id);
    if (foundWorkOrder) {
      setWorkOrder(foundWorkOrder);
      
      // Fetch line items
      const fetchLineItems = async () => {
        try {
          const items = await getWorkOrderLineItems(id);
          setLineItems(items);
        } catch (error) {
          console.error('Error fetching line items:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchLineItems();
    } else {
      setLoading(false);
    }
  }, [id, workOrders, getWorkOrderLineItems]);

  // Handle service update submission
  const handleAddServiceUpdate = async (updateData: {
    content: string;
    milestone?: string;
    milestone_completed?: boolean;
    images?: File[];
  }) => {
    if (!id) return;
    
    setIsSubmittingUpdate(true);
    try {
      await addUpdate({
        work_order_id: id,
        ...updateData
      });
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  if (loading) {
    return <WorkOrderLoading />;
  }

  if (!workOrder) {
    return <WorkOrderNotFound />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <WorkOrderHeader id={id} status={workOrder.status} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-4">
          <TabsTrigger value="details" className="flex items-center">
            <InfoIcon className="h-4 w-4 mr-2 md:mr-1" />
            <span className="hidden md:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex items-center">
            <History className="h-4 w-4 mr-2 md:mr-1" />
            <span className="hidden md:inline">Updates</span>
          </TabsTrigger>
          <TabsTrigger value="customer" className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2 md:mr-1" />
            <span className="hidden md:inline">Customer</span>
          </TabsTrigger>
          <TabsTrigger value="vehicle" className="flex items-center">
            <Car className="h-4 w-4 mr-2 md:mr-1" />
            <span className="hidden md:inline">Vehicle</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-6">
          <WorkOrderTabContent 
            activeTab="details"
            workOrder={workOrder}
            lineItems={lineItems}
            updates={updates}
            updatesLoading={updatesLoading}
            isSubmittingUpdate={isSubmittingUpdate}
            handleAddServiceUpdate={handleAddServiceUpdate}
            getStatusColor={getStatusColor}
          />
        </TabsContent>
        
        <TabsContent value="updates" className="mt-6">
          <WorkOrderTabContent 
            activeTab="updates"
            workOrder={workOrder}
            lineItems={lineItems}
            updates={updates}
            updatesLoading={updatesLoading}
            isSubmittingUpdate={isSubmittingUpdate}
            handleAddServiceUpdate={handleAddServiceUpdate}
            getStatusColor={getStatusColor}
          />
        </TabsContent>
        
        <TabsContent value="customer" className="mt-6">
          <WorkOrderTabContent 
            activeTab="customer"
            workOrder={workOrder}
            lineItems={lineItems}
            updates={updates}
            updatesLoading={updatesLoading}
            isSubmittingUpdate={isSubmittingUpdate}
            handleAddServiceUpdate={handleAddServiceUpdate}
            getStatusColor={getStatusColor}
          />
        </TabsContent>
        
        <TabsContent value="vehicle" className="mt-6">
          <WorkOrderTabContent 
            activeTab="vehicle"
            workOrder={workOrder}
            lineItems={lineItems}
            updates={updates}
            updatesLoading={updatesLoading}
            isSubmittingUpdate={isSubmittingUpdate}
            handleAddServiceUpdate={handleAddServiceUpdate}
            getStatusColor={getStatusColor}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkOrderDetailPage;
