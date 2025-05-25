
import { User } from '@supabase/supabase-js';

// Define valid auth event types
export type AuthEventType = 
  | 'sign_in' 
  | 'sign_out' 
  | 'sign_up' 
  | 'password_reset'
  | 'password_update';

export function useAuthLogging() {
  const logAuthEvent = async (eventType: AuthEventType, user: User | null, extraData: Record<string, any> = {}) => {
    try {
      // Create event data
      const eventData = {
        event_type: eventType,
        user_id: user?.id,
        email: user?.email,
        user_role: user?.user_metadata?.role,
        metadata: extraData,
        timestamp: new Date().toISOString(),
      };
      
      console.log('Auth event:', eventData);
      
      // Basic logging only - admin functionality removed
      console.log('Auth event logged:', eventType);
    } catch (err) {
      console.error('Error logging auth event:', err);
    }
  };

  return { logAuthEvent };
}
