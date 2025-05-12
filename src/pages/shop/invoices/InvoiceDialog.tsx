
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";

import { useCustomers } from "@/hooks/useCustomers";
import { useVehicles } from "@/hooks/useVehicles";
import { Invoice, InvoiceStatus } from "./types";
import { useInvoices } from "./InvoicesContext";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Estimate } from "../estimates/types";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const invoiceFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  total_amount: z.coerce.number(),
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
  const [openEstimates, setOpenEstimates] = useState<Estimate[]>([]);
  const [estimateSelectOpen, setEstimateSelectOpen] = useState(false);

  const { customers } = useCustomers();
  const { vehicles } = useVehicles();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      total_amount: 0,
      status: 'draft',
    },
  });

  // Fetch open estimates
  useEffect(() => {
    const fetchOpenEstimates = async () => {
      try {
        const { data, error } = await supabase
          .from('estimates')
          .select(`
            *,
            profiles!estimates_customer_id_fkey (
              first_name,
              last_name,
              email
            ),
            vehicles (
              make, 
              model, 
              year
            )
          `)
          .in('status', ['pending', 'approved']) // Only get pending or approved estimates
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching estimates:', error);
          setOpenEstimates([]);
          return;
        }
        
        // Transform the data to ensure it matches the Estimate type
        // Initialize with empty array if data is undefined
        const typedData = (data || []).map(item => {
          // Create a properly typed profiles object with null checks
          const profilesData = item.profiles ? {
            first_name: item.profiles.first_name || '',
            last_name: item.profiles.last_name || '',
            email: item.profiles.email || ''
          } : null;
          
          return {
            ...item,
            profiles: profilesData,
            vehicles: item.vehicles
          };
        }) as Estimate[];

        setOpenEstimates(typedData);
      } catch (error) {
        console.error('Error fetching estimates:', error);
        // Initialize with empty array on error
        setOpenEstimates([]);
      }
    };

    fetchOpenEstimates();
  }, []);

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
      setSourceEstimateId(invoice.estimate_id || null);
    } else if (estimateData) {
      form.reset({
        title: `Invoice for ${estimateData.title}`,
        description: estimateData.description || '',
        total_amount: estimateData.total_amount || 0,
        status: 'draft' as InvoiceStatus,
      });

      setCustomerId(estimateData.customer_id || '');
      setSelectedVehicleId(estimateData.vehicle_id || '');
      
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
      setSourceEstimateId(null);
    }
  }, [invoice, estimateData, form]);

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails(customerId);
      fetchVehicleOptions(customerId);
    } else {
      setVehicleOptions([]);
      setSelectedVehicleId('');
    }
  }, [customerId]);

  const fetchCustomerDetails = async (customerId: string) => {
    const selectedCustomer = customers?.find(c => c.id === customerId);
    if (selectedCustomer) {
      setCustomerDetails({
        first_name: selectedCustomer.first_name || undefined,
        last_name: selectedCustomer.last_name || undefined,
        email: selectedCustomer.email,
      });
    } else {
      setCustomerDetails(null);
    }
  };

  const fetchVehicleOptions = async (customerId: string) => {
    if (customerId) {
      // Filter vehicles by customer ID
      const customerVehicles = vehicles.filter(v => v.owner_id === customerId);
      
      const options = customerVehicles.map(vehicle => ({
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

  // Handle estimate selection
  const handleEstimateSelection = (estimateId: string) => {
    const selectedEstimate = openEstimates.find(est => est.id === estimateId);
    if (selectedEstimate) {
      setSourceEstimateId(selectedEstimate.id);
      
      // Populate form with estimate data
      form.setValue('title', `Invoice for ${selectedEstimate.title}`);
      form.setValue('description', selectedEstimate.description || '');
      form.setValue('total_amount', selectedEstimate.total_amount);
      
      // Set customer and vehicle
      if (selectedEstimate.customer_id) {
        setCustomerId(selectedEstimate.customer_id);
        fetchCustomerDetails(selectedEstimate.customer_id);
      }
      
      if (selectedEstimate.vehicle_id) {
        setSelectedVehicleId(selectedEstimate.vehicle_id);
        fetchVehicleOptions(selectedEstimate.customer_id);
      }
      
      toast({
        title: "Estimate Selected",
        description: "Invoice details populated from estimate",
      });
    }
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
            {!invoice && !estimateData && (
              <div className="space-y-2">
                <FormLabel>Reference Estimate (Optional)</FormLabel>
                <Popover open={estimateSelectOpen} onOpenChange={setEstimateSelectOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={estimateSelectOpen}
                      className="w-full justify-between"
                    >
                      {sourceEstimateId
                        ? `${openEstimates.find(est => est.id === sourceEstimateId)?.title || 'Selected estimate'} (#${sourceEstimateId.substring(0, 8)})`
                        : "Select an estimate..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0">
                    <Command>
                      <CommandInput placeholder="Search estimates..." />
                      <CommandEmpty>No estimates found.</CommandEmpty>
                      <CommandGroup>
                        {(openEstimates || []).map((estimate) => (
                          <CommandItem
                            key={estimate.id}
                            onSelect={() => {
                              handleEstimateSelection(estimate.id);
                              setEstimateSelectOpen(false);
                            }}
                            className="flex flex-col items-start py-3"
                          >
                            <div className="flex w-full justify-between">
                              <div className="font-medium">{estimate.title}</div>
                              <div className="text-muted-foreground text-sm">
                                {formatCurrency(estimate.total_amount)}
                              </div>
                            </div>
                            <div className="flex justify-between w-full text-xs text-muted-foreground mt-1">
                              <div>
                                {estimate.profiles ? `${estimate.profiles.first_name || ''} ${estimate.profiles.last_name || ''}`.trim() || estimate.profiles.email : 'Unknown customer'}
                              </div>
                              <div>
                                {estimate.vehicles ? `${estimate.vehicles.year} ${estimate.vehicles.make} ${estimate.vehicles.model}` : 'Unknown vehicle'}
                              </div>
                            </div>
                            {sourceEstimateId === estimate.id && (
                              <Check className="ml-auto h-4 w-4" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
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

              <div className="space-y-2">
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select value={customerId} onValueChange={setCustomerId}>
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
                  <Select value={selectedVehicleId} onValueChange={setVehicleId}>
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
