import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Estimate } from "../EstimatesContext";
import { estimateFormSchema, EstimateFormValues, EstimateStatus } from "../schemas/estimateSchema";
import { useEstimateFormData } from "../hooks/useEstimateFormData";

interface EstimateFormProps {
  estimate?: Estimate;
  onSubmit: (values: EstimateFormValues) => Promise<void>;
  onCancel: () => void;
  mode: "create" | "edit";
}

export function EstimateForm({ estimate, onSubmit, onCancel, mode }: EstimateFormProps) {
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
  
  const selectedCustomerId = form.watch("customer_id");
  const { customers, vehicles, isLoading } = useEstimateFormData(selectedCustomerId);

  // Reset form when the dialog opens/closes or estimate changes
  useEffect(() => {
    if (estimate) {
      form.reset({
        title: estimate.title || "",
        description: estimate.description || "",
        customer_id: estimate.customer_id || "",
        vehicle_id: estimate.vehicle_id || "",
        total_amount: estimate.total_amount || 0,
        status: estimate.status || "pending",
      });
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
    }
  }, [estimate, form]);

  async function handleFormSubmit(values: EstimateFormValues) {
    try {
      await onSubmit(values);
    } catch (error) {
      console.error("Failed to submit estimate:", error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
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
                  disabled={isLoading}
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
                  disabled={!selectedCustomerId || isLoading}
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
                    onValueChange={(value) => field.onChange(value as EstimateStatus)}
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
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">
            {mode === "create" ? "Create" : "Update"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
