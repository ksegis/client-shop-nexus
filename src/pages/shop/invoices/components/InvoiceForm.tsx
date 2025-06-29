import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CustomerVehicleSection } from "./CustomerVehicleSection";
import { BasicInfoSection } from "./form-sections/BasicInfoSection";
import { DescriptionSection } from "./form-sections/DescriptionSection";
import { StatusSection } from "./form-sections/StatusSection";
import { AmountSection } from "./form-sections/AmountSection";
import { invoiceFormSchema, InvoiceFormValues } from "./InvoiceFormSchema";
import { LineItemsSection } from "./LineItemsSection";
import { InvoiceLineItem } from "../types";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Cache bust: Force rebuild - 2025-06-29

interface InvoiceFormProps {
  invoice?: any;
  estimateData?: any;
  customerId: string;
  setCustomerId: (id: string) => void;
  selectedVehicleId: string;
  setVehicleId: (id: string) => void;
  customerDetails: { first_name?: string; last_name?: string; email: string; } | null;
  vehicleOptions: { value: string; label: string; }[];
  onSubmit: (data: InvoiceFormValues) => void;
  customers?: any[];
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

export function InvoiceForm({
  invoice,
  estimateData,
  customerId,
  setCustomerId,
  selectedVehicleId,
  setVehicleId,
  customerDetails,
  vehicleOptions = [],
  onSubmit,
  customers = [],
  isLoading = false,
  mode = 'create'
}: InvoiceFormProps) {
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [vendors, setVendors] = useState<{name: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Extract unique vendors from inventory for dropdown
  useEffect(() => {
    // In a real app, you'd fetch this from an API
    setVendors([
      { name: 'OEM Parts' },
      { name: 'Aftermarket' },
      { name: 'Local Supplier' },
      { name: 'Online Retailer' },
      { name: 'Keystone Automotive' },
      { name: 'LKQ Corporation' },
      { name: 'Genuine Parts Company' },
      { name: 'AutoZone' }
    ]);
  }, []);

  // Initialize line items from invoice or estimate
  useEffect(() => {
    if (invoice && invoice.lineItems) {
      setLineItems(invoice.lineItems);
    } else if (invoice && invoice.line_items) {
      // Handle different property names
      setLineItems(invoice.line_items.map((item: any) => ({
        description: item.description || '',
        quantity: item.quantity || 1,
        price: item.price || 0,
        part_number: item.part_number || item.partNumber || '',
        vendor: item.vendor || '',
      })));
    } else if (estimateData && estimateData.lineItems) {
      setLineItems(estimateData.lineItems.map((item: any) => ({
        description: item.description || '',
        quantity: item.quantity || 1,
        price: item.price || 0,
        part_number: item.part_number || item.partNumber || '',
        vendor: item.vendor || '',
      })));
    } else if (estimateData && estimateData.line_items) {
      // Handle different property names for estimate data
      setLineItems(estimateData.line_items.map((item: any) => ({
        description: item.description || '',
        quantity: item.quantity || 1,
        price: item.price || 0,
        part_number: item.part_number || item.partNumber || '',
        vendor: item.vendor || '',
      })));
    }
  }, [invoice, estimateData]);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      title: invoice?.title || (estimateData?.title ? `Invoice for ${estimateData?.title}` : ""),
      description: invoice?.description || estimateData?.description || "",
      total_amount: invoice?.total_amount || estimateData?.total_amount || 0,
      status: invoice?.status || 'draft',
      due_date: invoice?.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      invoice_date: invoice?.invoice_date || new Date().toISOString().split('T')[0],
    },
  });

  // Calculate total amount whenever line items change
  useEffect(() => {
    if (lineItems.length > 0) {
      const totalAmount = lineItems.reduce((sum, item) => 
        sum + (item.quantity * item.price), 0);
      form.setValue('total_amount', totalAmount);
    } else {
      // If no line items, reset to 0 unless manually set
      form.setValue('total_amount', 0);
    }
  }, [lineItems, form]);

  // Update customer and vehicle when props change
  useEffect(() => {
    if (customerId && customerDetails) {
      // Update form with customer details if needed
      const customerName = `${customerDetails.first_name || ''} ${customerDetails.last_name || ''}`.trim();
      if (customerName) {
        form.setValue('customer_name', customerName);
      }
    }
  }, [customerId, customerDetails, form]);

  const handleSubmitWithItems = async (data: InvoiceFormValues) => {
    setIsSubmitting(true);
    try {
      // Validate that we have required data
      if (!customerId) {
        toast({
          title: "Error",
          description: "Please select a customer",
          variant: "destructive",
        });
        return;
      }

      if (!selectedVehicleId) {
        toast({
          title: "Error", 
          description: "Please select a vehicle",
          variant: "destructive",
        });
        return;
      }

      // Add line items and customer/vehicle data to the form data
      const submitData = {
        ...data,
        customer_id: customerId,
        vehicle_id: selectedVehicleId,
        lineItems: lineItems,
        line_items: lineItems, // Include both formats for compatibility
      };

      await onSubmit(submitData);
      
      toast({
        title: "Success",
        description: `Invoice ${mode === 'create' ? 'created' : 'updated'} successfully`,
      });
    } catch (error) {
      console.error('Error submitting invoice:', error);
      toast({
        title: "Error",
        description: `Failed to ${mode} invoice. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLineItem = () => {
    const newItem: InvoiceLineItem = {
      description: '',
      quantity: 1,
      price: 0,
      part_number: '',
      vendor: '',
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleUpdateLineItem = (index: number, updatedItem: InvoiceLineItem) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = updatedItem;
    setLineItems(updatedItems);
  };

  const handleRemoveLineItem = (index: number) => {
    const updatedItems = lineItems.filter((_, i) => i !== index);
    setLineItems(updatedItems);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading invoice data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {estimateData && estimateData.id && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
          <p className="text-sm text-blue-800 flex items-center">
            <span className="font-medium">Based on Estimate: </span>
            <Link 
              to={`/shop/estimates`} 
              className="ml-1 text-blue-600 hover:underline font-medium"
            >
              #{estimateData.id.substring(0, 8)}
            </Link>
          </p>
          {estimateData.title && (
            <p className="text-sm text-blue-700 mt-1">
              {estimateData.title}
            </p>
          )}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmitWithItems)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <BasicInfoSection control={form.control} />
              <AmountSection control={form.control} />
            </div>

            <div className="space-y-6">
              <CustomerVehicleSection
                customerId={customerId}
                setCustomerId={setCustomerId}
                selectedVehicleId={selectedVehicleId}
                setVehicleId={setVehicleId}
                customerDetails={customerDetails}
                vehicleOptions={vehicleOptions}
                customers={customers}
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <LineItemsSection 
              lineItems={lineItems}
              setLineItems={setLineItems}
              vendors={vendors}
              onAddItem={handleAddLineItem}
              onUpdateItem={handleUpdateLineItem}
              onRemoveItem={handleRemoveLineItem}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DescriptionSection control={form.control} />
            <StatusSection control={form.control} />
          </div>

          <div className="flex justify-between items-center pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              {lineItems.length > 0 && (
                <span>
                  {lineItems.length} line item{lineItems.length !== 1 ? 's' : ''} • 
                  Total: ${form.watch('total_amount')?.toFixed(2) || '0.00'}
                </span>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => window.history.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              <Button 
                type="submit"
                disabled={isSubmitting || !customerId || !selectedVehicleId}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {invoice ? "Update Invoice" : "Create Invoice"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

