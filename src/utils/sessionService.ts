import { supabase } from '@/integrations/supabase/client';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { useEffect } from 'react';

/**
 * Service for managing user sessions
 */
export const sessionService = {
  /**
   * Tracks a user session by creating or updating a session record
   * @returns The session data
   */
  trackSession: async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('Cannot track session: No authenticated user');
        return null;
      }
      
      // Generate device fingerprint
      const fp = await FingerprintJS.load();
      const { visitorId } = await fp.get();
      
      // Create or update session
      const { data, error } = await supabase.from('user_sessions').upsert({
        user_id: user.id,
        device_hash: visitorId,
        ip_address: '', // Will be filled by server-side RLS function
        user_agent: navigator.userAgent,
        last_active: new Date().toISOString(),
        is_active: true
      }).select();
      
      if (error) {
        console.error('Session tracking error:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to track session:', error);
      return null;
    }
  },

  /**
   * Gets all active sessions for the current user
   * @returns Array of active sessions
   */
  getActiveSessions: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];
    
    const { data } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('last_active', { ascending: false });
      
    return data || [];
  },

  /**
   * Updates the last active timestamp for the current session
   * @param sessionId The ID of the session to update
   */
  updateSessionActivity: async (sessionId: string) => {
    const { error } = await supabase
      .from('user_sessions')
      .update({ last_active: new Date().toISOString() })
      .eq('id', sessionId);
      
    if (error) {
      console.error('Failed to update session activity:', error);
    }
  },

  /**
   * Terminates a specific session
   * @param sessionId The ID of the session to terminate
   * @returns Success status
   */
  terminateSession: async (sessionId: string) => {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);
      
    return !error;
  },

  /**
   * Terminates all sessions except the current one
   * @param currentSessionId The ID of the current session to keep active
   * @returns Success status
   */
  terminateOtherSessions: async (currentSessionId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .neq('id', currentSessionId);
      
    return !error;
  },

  /**
   * Checks for anomalies in user sessions (multiple locations, unusual activity)
   * This requires a server-side function to be implemented
   * @param userId The user ID to check
   * @returns Anomaly data if found
   */
  checkAnomalies: async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-session-anomalies', {
        body: { user_id: userId }
      });
      
      if (error) {
        console.error('Failed to check session anomalies:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Session anomaly check error:', error);
      return null;
    }
  }
};

// Hook to track session on mount or login
export const useSessionTracking = () => {
  useEffect(() => {
    // Track session on component mount
    sessionService.trackSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Track session on login
      if (event === 'SIGNED_IN') {
        sessionService.trackSession();
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
};
