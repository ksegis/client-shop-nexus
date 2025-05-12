
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { z } from "zod";
import { invoiceFormSchema } from "../InvoiceFormSchema";

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface BasicInfoSectionProps {
  control: Control<InvoiceFormValues>;
}

export function BasicInfoSection({ control }: BasicInfoSectionProps) {
  return (
    <FormField
      control={control}
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
  );
}
