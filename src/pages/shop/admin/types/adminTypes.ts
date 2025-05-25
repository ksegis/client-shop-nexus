
export interface AdminUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: 'customer' | 'staff' | 'admin';
  active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  force_password_change?: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  target_user_id?: string;
  performed_by: string;
  timestamp: string;
  description?: string;
  metadata?: any;
  target_user_email?: string;
  performed_by_email?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'customer' | 'staff' | 'admin';
  sendWelcomeEmail: boolean;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: 'customer' | 'staff' | 'admin';
  active?: boolean;
}
