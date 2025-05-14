
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
  created_at: string;
  updated_at: string;
}

export interface PartCategory {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
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
