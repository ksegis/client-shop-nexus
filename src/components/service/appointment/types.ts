
import { z } from 'zod';
import { NewAppointmentData } from '@/hooks/useServiceAppointments';

export const serviceTypes = [
  { value: 'maintenance', label: 'Routine Maintenance' },
  { value: 'repair', label: 'Repair Service' },
  { value: 'diagnostic', label: 'Diagnostic Check' },
  { value: 'inspection', label: 'Vehicle Inspection' },
  { value: 'tire', label: 'Tire Service' },
  { value: 'oil', label: 'Oil Change' },
  { value: 'other', label: 'Other' }
];

export const formSchema = z.object({
  customer_id: z.string({
    required_error: "Please select a customer",
  }),
  vehicle_id: z.string({
    required_error: "Please select a vehicle",
  }),
  appointment_date: z.date({
    required_error: "Please select a date",
  }),
  appointment_time: z.string({
    required_error: "Please select an appointment time",
  }),
  service_type: z.string({
    required_error: "Please select the type of service",
  }),
  description: z.string()
    .min(5, "Please provide a brief description of the service needed")
    .max(500, "Description is too long"),
  contact_email: z.string()
    .email("Please enter a valid email address"),
  contact_phone: z.string()
    .optional(),
  override_contact: z.boolean()
    .default(false),
});

export type FormValues = z.infer<typeof formSchema>;

export interface AppointmentFormProps {
  onSubmit: (data: NewAppointmentData) => Promise<void>;
  customerId?: string;
}
