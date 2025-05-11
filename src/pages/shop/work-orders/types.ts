
export type WorkOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Customer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string | null;
  license_plate: string | null;
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string | null;
  status: WorkOrderStatus;
  customer_id: string;
  vehicle_id: string;
  estimated_hours: number | null;
  estimated_cost: number | null;
  actual_hours: number | null;
  actual_cost: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  priority: number;
  assigned_to: string | null;
  
  // Joined data
  customer?: Customer;
  vehicle?: Vehicle;
}
