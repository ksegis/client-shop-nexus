
export type WorkOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface WorkOrder {
  id: string;
  title: string;
  description?: string;
  status: WorkOrderStatus;
  customer_id: string;
  vehicle_id: string;
  priority?: number;
  estimated_hours?: number;
  estimated_cost?: number;
  actual_hours?: number;
  actual_cost?: number;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  profiles?: any;
  vehicles?: any;
  estimate_id?: string; // Added for linking to estimates
}

export interface WorkOrderLineItem {
  id?: string;
  description: string;
  quantity: number;
  price: number;
  part_number?: string;
  vendor?: string;
  work_order_id?: string;
}

export interface WorkOrderFormValues {
  title: string;
  description?: string;
  status: WorkOrderStatus; // Updated to use WorkOrderStatus type
  customer_id: string;
  vehicle_id: string;
  priority?: number;
  estimated_hours?: number;
  estimated_cost?: number;
  actual_hours?: number;
  actual_cost?: number;
  assigned_to?: string;
  estimate_id?: string; // Added for linking to estimates
  lineItems?: WorkOrderLineItem[];
}
