
import { z } from "zod";
import { InvoiceStatus } from "../types";

const lineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be at least 0"),
  part_number: z.string().optional(),
  vendor: z.string().optional(),
});

export const invoiceFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  total_amount: z.number().min(0, "Total amount must be at least 0"),
  status: z.enum(["draft", "sent", "paid", "overdue", "void"] as const),
  lineItems: z.array(lineItemSchema).optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
