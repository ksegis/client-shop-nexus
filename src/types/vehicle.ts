
export type VehicleType = 'car' | 'truck' | 'motorcycle' | 'other';

export interface Vehicle {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  vin: string;
  license_plate: string;
  vehicle_type: VehicleType;
  images: string[];
  mileage: number;
  created_at: string;
  updated_at: string;
}

export interface NewVehicleData {
  make: string;
  model: string;
  year: number;
  color: string;
  vin?: string;
  license_plate?: string;
  vehicle_type: VehicleType;
  mileage: number;
  images?: string[];
}

export interface VehicleState {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  isLoading: boolean;
  error: Error | null;
}
