
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { InvoicesProvider } from './InvoicesContext';
import { InvoicesTable } from './InvoicesTable';
import { InvoiceDialog } from './InvoiceDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const InvoicesContent = () => {
  const [activeTab, setActiveTab] = useState('unpaid');

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage your shop's invoices and payment records
          </p>
        </div>
      </div>

      <div className="rounded-md border">
        <Tabs 
          defaultValue="unpaid" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="all">All Invoices</TabsTrigger>
            </TabsList>
            
            <InvoiceDialog />
          </div>

          <TabsContent value="unpaid">
            <InvoicesTable status="unpaid" />
          </TabsContent>
          
          <TabsContent value="paid">
            <InvoicesTable status="paid" />
          </TabsContent>
          
          <TabsContent value="all">
            <InvoicesTable status="all" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default function Invoices() {
  return (
    <Layout portalType="shop">
      <InvoicesProvider>
        <InvoicesContent />
      </InvoicesProvider>
    </Layout>
  );
}
