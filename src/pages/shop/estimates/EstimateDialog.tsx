
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Estimate } from "./EstimatesContext";
import { Database } from "@/integrations/supabase/types";

const estimateFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  customer_id: z.string().min(1, "Customer is required"),
  vehicle_id: z.string().min(1, "Vehicle is required"),
  total_amount: z.coerce.number().min(0, "Amount must be positive"),
  status: z.enum(["pending", "approved", "declined", "completed"]),
});

type EstimateFormValues = z.infer<typeof estimateFormSchema>;

type Customer = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
};

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  owner_id: string;
};

interface EstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimate?: Estimate;
  onSubmit: (values: EstimateFormValues) => Promise<void>;
  mode: "create" | "edit";
}

export function EstimateDialog({ open, onOpenChange, estimate, onSubmit, mode }: EstimateDialogProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      title: estimate?.title || "",
      description: estimate?.description || "",
      customer_id: estimate?.customer_id || "",
      vehicle_id: estimate?.vehicle_id || "",
      total_amount: estimate?.total_amount || 0,
      status: estimate?.status || "pending",
    },
  });

  // Fetch customers for the dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("role", "customer");

      if (error) {
        console.error("Error fetching customers:", error);
      } else {
        setCustomers(data as Customer[]);
      }
    };

    if (open) {
      fetchCustomers();
    }
  }, [open]);

  // Fetch vehicles for the dropdown based on selected customer
  useEffect(() => {
    const customerId = form.watch("customer_id");
    
    if (customerId) {
      setSelectedCustomerId(customerId);
      const fetchVehicles = async () => {
        const { data, error } = await supabase
          .from("vehicles")
          .select("id, make, model, year, owner_id")
          .eq("owner_id", customerId);

        if (error) {
          console.error("Error fetching vehicles:", error);
        } else {
          setVehicles(data as Vehicle[]);
        }
      };

      fetchVehicles();
    }
  }, [form.watch("customer_id")]);

  // Reset form when the dialog opens/closes or estimate changes
  useEffect(() => {
    if (open) {
      if (estimate) {
        form.reset({
          title: estimate.title || "",
          description: estimate.description || "",
          customer_id: estimate.customer_id || "",
          vehicle_id: estimate.vehicle_id || "",
          total_amount: estimate.total_amount || 0,
          status: estimate.status || "pending",
        });
        setSelectedCustomerId(estimate.customer_id);
      } else {
        // Reset form for create mode
        form.reset({
          title: "",
          description: "",
          customer_id: "",
          vehicle_id: "",
          total_amount: 0,
          status: "pending",
        });
        setSelectedCustomerId(null);
      }
    }
  }, [open, estimate, form]);

  const handleSubmit = async (values: EstimateFormValues) => {
    try {
      await onSubmit(values);
      onOpenChange(false);
      form.reset(); // Reset the form after successful submission
    } catch (error) {
      console.error("Failed to submit estimate:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Estimate" : "Edit Estimate"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Estimate title" {...field} />
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
                      placeholder="Details about the estimate"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.first_name} {customer.last_name} ({customer.email})
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
                      value={field.value}
                      disabled={!selectedCustomerId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            selectedCustomerId 
                              ? "Select a vehicle" 
                              : "Select a customer first"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mode === "edit" && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value as Database["public"]["Enums"]["estimate_status"])}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {mode === "create" ? "Create" : "Update"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default EstimateDialog;
