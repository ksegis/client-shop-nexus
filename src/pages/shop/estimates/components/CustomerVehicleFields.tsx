
import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { EstimateFormValues } from "../schemas/estimateSchema";

interface CustomerVehicleFieldsProps {
  form: UseFormReturn<EstimateFormValues>;
  customers: any[];
  vehicles: any[];
  mode: "create" | "edit";
}

export function CustomerVehicleFields({ 
  form, 
  customers, 
  vehicles, 
  mode 
}: CustomerVehicleFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="customer_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Customer</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={mode === "edit"}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {`${customer.first_name || ""} ${customer.last_name || ""}`
                      .trim() || customer.email}
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
              value={field.value}
              disabled={mode === "edit" || !form.watch("customer_id")}
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
  );
}
