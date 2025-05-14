
import { User, Session } from '@supabase/supabase-js';

export function useAuthStateListener() {
  return { 
    user: null, 
    session: null, 
    loading: false, 
    roleLoaded: true,
    setLoading: () => {},
    updateUserWithRole: async () => {} 
  };
}
