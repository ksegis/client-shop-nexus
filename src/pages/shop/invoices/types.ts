
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void' | 'overdue';

export interface Invoice {
  id: string;
  title: string;
  description?: string;
  total_amount: number;
  status: InvoiceStatus;
  customer_id: string;
  vehicle_id: string;
  staff_id?: string;
  created_at: string;
  updated_at: string;
  estimate_id?: string; // Added to reference the original estimate
  vehicles?: {
    make: string;
    model: string;
    year: number;
  };
  profiles?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
}
