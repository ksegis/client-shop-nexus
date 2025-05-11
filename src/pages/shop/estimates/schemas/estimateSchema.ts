
import { z } from "zod";
import { Database } from "@/integrations/supabase/types";

export const estimateFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  customer_id: z.string().min(1, "Customer is required"),
  vehicle_id: z.string().min(1, "Vehicle is required"),
  total_amount: z.coerce.number().min(0, "Amount must be positive"),
  status: z.enum(["pending", "approved", "declined", "completed"]),
});

export type EstimateFormValues = z.infer<typeof estimateFormSchema>;

export type EstimateStatus = Database["public"]["Enums"]["estimate_status"];
