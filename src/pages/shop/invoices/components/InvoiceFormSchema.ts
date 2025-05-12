
import * as z from "zod";

// Invoice form schema
export const invoiceFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  total_amount: z.coerce.number(),
  status: z.enum(['draft', 'sent', 'paid', 'void', 'overdue']),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
