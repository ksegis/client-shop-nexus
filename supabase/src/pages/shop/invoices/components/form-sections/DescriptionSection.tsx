
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";
import { z } from "zod";
import { invoiceFormSchema } from "../InvoiceFormSchema";

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface DescriptionSectionProps {
  control: Control<InvoiceFormValues>;
}

export function DescriptionSection({ control }: DescriptionSectionProps) {
  return (
    <FormField
      control={control}
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
  );
}
