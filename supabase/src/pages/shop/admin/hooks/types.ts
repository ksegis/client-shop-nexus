
export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'customer' | 'staff' | 'admin';
  sendWelcomeEmail: boolean;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: 'customer' | 'staff' | 'admin';
  active?: boolean;
}
