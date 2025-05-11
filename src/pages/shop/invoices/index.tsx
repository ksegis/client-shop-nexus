
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { InvoicesProvider } from "./InvoicesContext";
import InvoicesTable from "./InvoicesTable";
import InvoiceDialog from "./InvoiceDialog";
import { Invoice } from "./types";
import { useLocation } from "react-router-dom";

export default function Invoices() {
  const location = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>(undefined);

  const handleOpenDialog = (invoice?: Invoice) => {
    setSelectedInvoice(invoice);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedInvoice(undefined);
  };

  return (
    <Layout portalType="shop">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Invoices</h1>
            <p className="text-gray-500">Manage customer invoices and payments</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" /> 
            New Invoice
          </Button>
        </div>
        
        <InvoicesProvider>
          <InvoicesTable onOpenInvoiceDialog={handleOpenDialog} />
          <InvoiceDialog 
            open={dialogOpen} 
            onClose={handleCloseDialog} 
            invoice={selectedInvoice} 
          />
        </InvoicesProvider>
      </div>
    </Layout>
  );
}
