
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Monitor, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SecurityStatusProps {
  anomalies: {
    simultaneous_sessions: number;
    new_device: boolean;
    suspicious_location: boolean;
  };
  isChecking: boolean;
  onCheck: () => void;
}

export const SecurityStatus: React.FC<SecurityStatusProps> = ({ 
  anomalies, 
  isChecking, 
  onCheck 
}) => {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Security Status</h3>
        <Button size="sm" onClick={onCheck} disabled={isChecking}>
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
  );
};
