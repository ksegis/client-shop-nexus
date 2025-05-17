
import React from 'react';
import { Button } from "@/components/ui/button";
import { Monitor, Clock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';

interface SessionItemProps {
  session: {
    id: string;
    user_agent?: string;
    last_active: string;
    ip_address?: string;
  };
  isCurrentSession: boolean;
  onTerminate: (sessionId: string) => void;
}

export const SessionItem: React.FC<SessionItemProps> = ({
  session,
  isCurrentSession,
  onTerminate
}) => {
  return (
    <div className="flex items-center justify-between border p-4 rounded-md">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          <span className="font-medium truncate max-w-[200px]">
            {session.user_agent?.split(' ')[0] || 'Unknown device'}
          </span>
          {isCurrentSession && (
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
      
      {!isCurrentSession && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onTerminate(session.id)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Terminate</span>
        </Button>
      )}
    </div>
  );
};
