
import { useSupabaseAuth } from '../SupabaseAuthProvider';

export function useAuth() {
  return useSupabaseAuth();
}
