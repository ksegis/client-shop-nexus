
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CustomerVehicleSection } from "./CustomerVehicleSection";
import { EstimateSelector } from "./EstimateSelector";
import { InvoiceStatus } from "../types";
import { Estimate } from "../../estimates/types";

// Invoice form schema
const invoiceFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  total_amount: z.coerce.number(),
  status: z.enum(['draft', 'sent', 'paid', 'void', 'overdue']),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

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
  openEstimates,
  sourceEstimateId,
  setSourceEstimateId,
  customerId,
  setCustomerId,
  selectedVehicleId,
  setVehicleId,
  customerDetails,
  vehicleOptions,
  handleEstimateSelection,
  onSubmit,
  customers = []
}: InvoiceFormProps) {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      title: invoice?.title || estimateData?.title ? `Invoice for ${estimateData?.title}` : "",
      description: invoice?.description || estimateData?.description || "",
      total_amount: invoice?.total_amount || estimateData?.total_amount || 0,
      status: invoice?.status || 'draft',
    },
  });

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
          {!invoice && !estimateData && openEstimates.length > 0 && (
            <EstimateSelector
              openEstimates={openEstimates}
              sourceEstimateId={sourceEstimateId}
              onEstimateSelected={handleEstimateSelection}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Invoice Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CustomerVehicleSection
              customerId={customerId}
              setCustomerId={setCustomerId}
              selectedVehicleId={selectedVehicleId}
              setVehicleId={setVehicleId}
              customerDetails={customerDetails}
              vehicleOptions={vehicleOptions}
              customers={customers}
            />

            <FormField
              control={form.control}
              name="total_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Amount</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="0.00" 
                      type="number"
                      step="0.01"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Invoice Description"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="void">Void</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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
