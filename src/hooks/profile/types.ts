
import { ExtendedUserRole } from '@/integrations/supabase/types-extensions';

export type ProfileData = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: ExtendedUserRole;
  created_at: string;
  updated_at: string;
  avatar_url?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
};

export type ProfileUpdateData = Partial<Omit<ProfileData, 'id' | 'email' | 'created_at' | 'updated_at' | 'role'>> & {
  role?: ExtendedUserRole;
};
