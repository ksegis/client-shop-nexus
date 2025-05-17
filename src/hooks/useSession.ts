
import { useState, useEffect } from 'react';
import { sessionService } from '@/utils/sessionService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';

/**
 * Hook for session management
 * @returns Session management utilities and state
 */
export function useSession() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<any>(null);
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
      // Fix: Ensure result exists and get the first item if it's an array
      if (result && (Array.isArray(result) ? result[0]?.new_device : result.new_device)) {
        toast({
          title: "Security Alert",
          description: "New device detected accessing your account. If this wasn't you, please secure your account.",
          variant: "destructive",
        });
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [user, toast]);

  // Check for anomalies
  const checkForAnomalies = async (userId: string) => {
    try {
      const result = await sessionService.checkAnomalies(userId);
      // Store the result in state, handling the case of it being an array
      const anomalyData = Array.isArray(result) ? result[0] : result;
      setAnomalies(anomalyData);
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
