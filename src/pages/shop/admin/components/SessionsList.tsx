
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { SessionItem } from './SessionItem';

interface SessionsListProps {
  sessions: any[];
  currentSession: any | null;
  loading: boolean;
  isAdmin: boolean;
  isCleaning: boolean;
  onTerminate: (sessionId: string) => void;
  onTerminateOthers: () => void;
  onCleanOldSessions: () => void;
}

export const SessionsList: React.FC<SessionsListProps> = ({
  sessions,
  currentSession,
  loading,
  isAdmin,
  isCleaning,
  onTerminate,
  onTerminateOthers,
  onCleanOldSessions
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Active Sessions ({sessions.length})</h3>
        <div className="space-x-2">
          {sessions.length > 1 && (
            <Button size="sm" variant="outline" onClick={onTerminateOthers}>
              Logout from All Other Devices
            </Button>
          )}
          
          {isAdmin && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={onCleanOldSessions}
              disabled={isCleaning}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              {isCleaning ? "Cleaning..." : "Clean Old Sessions"}
            </Button>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        {loading ? (
          <p>Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p>No active sessions found</p>
        ) : (
          sessions.map(session => (
            <SessionItem 
              key={session.id} 
              session={session} 
              isCurrentSession={currentSession?.id === session.id}
              onTerminate={onTerminate}
            />
          ))
        )}
      </div>
    </div>
  );
};
