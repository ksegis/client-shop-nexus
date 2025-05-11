
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkOrdersProvider } from './work-orders/WorkOrdersContext';
import { WorkOrdersTable } from './work-orders/WorkOrdersTable';
import { WorkOrderDialog } from './work-orders/WorkOrderDialog';

const WorkOrders = () => {
  const [activeTab, setActiveTab] = useState('active');

  return (
    <Layout portalType="shop">
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
            <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Tabs 
                defaultValue="active" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="all">All Orders</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <WorkOrderDialog />
            </div>

            <TabsContent value={activeTab} className="m-0">
              <WorkOrdersTable status={activeTab} />
            </TabsContent>
          </div>
        </WorkOrdersProvider>
      </div>
    </Layout>
  );
};

export default WorkOrders;
