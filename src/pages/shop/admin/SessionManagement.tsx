
import React, { useEffect, useState } from 'react';
import { useAuth } from "@/contexts/auth";
import { useSession } from "@/hooks/useSession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sessionService } from "@/utils/sessionService";
import { SecurityStatus } from './components/SecurityStatus';
import { SessionsList } from './components/SessionsList';

const SessionManagement: React.FC = () => {
  const { user, profile } = useAuth();
  const { sessions, currentSession, loading, anomalies, checkForAnomalies, terminateSession, terminateOtherSessions } = useSession();
  const [isChecking, setIsChecking] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (user?.id) {
      checkForAnomalies(user.id);
    }
  }, [user?.id]);
  
  const handleCheck = async () => {
    if (!user?.id) return;
    
    setIsChecking(true);
    try {
      await checkForAnomalies(user.id);
      toast({
        title: "Session check completed",
        description: "Session security check has been completed",
      });
    } catch (error) {
      toast({
        title: "Check failed",
        description: "Could not complete security check",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  const handleTerminate = async (sessionId: string) => {
    const result = await terminateSession(sessionId);
    if (result) {
      toast({
        title: "Session terminated",
        description: "The session has been terminated successfully",
      });
    } else {
      toast({
        title: "Failed to terminate",
        description: "Could not terminate the session",
        variant: "destructive",
      });
    }
  };
  
  const handleTerminateOthers = async () => {
    const result = await terminateOtherSessions();
    if (result) {
      toast({
        title: "All other sessions terminated",
        description: "All sessions except the current one have been terminated",
      });
    } else {
      toast({
        title: "Failed to terminate",
        description: "Could not terminate other sessions",
        variant: "destructive",
      });
    }
  };
  
  const handleCleanOldSessions = async () => {
    setIsCleaning(true);
    
    try {
      const result = await sessionService.cleanOldSessions();
      
      if (result) {
        toast({
          title: "Sessions cleaned",
          description: "Old inactive sessions have been removed from the database",
        });
      } else {
        toast({
          title: "Cleaning failed",
          description: "Could not clean old sessions",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while cleaning sessions",
        variant: "destructive",
      });
      console.error("Session cleaning error:", error);
    } finally {
      setIsCleaning(false);
    }
  };
  
  // Check if user is an admin
  const isAdmin = profile?.role === 'admin';
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Session Security
          </CardTitle>
          <CardDescription>
            Manage your active sessions and check for suspicious activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {anomalies && (
            <SecurityStatus 
              anomalies={anomalies} 
              isChecking={isChecking}
              onCheck={handleCheck}
            />
          )}
          
          <SessionsList
            sessions={sessions}
            currentSession={currentSession}
            loading={loading}
            isAdmin={isAdmin}
            isCleaning={isCleaning}
            onTerminate={handleTerminate}
            onTerminateOthers={handleTerminateOthers}
            onCleanOldSessions={handleCleanOldSessions}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionManagement;
