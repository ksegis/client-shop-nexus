
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export type AuthEventType = 
  | 'sign_in'
  | 'sign_out'
  | 'sign_up'
  | 'password_reset'
  | 'password_update'
  | 'impersonation_start'
  | 'impersonation_end'
  | 'token_refresh';

export function useAuthLogging() {
  const logAuthEvent = useCallback(async (
    eventType: AuthEventType,
    user: User | null,
    metadata: Record<string, any> = {}
  ) => {
    try {
      // Skip logging for dev users
      if (user && user.id.startsWith('mock') || user?.id.startsWith('test')) {
        return;
      }
      
      // Since auth_logs table doesn't exist yet, just log to console
      console.log('Auth event:', {
        event_type: eventType,
        user_id: user?.id,
        email: user?.email,
        user_role: user?.user_metadata?.role || metadata.role,
        metadata,
        timestamp: new Date().toISOString()
      });
        
      console.log(`Auth event logged: ${eventType}`);
    } catch (error) {
      // Don't let logging errors disrupt the user experience
      console.error('Error logging auth event:', error);
    }
  }, []);
  
  return { logAuthEvent };
}
