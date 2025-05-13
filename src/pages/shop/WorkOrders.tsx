
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkOrdersProvider } from './work-orders/WorkOrdersContext';
import { WorkOrdersTable } from './work-orders/WorkOrdersTable';
import { WorkOrderDialog } from './work-orders/WorkOrderDialog';

const WorkOrders = () => {
  const [activeTab, setActiveTab] = useState('active');

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Work Orders</h1>
          <p className="text-muted-foreground">
            Manage your shop's work orders and service tickets
          </p>
        </div>
      </div>

      <WorkOrdersProvider>
        <div className="rounded-md border">
          <Tabs 
            defaultValue="active" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="all">All Orders</TabsTrigger>
              </TabsList>
              
              <WorkOrderDialog />
            </div>

            <TabsContent value="active">
              <WorkOrdersTable status="active" />
            </TabsContent>
            
            <TabsContent value="completed">
              <WorkOrdersTable status="completed" />
            </TabsContent>
            
            <TabsContent value="all">
              <WorkOrdersTable status="all" />
            </TabsContent>
          </Tabs>
        </div>
      </WorkOrdersProvider>
    </div>
  );
};

export default WorkOrders;
