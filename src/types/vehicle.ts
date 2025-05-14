
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
  images: string[];
  mileage: number;
  created_at: string;
  updated_at: string;
}

export interface NewVehicleData {
  make: string;
  model: string;
  year: number;
  vehicle_type: 'car' | 'truck' | 'motorcycle' | 'other';
  color?: string;
  license_plate?: string;
  vin?: string;
  mileage?: number;
  images?: string[];
}

export interface VehicleFilters {
  make?: string;
  model?: string;
  year?: number;
  vehicle_type?: 'car' | 'truck' | 'motorcycle' | 'other';
}
