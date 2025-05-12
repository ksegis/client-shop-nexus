
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { z } from "zod";
import { invoiceFormSchema } from "../InvoiceFormSchema";

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface AmountSectionProps {
  control: Control<InvoiceFormValues>;
}

export function AmountSection({ control }: AmountSectionProps) {
  return (
    <FormField
      control={control}
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
  );
}
