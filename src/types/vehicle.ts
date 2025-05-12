
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: string; // Keep this as string to match the interface used elsewhere
  vin: string;
  color?: string;
  license_plate?: string;
  owner_id: string;
  vehicle_type: 'car' | 'truck' | 'motorcycle' | 'other';
  created_at: string;
  updated_at: string;
  images?: string[] | null; // Array of image URLs
}

export type NewVehicleData = Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'owner_id' | 'images'>;
