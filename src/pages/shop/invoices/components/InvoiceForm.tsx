
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CustomerVehicleSection } from "./CustomerVehicleSection";
import { EstimateSelector } from "./EstimateSelector";
import { Estimate } from "../../estimates/types";
import { BasicInfoSection } from "./form-sections/BasicInfoSection";
import { DescriptionSection } from "./form-sections/DescriptionSection";
import { StatusSection } from "./form-sections/StatusSection";
import { AmountSection } from "./form-sections/AmountSection";
import { invoiceFormSchema, InvoiceFormValues } from "./InvoiceFormSchema";

interface InvoiceFormProps {
  invoice?: any;
  estimateData?: any;
  openEstimates: Estimate[];
  sourceEstimateId: string | null;
  setSourceEstimateId: (id: string | null) => void;
  customerId: string;
  setCustomerId: (id: string) => void;
  selectedVehicleId: string;
  setVehicleId: (id: string) => void;
  customerDetails: { first_name?: string; last_name?: string; email: string; } | null;
  vehicleOptions: { value: string; label: string; }[];
  handleEstimateSelection: (estimateId: string) => void;
  onSubmit: (data: InvoiceFormValues) => void;
  customers?: any[];
}

export function InvoiceForm({
  invoice,
  estimateData,
  openEstimates = [],
  sourceEstimateId,
  setSourceEstimateId,
  customerId,
  setCustomerId,
  selectedVehicleId,
  setVehicleId,
  customerDetails,
  vehicleOptions = [],
  handleEstimateSelection,
  onSubmit,
  customers = []
}: InvoiceFormProps) {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      title: invoice?.title || (estimateData?.title ? `Invoice for ${estimateData?.title}` : ""),
      description: invoice?.description || estimateData?.description || "",
      total_amount: invoice?.total_amount || estimateData?.total_amount || 0,
      status: invoice?.status || 'draft',
    },
  });

  // Ensure we have a valid array for openEstimates
  const estimates = Array.isArray(openEstimates) ? openEstimates : [];

  return (
    <>
      {sourceEstimateId && (
        <div className="bg-gray-50 p-2 rounded-md mb-4">
          <p className="text-sm text-muted-foreground flex items-center">
            <span>Based on Estimate: </span>
            <Link 
              to={`/shop/estimates`} 
              className="ml-1 text-blue-600 hover:underline flex items-center"
            >
              #{sourceEstimateId.substring(0, 8)}
            </Link>
          </p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {!invoice && !estimateData && estimates.length > 0 && (
            <EstimateSelector
              openEstimates={estimates}
              sourceEstimateId={sourceEstimateId}
              onEstimateSelected={handleEstimateSelection}
            />
          )}

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
