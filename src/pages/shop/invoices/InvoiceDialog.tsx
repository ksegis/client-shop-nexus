import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuidv4 } from 'uuid';
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

import { useCustomers } from "@/hooks/useCustomers";
import { useVehicles } from "@/hooks/useVehicles";
import { Invoice, InvoiceStatus } from "./types";
import { useInvoices } from "./InvoicesContext";
import { formatCurrency } from "@/lib/utils";

const invoiceFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  total_amount: z.number(),
  status: z.enum(['draft', 'sent', 'paid', 'void', 'overdue']),
});

interface InvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  invoice?: Invoice;
  estimateData?: any; // From an estimate conversion
}

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export default function InvoiceDialog({ 
  open, 
  onClose, 
  invoice, 
  estimateData 
}: InvoiceDialogProps) {
  const { toast } = useToast();
  const { createInvoice, updateInvoice } = useInvoices();
  const [customerId, setCustomerId] = useState<string>('');
  const [vehicleOptions, setVehicleOptions] = useState<{ value: string; label: string; }[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [customerDetails, setCustomerDetails] = useState<{ first_name?: string; last_name?: string; email: string; } | null>(null);
  const [sourceEstimateId, setSourceEstimateId] = useState<string | null>(null);

  const { customers } = useCustomers();
  const { vehicles, fetchVehiclesByCustomerId } = useVehicles();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      total_amount: 0,
      status: 'draft',
    },
  });

  useEffect(() => {
    if (invoice) {
      form.reset({
        title: invoice.title,
        description: invoice.description || '',
        total_amount: invoice.total_amount,
        status: invoice.status,
      });
      setCustomerId(invoice.customer_id);
      setSelectedVehicleId(invoice.vehicle_id);
      setCustomerDetails(invoice.profiles || null);
    } else if (estimateData) {
      reset({
        title: `Invoice for ${estimateData.title}`,
        description: estimateData.description || '',
        total_amount: estimateData.total_amount || 0,
        customer_id: estimateData.customer_id || '',
        vehicle_id: estimateData.vehicle_id || '',
        status: 'draft' as InvoiceStatus,
      });

      setCustomerId(estimateData.customer_id || '');
      setVehicleId(estimateData.vehicle_id || '');
      
      setSourceEstimateId(estimateData.id);

      if (estimateData.customer_id) {
        fetchCustomerDetails(estimateData.customer_id);
      }
      
      if (estimateData.vehicle_id) {
        fetchVehicleOptions(estimateData.customer_id);
      }
    } else {
      form.reset({
        title: "",
        description: "",
        total_amount: 0,
        status: 'draft',
      });
      setCustomerId('');
      setSelectedVehicleId('');
      setCustomerDetails(null);
    }
  }, [invoice, estimateData, reset]);

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails(customerId);
      fetchVehicleOptions(customerId);
    } else {
      setVehicleOptions([]);
      setSelectedVehicleId('');
    }
  }, [customerId, fetchVehicleOptions]);

  const fetchCustomerDetails = async (customerId: string) => {
    const selectedCustomer = customers?.find(c => c.id === customerId);
    if (selectedCustomer) {
      setCustomerDetails({
        first_name: selectedCustomer.first_name,
        last_name: selectedCustomer.last_name,
        email: selectedCustomer.email,
      });
    } else {
      setCustomerDetails(null);
    }
  };

  const fetchVehicleOptions = async (customerId: string) => {
    if (customerId) {
      const vehiclesForCustomer = await fetchVehiclesByCustomerId(customerId);
      const options = vehiclesForCustomer.map(vehicle => ({
        value: vehicle.id,
        label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      }));
      setVehicleOptions(options);
    } else {
      setVehicleOptions([]);
    }
  };

  const setVehicleId = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
  };

  const onSubmit = async (data: InvoiceFormValues) => {
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
      form.reset();
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

              <div className="space-y-2">
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={setCustomerId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
                {customerDetails && (
                  <div className="rounded-md border p-2 bg-muted">
                    <p className="text-sm font-medium">
                      {customerDetails.first_name} {customerDetails.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{customerDetails.email}</p>
                  </div>
                )}
                <FormMessage />
              </div>

              <div className="space-y-2">
                <FormItem>
                  <FormLabel>Vehicle</FormLabel>
                  <Select onValueChange={setVehicleId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vehicle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicleOptions.map((vehicle) => (
                        <SelectItem key={vehicle.value} value={vehicle.value}>
                          {vehicle.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
                <FormMessage />
              </div>

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
      </DialogContent>
    </Dialog>
  );
}
