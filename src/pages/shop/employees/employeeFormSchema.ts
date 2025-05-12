
import { z } from 'zod';

// We need to define the roles as just 'staff' | 'admin' for the form
// since we don't want to let users directly select 'inactive_*' roles
export type FormRole = 'staff' | 'admin';

// Schema for creating new employees
export const createFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['staff', 'admin']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Schema for updating existing employees (password optional)
export const updateFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['staff', 'admin']),
  password: z.string().optional(),
});

export type EmployeeFormCreateValues = z.infer<typeof createFormSchema>;
export type EmployeeFormUpdateValues = z.infer<typeof updateFormSchema>;
