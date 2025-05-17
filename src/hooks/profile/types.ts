
export interface ProfileData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url?: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  mfa_enabled?: boolean;
  mfa_secret?: string;
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  role?: string;
  mfa_enabled?: boolean;
  mfa_secret?: string;
}
