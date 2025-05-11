
import { Database } from '@/integrations/supabase/types';

export type Estimate = Database['public']['Tables']['estimates']['Row'] & {
  vehicles?: {
    make: string;
    model: string;
    year: number;
  };
  customer?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  line_items?: {
    id: string;
    description: string;
    quantity: number;
    price: number;
    part_number?: string | null;
    vendor?: string | null;
  }[];
};

export type EstimateStatus = Database['public']['Enums']['estimate_status'];
