
export interface Part {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  cost?: number;
  quantity: number;
  reorder_level?: number;
  supplier?: string;
  location?: string;
  is_special_order?: boolean;
  core_charge?: number;
  weight?: number;
  dimensions?: string;
  manufacturer?: string;
  compatibility?: string[];
  images?: string[];
  markup_percentage?: number; // New field for markup calculation
  list_price?: number; // New field for list price
  created_at: string;
  updated_at: string;
}

export interface PartCategory {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  markup_percentage?: number; // Category-level markup
}

export interface PartSearchFilters {
  category?: string;
  compatibility?: string;
  manufacturer?: string;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface PartOrderItem {
  part_id: string;
  quantity: number;
  price: number;
  core_charge?: number;
  special_order?: boolean;
  notes?: string;
}

export type PartOrderStatus = 
  | 'pending' 
  | 'processing' 
  | 'backordered' 
  | 'ready' 
  | 'delivered' 
  | 'cancelled';

export interface PartOrder {
  id: string;
  customer_id: string;
  status: PartOrderStatus;
  items: PartOrderItem[];
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  estimated_delivery?: string;
}

export interface CoreCharge {
  id: string;
  part_id: string;
  amount: number;
  is_refundable: boolean;
  description: string;
}

export interface PartReturn {
  id: string;
  order_item_id: string;
  return_date: string;
  reason: string;
  condition: 'new' | 'used' | 'damaged';
  approved: boolean;
  refund_amount: number;
  processed_by?: string;
}

export interface PartQuotation {
  id: string;
  customer_id?: string;
  customer_name?: string;
  items: PartOrderItem[];
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  total: number;
  valid_until: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
