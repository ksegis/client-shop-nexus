
import { useState, useEffect } from 'react';
import { sessionService } from '@/utils/sessionService';

/**
 * Hook for session management
 * @returns Session management utilities and state
 */
export function useSession() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<any>(null);

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

  // Check for anomalies
  const checkForAnomalies = async (userId: string) => {
    setLoading(true);
    try {
      const result = await sessionService.checkAnomalies(userId);
      setAnomalies(result);
      return result;
    } finally {
      setLoading(false);
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
