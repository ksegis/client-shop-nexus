
import { Database } from "@/integrations/supabase/types";

export type Invoice = Database['public']['Tables']['invoices']['Row'] & {
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
};

export type InvoiceStatus = Database['public']['Enums']['invoice_status'];

export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];
