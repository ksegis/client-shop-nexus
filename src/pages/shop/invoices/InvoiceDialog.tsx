
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

import { useCustomers } from "@/hooks/useCustomers";
import { useVehicles } from "@/hooks/useVehicles";
import { InvoiceStatus } from "./types";
import { useInvoices } from "./InvoicesContext";
import { InvoiceForm } from "./components/InvoiceForm";
import { useInvoiceData } from "./hooks/useInvoiceData";
import { InvoiceFormValues } from "./components/InvoiceFormSchema";

interface InvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  invoice?: any; // Keep the existing type
  estimateData?: any; // From an estimate conversion
}

export default function InvoiceDialog({ 
  open, 
  onClose, 
  invoice, 
  estimateData 
}: InvoiceDialogProps) {
  const { toast } = useToast();
  const { createInvoice, updateInvoice } = useInvoices();
  const { customers } = useCustomers();
  const { vehicles } = useVehicles();
  
  // Use the extracted hook for invoice data management
  const {
    customerId,
    setCustomerId,
    vehicleOptions,
    selectedVehicleId,
    setVehicleId,
    customerDetails,
    loading,
  } = useInvoiceData();

  // Initialize form data from props
  useEffect(() => {
    if (invoice) {
      setCustomerId(invoice.customer_id || '');
      setVehicleId(invoice.vehicle_id || '');
    } else if (estimateData) {
      setCustomerId(estimateData.customer_id || '');
      setVehicleId(estimateData.vehicle_id || '');
    }
  }, [invoice, estimateData]);

  const onSubmit = async (data: InvoiceFormValues) => {
    try {
      if (!customerId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select a customer",
        });
        return;
      }

      // Calculate total from line items if they exist
      let calculatedTotal = data.total_amount;
      if (data.lineItems && data.lineItems.length > 0) {
        calculatedTotal = data.lineItems.reduce(
          (sum, item) => sum + (item.quantity * item.price), 0
        );
      }

      let newInvoiceData: any = {
        title: data.title,
        description: data.description,
        total_amount: calculatedTotal,
        customer_id: customerId,
        vehicle_id: selectedVehicleId,
        status: data.status || "draft",
      };

      if (estimateData && estimateData.id) {
        newInvoiceData.estimate_id = estimateData.id;
      }

      if (invoice) {
        // Update existing invoice
        await updateInvoice(invoice.id, newInvoiceData);
        
        // If we have line items, we'll need to handle them separately
        if (data.lineItems && data.lineItems.length > 0) {
          // In a real app, you would have API calls to update line items here
          console.log("Updating line items:", data.lineItems);
        }
        
        toast({
          title: "Success",
          description: "Invoice updated successfully",
        });
      } else {
        // Create new invoice
        await createInvoice({ 
          ...newInvoiceData,
          lineItems: data.lineItems // Pass the line items directly
        });
        
        toast({
          title: "Success",
          description: "Invoice created successfully",
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save invoice",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice ? "Edit Invoice" : estimateData ? "Convert Estimate to Invoice" : "Create Invoice"}
          </DialogTitle>
          <DialogDescription>
            {estimateData ? 
              "Create a new invoice based on the selected estimate. You can make changes before saving." :
              "Fill in the information below to create a new invoice."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading data...</span>
          </div>
        ) : (
          <InvoiceForm
            invoice={invoice}
            estimateData={estimateData}
            customerId={customerId}
            setCustomerId={setCustomerId}
            selectedVehicleId={selectedVehicleId}
            setVehicleId={setVehicleId}
            customerDetails={customerDetails}
            vehicleOptions={vehicleOptions}
            onSubmit={onSubmit}
            customers={customers}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
