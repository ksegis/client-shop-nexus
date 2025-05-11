
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useInvoices } from "./InvoicesContext";
import { Invoice, InvoiceStatus } from "./types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceDialogProps {
  invoice?: Invoice;
  open: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  customer_id: z.string().min(1, { message: "Customer is required" }),
  vehicle_id: z.string().min(1, { message: "Vehicle is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  total_amount: z.coerce.number().min(0, { message: "Amount must be positive" }),
  status: z.enum(["draft", "pending", "paid", "overdue"]),
});

type FormValues = z.infer<typeof formSchema>;

export function InvoiceDialog({ invoice, open, onClose }: InvoiceDialogProps) {
  const { createInvoice, updateInvoice } = useInvoices();
  const isEditing = !!invoice;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: invoice?.customer_id || "",
      vehicle_id: invoice?.vehicle_id || "",
      title: invoice?.title || "",
      description: invoice?.description || "",
      total_amount: invoice?.total_amount || 0,
      status: invoice?.status || "draft",
    },
  });

  // Reset form when the dialog opens or invoice changes
  useEffect(() => {
    if (open) {
      form.reset({
        customer_id: invoice?.customer_id || "",
        vehicle_id: invoice?.vehicle_id || "",
        title: invoice?.title || "",
        description: invoice?.description || "",
        total_amount: invoice?.total_amount || 0,
        status: invoice?.status || "draft",
      });
    }
  }, [open, invoice, form]);

  // Fetch customers for the dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('role', 'customer');
      return data || [];
    },
  });

  // Fetch vehicles for the dropdown
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', form.watch('customer_id')],
    queryFn: async () => {
      const customerId = form.watch('customer_id');
      if (!customerId) return [];
      
      const { data } = await supabase
        .from('vehicles')
        .select('id, make, model, year')
        .eq('owner_id', customerId);
      return data || [];
    },
    enabled: !!form.watch('customer_id'),
  });

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && invoice) {
        await updateInvoice(invoice.id, {
          title: values.title,
          description: values.description,
          total_amount: values.total_amount,
          status: values.status as InvoiceStatus,
        });
      } else {
        await createInvoice({
          customer_id: values.customer_id,
          vehicle_id: values.vehicle_id,
          title: values.title,
          description: values.description,
          total_amount: values.total_amount,
          status: values.status as InvoiceStatus,
        });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save invoice:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isEditing || !form.watch('customer_id')}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Invoice title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Invoice description"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
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
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Update Invoice" : "Create Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default InvoiceDialog;
