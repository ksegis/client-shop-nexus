
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
              type="text"
              inputMode="decimal"
              {...field} 
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, '');
                field.onChange(value === '' ? 0 : parseFloat(value));
              }}
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
