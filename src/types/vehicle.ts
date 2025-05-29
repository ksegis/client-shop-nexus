
export interface Vehicle {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  vin?: string;
  license_plate?: string;
  vehicle_type: 'car' | 'truck' | 'motorcycle' | 'other';
  images?: string[];
  created_at: string;
  updated_at: string;
}
