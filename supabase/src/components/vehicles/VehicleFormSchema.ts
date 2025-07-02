
import { z } from 'zod';

export const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.string()
    .min(4, 'Year must be 4 digits')
    .max(4, 'Year must be 4 digits')
    .refine(val => !isNaN(Number(val)) && Number(val) >= 1900 && Number(val) <= new Date().getFullYear() + 1, {
      message: `Year must be between 1900 and ${new Date().getFullYear() + 1}`
    }),
  vin: z.string().optional(),
  license_plate: z.string().optional(),
  color: z.string().optional(),
  vehicle_type: z.enum(['car', 'truck', 'motorcycle', 'other']),
  mileage: z.string().optional().refine(val => !val || !isNaN(Number(val)), {
    message: 'Mileage must be a number'
  }),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;

export const getDefaultVehicleFormValues = (): VehicleFormValues => ({
  make: '',
  model: '',
  year: '',
  vehicle_type: 'car',
  vin: '',
  license_plate: '',
  color: '',
  mileage: '',
});
