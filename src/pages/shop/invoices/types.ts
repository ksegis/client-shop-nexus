
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';

export type InvoiceLineItem = {
  id?: string;
  description: string;
  quantity: number;
  price: number;
  part_number?: string;
  vendor?: string;
  core_charge?: number;
};

export interface Invoice {
  id: string;
  customer_id: string;
  vehicle_id: string;
  title: string;
  description?: string;
  total_amount: number;
  status: InvoiceStatus;
  created_at: string;
  updated_at: string;
  estimate_id?: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
  vehicles?: {
    make: string;
    model: string;
    year: number;
  };
  lineItems?: InvoiceLineItem[];
}

export interface InvoiceFormValues {
  title: string;
  description?: string;
  total_amount: number;
  status: InvoiceStatus;
}
