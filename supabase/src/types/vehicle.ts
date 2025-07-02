
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
  mileage?: number;
  created_at: string;
  updated_at: string;
}

export type NewVehicleData = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;
