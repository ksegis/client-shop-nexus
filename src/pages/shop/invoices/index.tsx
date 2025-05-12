
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { InvoicesProvider } from "./InvoicesContext";
import InvoicesTable from "./InvoicesTable";
import InvoiceDialog from "./InvoiceDialog";
import { Invoice } from "./types";
import { useLocation, Link } from "react-router-dom";

export default function Invoices() {
  const location = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>(undefined);
  const [convertFromEstimate, setConvertFromEstimate] = useState<any>(null);

  // Check if we're navigating from the estimates page with conversion data
  useEffect(() => {
    if (location.state?.createFromEstimate && location.state?.estimateData) {
      setConvertFromEstimate(location.state.estimateData);
      setDialogOpen(true);
    }
  }, [location.state]);

  const handleOpenDialog = (invoice?: Invoice) => {
    setSelectedInvoice(invoice);
    setConvertFromEstimate(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedInvoice(undefined);
    setConvertFromEstimate(null);
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

        {/* Show back link if we're converting from an estimate */}
        {convertFromEstimate && (
          <div className="mb-4 flex items-center">
            <Link 
              to="/shop/estimates" 
              className="text-sm text-muted-foreground flex items-center hover:text-primary"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Estimates
            </Link>
            <span className="mx-2 text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground">
              Creating invoice from Estimate #{convertFromEstimate.id.substring(0, 8)}
            </span>
          </div>
        )}
        
        <InvoicesProvider>
          <InvoicesTable onOpenInvoiceDialog={handleOpenDialog} />
          <InvoiceDialog 
            open={dialogOpen} 
            onClose={handleCloseDialog} 
            invoice={selectedInvoice}
            estimateData={convertFromEstimate}
          />
        </InvoicesProvider>
      </div>
    </Layout>
  );
}
