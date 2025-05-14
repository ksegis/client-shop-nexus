
import { Vehicle, NewVehicleData } from '@/types/vehicle';

export const useMockVehicles = () => {
  const getMockVehicles = (): Vehicle[] => {
    return [
      {
        id: 'mock-vehicle-1',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vehicle_type: 'car',
        color: 'Silver',
        license_plate: 'ABC123',
        vin: '1HGBH41JXMN109186',
        owner_id: 'mock-user-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        mileage: 45000
      },
      {
        id: 'mock-vehicle-2',
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        vehicle_type: 'car',
        color: 'Blue',
        license_plate: 'XYZ789',
        vin: '2FMDK3GC4BBA52681',
        owner_id: 'mock-user-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        mileage: 32000
      }
    ];
  };

  const createMockVehicle = (vehicleData: NewVehicleData, ownerId: string): Vehicle => {
    return {
      id: `mock-vehicle-${Date.now()}`,
      ...vehicleData,
      owner_id: ownerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  };

  return { getMockVehicles, createMockVehicle };
};
