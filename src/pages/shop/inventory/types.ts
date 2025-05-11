
import { z } from 'zod';

export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  quantity: number;
  price: number;
  cost: number | null;
  category: string | null;
  supplier: string | null;
  reorder_level: number | null;
  created_at: string;
  updated_at: string;
}

export const inventoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  price: z.number().min(0, 'Price cannot be negative'),
  cost: z.number().min(0, 'Cost cannot be negative').optional().nullable(),
  category: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
  reorder_level: z.number().min(0, 'Reorder level cannot be negative').optional().nullable(),
});

export type InventoryFormValues = z.infer<typeof inventoryFormSchema>;
