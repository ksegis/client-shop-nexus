
import { useState, useEffect } from 'react';
import { sessionService } from '@/utils/sessionService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/lib/supabase';

// Define types for session anomalies
interface SessionAnomaly {
  simultaneous_sessions: number;
  new_device: boolean;
  suspicious_location: boolean;
}

/**
 * Hook for session management
 * @returns Session management utilities and state
 */
export function useSession() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<SessionAnomaly | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load sessions on mount
  useEffect(() => {
    async function initializeSession() {
      try {
        setLoading(true);
        // Track the current session
        const trackResult = await sessionService.trackSession();
        setCurrentSession(trackResult?.[0] || null);
        
        // Get all active sessions
        const userSessions = await sessionService.getActiveSessions();
        setSessions(userSessions || []);
      } catch (error) {
        console.error('Session initialization error:', error);
      } finally {
        setLoading(false);
      }
    }

    initializeSession();
  }, []);

  // Periodic session check for security monitoring
  useEffect(() => {
    if (!user?.id) return;
    
    const interval = setInterval(async () => {
      await sessionService.trackSession();
      
      const result = await checkForAnomalies(user.id);
      if (result?.new_device) {
        createSecurityAlert(user.id, 'new_device', {
          message: 'New device detected accessing your account',
          device: navigator.userAgent,
          timestamp: new Date().toISOString()
        });
        
        toast({
          title: "Security Alert",
          description: "New device detected accessing your account. If this wasn't you, please secure your account.",
          variant: "destructive",
        });
      }
      
      // Check for other security anomalies
      if (result?.suspicious_location) {
        createSecurityAlert(user.id, 'impossible_travel', {
          message: 'Login detected from unusual location',
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [user, toast]);

  // Create security alert
  const createSecurityAlert = async (userId: string, alertType: string, metadata: any) => {
    try {
      await supabase.from('security_alerts').insert({
        user_id: userId,
        alert_type: alertType,
        metadata
      });
    } catch (error) {
      console.error('Failed to create security alert:', error);
    }
  };

  // Check for anomalies
  const checkForAnomalies = async (userId: string): Promise<SessionAnomaly | null> => {
    try {
      const result = await sessionService.checkAnomalies(userId);
      
      // Process the result, which could be an array or a single object
      let anomalyData: SessionAnomaly | null = null;
      
      if (Array.isArray(result)) {
        anomalyData = result[0] || null;
      } else {
        anomalyData = result;
      }
      
      setAnomalies(anomalyData);
      
      // Check if we need to create a security alert for multiple sessions
      if (anomalyData && anomalyData.simultaneous_sessions > 5) {
        createSecurityAlert(userId, 'multiple_failures', {
          message: `Unusual number of simultaneous sessions (${anomalyData.simultaneous_sessions})`,
          timestamp: new Date().toISOString()
        });
      }
      
      return anomalyData;
    } catch (error) {
      console.error('Failed to check for session anomalies:', error);
      return null;
    }
  };

  // Terminate a specific session
  const terminateSession = async (sessionId: string) => {
    const result = await sessionService.terminateSession(sessionId);
    if (result) {
      // Update local state to reflect the change
      setSessions(sessions.filter(session => session.id !== sessionId));
    }
    return result;
  };

  // Terminate all other sessions
  const terminateOtherSessions = async () => {
    if (!currentSession) return false;
    
    const result = await sessionService.terminateOtherSessions(currentSession.id);
    if (result) {
      // Update local state to reflect the change
      setSessions(sessions.filter(session => session.id === currentSession.id));
    }
    return result;
  };

  return {
    sessions,
    currentSession,
    loading,
    anomalies,
    checkForAnomalies,
    terminateSession,
    terminateOtherSessions,
  };
}
