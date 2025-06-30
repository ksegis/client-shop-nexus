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
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";

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
}

export function InvoiceForm({
  invoice,
  estimateData,
  customerId,
  setCustomerId,
  selectedVehicleId,
  setVehicleId,
  customerDetails,
  vehicleOptions,
  onSubmit,
  customers
}: InvoiceFormProps) {
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [vendors, setVendors] = useState<{ name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch real vendors from database
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        console.log('Fetching vendors from database...');
        const { data, error } = await supabase
          .from('inventory')
          .select('supplier')
          .not('supplier', 'is', null)
          .neq('supplier', '');

        if (error) {
          console.error('Error fetching vendors:', error);
          setVendors([
            { name: 'OEM Parts' },
            { name: 'Aftermarket' },
            { name: 'Local Supplier' }
          ]);
          return;
        }

        const uniqueSuppliers = [...new Set(data.map(item => item.supplier))];
        const vendorList = uniqueSuppliers.map(supplier => ({ name: supplier }));
        
        console.log('Fetched vendors:', vendorList);
        setVendors(vendorList);
      } catch (error) {
        console.error('Error fetching vendors:', error);
        setVendors([
          { name: 'OEM Parts' },
          { name: 'Aftermarket' },
          { name: 'Local Supplier' }
        ]);
      }
    };

    fetchVendors();
  }, []);

  // Initialize line items from invoice or estimate
  useEffect(() => {
    console.log('Initializing line items...');
    console.log('Invoice:', invoice);
    console.log('EstimateData:', estimateData);

    if (invoice && invoice.lineItems) {
      console.log('Using invoice.lineItems');
      setLineItems(invoice.lineItems);
    } else if (invoice && invoice.line_items) {
      console.log('Using invoice.line_items');
      setLineItems(invoice.line_items.map((item: any) => ({
        description: item.description || '',
        quantity: item.quantity || 1,
        price: item.price || 0,
        part_number: item.part_number || item.partNumber || '',
        vendor: item.vendor || '',
      })));
    } else if (estimateData && estimateData.lineItems) {
      console.log('Using estimateData.lineItems');
      setLineItems(estimateData.lineItems.map((item: any) => ({
        description: item.description || '',
        quantity: item.quantity || 1,
        price: item.price || 0,
        part_number: item.part_number || item.partNumber || '',
        vendor: item.vendor || '',
      })));
    } else if (estimateData && estimateData.line_items) {
      console.log('Using estimateData.line_items');
      setLineItems(estimateData.line_items.map((item: any) => ({
        description: item.description || '',
        quantity: item.quantity || 1,
        price: item.price || 0,
        part_number: item.part_number || item.partNumber || '',
        vendor: item.vendor || '',
      })));
    } else {
      console.log('No line items found, starting with empty array');
      setLineItems([]);
    }
  }, [invoice, estimateData]);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      title: invoice?.title || (estimateData?.title ? `Invoice for ${estimateData?.title}` : ""),
      description: invoice?.description || estimateData?.description || "",
      total_amount: invoice?.total_amount || estimateData?.total_amount || 0,
      status: invoice?.status || 'draft',
      due_date: invoice?.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
      form.setValue('total_amount', 0);
    }
  }, [lineItems, form]);

  const handleSubmitWithItems = async (data: InvoiceFormValues) => {
    setIsSubmitting(true);
    try {
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

      const formDataWithItems = {
        ...data,
        lineItems: lineItems
      };

      console.log('Submitting form with line items:', formDataWithItems);
      await onSubmit(formDataWithItems);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to save invoice",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLineItem = () => {
    console.log('Adding new line item');
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, price: 0, part_number: "", vendor: "" }
    ]);
  };

  // FIXED: Handle individual field updates properly hopefully
  const handleUpdateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    console.log(`Updating line item ${index}, field ${field}, value:`, value);
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setLineItems(updatedItems);
  };

  const handleRemoveLineItem = (index: number) => {
    console.log('Removing line item at index:', index);
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
                type="submit"
                disabled={isSubmitting || !customerId || !selectedVehicleId}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  invoice ? "Update Invoice" : "Create Invoice"
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

