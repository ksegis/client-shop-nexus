
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook for logging auth flow events
 */
export const useAuthFlowLogs = () => {
  const location = useLocation();
  const sessionId = useRef<string>(Math.random().toString(36).substring(2, 15)); // Simple session ID for tracking page flow

  // Log the navigation event
  useEffect(() => {
    const logNavigation = async () => {
      try {
        // Skip logging for API paths or asset files
        if (location.pathname.startsWith('/api/') || 
            location.pathname.includes('.')) {
          return;
        }
        
        // Get current user if available
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from('auth_flow_logs').insert({
          event_type: 'navigation',
          user_id: user?.id || null,
          email: user?.email || null,
          session_id: sessionId.current,
          route_path: location.pathname,
          client_timestamp: new Date().toISOString(),
          details: {
            from: document.referrer,
            user_agent: navigator.userAgent,
          }
        });
      } catch (error) {
        // Silent fail - logging should never break the app
        console.error('Failed to log navigation:', error);
      }
    };

    // Log navigation events but don't block UI
    logNavigation();
  }, [location.pathname]);

  /**
   * Log an authentication flow event
   */
  const logAuthFlowEvent = async (eventType: string, details: Record<string, any> = {}) => {
    try {
      // Get current user if available
      const { data: { user } } = await supabase.auth.getUser();

      // Get profile role if user exists
      let role = null;
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        role = profile?.role;
      }

      await supabase.from('auth_flow_logs').insert({
        event_type: eventType,
        user_id: user?.id || null,
        email: user?.email || null,
        user_role: role,
        session_id: sessionId.current,
        route_path: location.pathname,
        client_timestamp: new Date().toISOString(),
        details
      });
    } catch (error) {
      // Silent fail - logging should never break the app
      console.error('Failed to log auth flow event:', error);
    }
  };

  return { logAuthFlowEvent, sessionId: sessionId.current };
};
