
import { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface CustomerVehicleSectionProps {
  customerId: string;
  setCustomerId: (id: string) => void;
  selectedVehicleId: string;
  setVehicleId: (id: string) => void;
  customerDetails: { first_name?: string; last_name?: string; email: string; } | null;
  vehicleOptions: { value: string; label: string; }[];
  customers?: any[];
}

export function CustomerVehicleSection({
  customerId,
  setCustomerId,
  selectedVehicleId,
  setVehicleId,
  customerDetails,
  vehicleOptions,
  customers = []
}: CustomerVehicleSectionProps) {
  
  return (
    <>
      <div className="space-y-2">
        <FormItem>
          <FormLabel>Customer</FormLabel>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
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
            <SelectTrigger>
              <SelectValue placeholder="Select a vehicle" />
            </SelectTrigger>
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
    </>
  );
}
