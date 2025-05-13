
import { ExtendedUserRole } from '@/integrations/supabase/types-extensions';

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: ExtendedUserRole;
  created_at: string;
  updated_at: string;
  force_password_change?: boolean;
}

export interface InviteUserFormValues {
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "staff"; // Restricting to valid role values
  password: string;
}

export interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}
