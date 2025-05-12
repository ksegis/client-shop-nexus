
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
  vehicleOptions = [],
  onSubmit,
  customers = []
}: InvoiceFormProps) {
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [vendors, setVendors] = useState<{name: string}[]>([]);

  // Extract unique vendors from inventory for dropdown
  useEffect(() => {
    // In a real app, you'd fetch this from an API
    setVendors([
      { name: 'OEM Parts' },
      { name: 'Aftermarket' },
      { name: 'Local Supplier' },
      { name: 'Online Retailer' }
    ]);
  }, []);

  // Initialize line items from invoice or estimate
  useEffect(() => {
    if (invoice && invoice.lineItems) {
      setLineItems(invoice.lineItems);
    } else if (estimateData && estimateData.lineItems) {
      setLineItems(estimateData.lineItems.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        part_number: item.part_number || '',
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
    },
  });

  // Calculate total amount whenever line items change
  useEffect(() => {
    if (lineItems.length > 0) {
      const totalAmount = lineItems.reduce((sum, item) => 
        sum + (item.quantity * item.price), 0);
      form.setValue('total_amount', totalAmount);
    }
  }, [lineItems, form]);

  const handleSubmitWithItems = (data: InvoiceFormValues) => {
    // Add line items to the form data
    onSubmit({
      ...data,
      lineItems: lineItems,
    });
  };

  return (
    <>
      {estimateData && estimateData.id && (
        <div className="bg-gray-50 p-2 rounded-md mb-4">
          <p className="text-sm text-muted-foreground flex items-center">
            <span>Based on Estimate: </span>
            <Link 
              to={`/shop/estimates`} 
              className="ml-1 text-blue-600 hover:underline flex items-center"
            >
              #{estimateData.id.substring(0, 8)}
            </Link>
          </p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmitWithItems)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BasicInfoSection control={form.control} />

            <CustomerVehicleSection
              customerId={customerId}
              setCustomerId={setCustomerId}
              selectedVehicleId={selectedVehicleId}
              setVehicleId={setVehicleId}
              customerDetails={customerDetails}
              vehicleOptions={vehicleOptions}
              customers={customers}
            />

            <AmountSection control={form.control} />
          </div>

          <LineItemsSection 
            lineItems={lineItems}
            setLineItems={setLineItems}
            vendors={vendors}
          />

          <DescriptionSection control={form.control} />
          <StatusSection control={form.control} />

          <div className="flex justify-end">
            <Button type="submit">
              {invoice ? "Update Invoice" : "Create Invoice"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
