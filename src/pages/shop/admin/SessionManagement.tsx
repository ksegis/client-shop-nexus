
import React, { useEffect, useState } from 'react';
import { useAuth } from "@/contexts/auth";
import { useSession } from "@/hooks/useSession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, User, Monitor, Clock, AlertTriangle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

const SessionManagement: React.FC = () => {
  const { user } = useAuth();
  const { sessions, currentSession, loading, anomalies, checkForAnomalies, terminateSession, terminateOtherSessions } = useSession();
  const [isChecking, setIsChecking] = useState(false);
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
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Security Status</h3>
                <Button size="sm" onClick={handleCheck} disabled={isChecking}>
                  {isChecking ? "Checking..." : "Check Now"}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-500" />
                        <span>Active Sessions</span>
                      </div>
                      <Badge variant={anomalies.simultaneous_sessions > 3 ? "destructive" : "outline"}>
                        {anomalies.simultaneous_sessions}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-5 w-5 text-blue-500" />
                        <span>New Device</span>
                      </div>
                      <Badge variant={anomalies.new_device ? "destructive" : "outline"}>
                        {anomalies.new_device ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-blue-500" />
                        <span>Suspicious Location</span>
                      </div>
                      <Badge variant={anomalies.suspicious_location ? "destructive" : "outline"}>
                        {anomalies.suspicious_location ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Active Sessions ({sessions.length})</h3>
              {sessions.length > 1 && (
                <Button size="sm" variant="outline" onClick={handleTerminateOthers}>
                  Logout from All Other Devices
                </Button>
              )}
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <p>Loading sessions...</p>
              ) : sessions.length === 0 ? (
                <p>No active sessions found</p>
              ) : (
                sessions.map(session => (
                  <div key={session.id} className="flex items-center justify-between border p-4 rounded-md">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        <span className="font-medium truncate max-w-[200px]">
                          {session.user_agent?.split(' ')[0] || 'Unknown device'}
                        </span>
                        {currentSession?.id === session.id && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Last active: {formatDistanceToNow(new Date(session.last_active))} ago</span>
                      </div>
                      {session.ip_address && (
                        <div className="text-sm text-gray-500">
                          IP: {session.ip_address}
                        </div>
                      )}
                    </div>
                    
                    {currentSession?.id !== session.id && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleTerminate(session.id)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Terminate</span>
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionManagement;
