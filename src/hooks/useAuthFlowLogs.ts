
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Define the structure for auth flow log events
export interface AuthFlowLogEvent {
  event_type: string;
  user_id?: string | null;
  email?: string | null;
  user_role?: string | null;
  route_path?: string | null;
  required_roles?: string[] | null;
  portal_type?: string | null;
  access_granted?: boolean | null;
  details?: Record<string, any> | null;
  session_id?: string;
}

// Generate a stable session ID for better tracking across page reloads
const getSessionId = () => {
  let sessionId = localStorage.getItem('auth_flow_session_id');
  
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('auth_flow_session_id', sessionId);
  }
  
  return sessionId;
};

export function useAuthFlowLogs() {
  const logAuthFlowEvent = useCallback(async (event: AuthFlowLogEvent) => {
    try {
      // Add session ID and timestamp
      const sessionId = getSessionId();
      const clientTimestamp = new Date().toISOString();
      
      // Log to console for immediate visibility (always works even if DB logging fails)
      console.log(`🔍 Auth Flow Event [${event.event_type}]:`, {
        ...event,
        session_id: sessionId,
        client_timestamp: clientTimestamp
      });
      
      // Try to insert into database - but don't let errors disrupt the app flow
      try {
        const { error } = await supabase
          .from('auth_flow_logs')
          .insert({
            ...event,
            session_id: sessionId,
            client_timestamp: clientTimestamp
          });
        
        if (error) {
          // Just log the error to console without throwing
          console.error('Error logging auth flow event:', error);
        }
      } catch (dbError) {
        // Silently catch database errors to prevent disrupting the auth flow
        console.error('Failed to write to auth_flow_logs table:', dbError);
      }
      
      return { success: true };
    } catch (err) {
      // Log any other errors but don't disrupt the app
      console.error('Failed to log auth flow event:', err);
      return { success: false, error: err };
    }
  }, []);
  
  return { logAuthFlowEvent };
}
