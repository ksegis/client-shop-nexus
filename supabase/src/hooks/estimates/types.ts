
export interface LineItem {
  id: string;
  part_number?: string;
  description: string;
  quantity: number;
  price: number;
  approved: boolean;
}

export interface EstimateData {
  id: string;
  date: string;
  vehicle: string;
  status: 'pending' | 'approved' | 'declined' | 'completed';
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  workOrderStatus: string | null;
}

export interface RelatedInvoice {
  id: string;
  title: string;
  status: string;
}
