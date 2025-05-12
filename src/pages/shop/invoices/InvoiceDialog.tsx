
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

import { useCustomers } from "@/hooks/useCustomers";
import { useVehicles } from "@/hooks/useVehicles";
import { InvoiceStatus } from "./types";
import { useInvoices } from "./InvoicesContext";
import { InvoiceForm } from "./components/InvoiceForm";
import { useInvoiceData } from "./hooks/useInvoiceData";

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
    sourceEstimateId,
    setSourceEstimateId,
    openEstimates,
    handleEstimateSelection,
  } = useInvoiceData();

  // Initialize form data from props
  useEffect(() => {
    if (invoice) {
      setCustomerId(invoice.customer_id);
      setVehicleId(invoice.vehicle_id);
      setSourceEstimateId(invoice.estimate_id || null);
    } else if (estimateData) {
      setCustomerId(estimateData.customer_id || '');
      setVehicleId(estimateData.vehicle_id || '');
      setSourceEstimateId(estimateData.id);
    }
  }, [invoice, estimateData]);

  const onSubmit = async (data: any) => {
    try {
      let newInvoiceData: any = {
        title: data.title,
        description: data.description,
        total_amount: data.total_amount,
        customer_id: customerId,
        vehicle_id: selectedVehicleId,
        status: data.status || "draft",
      };

      if (sourceEstimateId) {
        newInvoiceData.estimate_id = sourceEstimateId;
      }

      if (invoice) {
        await updateInvoice(invoice.id, {
          ...newInvoiceData,
        });
        toast({
          title: "Success",
          description: "Invoice updated successfully",
        });
      } else {
        await createInvoice({
          ...newInvoiceData,
        });
        toast({
          title: "Success",
          description: "Invoice created successfully",
        });
      }
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save invoice",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
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

        <InvoiceForm
          invoice={invoice}
          estimateData={estimateData}
          openEstimates={openEstimates}
          sourceEstimateId={sourceEstimateId}
          setSourceEstimateId={setSourceEstimateId}
          customerId={customerId}
          setCustomerId={setCustomerId}
          selectedVehicleId={selectedVehicleId}
          setVehicleId={setVehicleId}
          customerDetails={customerDetails}
          vehicleOptions={vehicleOptions}
          handleEstimateSelection={handleEstimateSelection}
          onSubmit={onSubmit}
          customers={customers}
        />
      </DialogContent>
    </Dialog>
  );
}
