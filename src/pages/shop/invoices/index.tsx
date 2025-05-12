
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { InvoicesProvider } from './InvoicesContext';
import { InvoicesTable } from './InvoicesTable';
import InvoiceDialog from './InvoiceDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const InvoicesContent = () => {
  const [activeTab, setActiveTab] = useState('unpaid');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const handleOpenInvoiceDialog = (invoice = null) => {
    setSelectedInvoice(invoice);
    setDialogOpen(true);
  };

  const handleCloseInvoiceDialog = () => {
    setDialogOpen(false);
    setSelectedInvoice(null);
  };

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
            
            <button 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2"
              onClick={() => handleOpenInvoiceDialog()}
            >
              Add Invoice
            </button>
          </div>

          <TabsContent value="unpaid">
            <InvoicesTable onOpenInvoiceDialog={handleOpenInvoiceDialog} />
          </TabsContent>
          
          <TabsContent value="paid">
            <InvoicesTable onOpenInvoiceDialog={handleOpenInvoiceDialog} />
          </TabsContent>
          
          <TabsContent value="all">
            <InvoicesTable onOpenInvoiceDialog={handleOpenInvoiceDialog} />
          </TabsContent>
        </Tabs>
      </div>

      {dialogOpen && (
        <InvoiceDialog
          open={dialogOpen}
          onClose={handleCloseInvoiceDialog}
          invoice={selectedInvoice}
        />
      )}
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
