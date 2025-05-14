
export interface Vehicle {
  id: string;
  owner_id: string;
  year: number;
  make: string;
  model: string;
  color?: string;
  vin?: string;
  license_plate?: string;
  vehicle_type: 'car' | 'truck' | 'motorcycle' | 'other';
  images?: string[];
  created_at: string;
  updated_at: string;
  mileage?: number; // Ensure mileage property is defined
}

export type VehicleFormData = {
  year: number;
  make: string;
  model: string;
  color?: string;
  vin?: string;
  license_plate?: string;
  vehicle_type: 'car' | 'truck' | 'motorcycle' | 'other';
  mileage?: number; // Ensure mileage property is defined
};

// Add NewVehicleData type that was missing
export type NewVehicleData = Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'owner_id' | 'images'>;
