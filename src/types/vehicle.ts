
export interface Vehicle {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  vin: string;
  vehicle_type: 'car' | 'truck' | 'motorcycle' | 'other';
  mileage?: number;
  images: string[];
  created_at: string;
  updated_at: string;
}

// Exported types to maintain compatibility
export type VehicleWithId = Vehicle;
export type VehicleTypes = 'car' | 'truck' | 'motorcycle' | 'other';
