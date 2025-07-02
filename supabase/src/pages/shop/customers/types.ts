
export interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: 'customer' | 'staff' | 'admin';
  created_at: string;
  updated_at: string;
}
