
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Define valid auth event types
export type AuthEventType = 
  | 'sign_in' 
  | 'sign_out' 
  | 'sign_up' 
  | 'password_reset'
  | 'password_update'
  | 'impersonate_test_user'  // Add this to fix the error
  | 'stop_impersonation';    // Add this to fix the error

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
      
      // Store event in Supabase if connected
      try {
        const { error } = await supabase
          .from('auth_logs')
          .insert({ 
            event_type: eventType,
            user_id: user?.id, 
            email: user?.email,
            metadata: { ...extraData, user_metadata: user?.user_metadata }
          });
        
        if (error && !error.message.includes('does not exist')) {
          console.error('Error logging auth event:', error);
        }
      } catch (err) {
        // Silently catch if auth_logs table doesn't exist
      }
      
      console.log('Auth event logged:', eventType);
    } catch (err) {
      console.error('Error logging auth event:', err);
    }
  };

  return { logAuthEvent };
}
