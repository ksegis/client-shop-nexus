
import { z } from "zod";
import { Database } from "@/integrations/supabase/types";

// Line item schema
export const lineItemSchema = z.object({
  id: z.string().optional(), // For existing line items
  part_number: z.string().optional(),
  description: z.string().min(1, { message: "Description is required" }),
  quantity: z.coerce.number().min(1, { message: "Quantity must be at least 1" }),
  price: z.coerce.number().min(0, { message: "Price must be positive" }),
  vendor: z.string().optional(),
});

export const estimateSchema = z.object({
  customer_id: z.string().min(1, { message: "Customer is required" }),
  vehicle_id: z.string().min(1, { message: "Vehicle is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  total_amount: z.coerce.number().min(0, { message: "Amount must be positive" }).default(0),
  status: z.enum(["pending", "approved", "declined", "completed"])
    .default("pending") as z.ZodType<Database["public"]["Enums"]["estimate_status"]>,
  line_items: z.array(lineItemSchema).optional(),
});

export type EstimateFormValues = z.infer<typeof estimateSchema>;
export type LineItemValues = z.infer<typeof lineItemSchema>;
