
import { Database } from "@/integrations/supabase/types";

export type EstimateStatus = Database["public"]["Enums"]["estimate_status"];

export interface Estimate {
  id: string;
  title: string;
  description: string | null;
  total_amount: number;
  status: EstimateStatus;
  customer_id: string;
  vehicle_id: string;
  staff_id: string | null;
  created_at: string;
  updated_at: string;
  vehicles?: {
    make: string;
    model: string;
    year: number;
  };
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export interface LineItem {
  part_number?: string;
  description: string;
  quantity: number;
  price: number;
  vendor?: string;
}

export interface EstimateWithItems extends Estimate {
  estimate_items?: LineItem[];
}

export interface EstimateStats {
  pending: {
    count: number;
    value: number;
  };
  approved: {
    count: number;
    value: number;
  };
  declined: {
    count: number;
    value: number;
  };
  completed: {
    count: number;
    value: number;
  };
}
