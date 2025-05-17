
import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";

interface SecurityAlert {
  id: string;
  alert_type: 'new_device' | 'impossible_travel' | 'multiple_failures';
  metadata: any;
  created_at: string;
  user_id: string;
}

interface SecurityAlertsProps {
  alerts: SecurityAlert[];
  loading: boolean;
  onResolve: (alertId: string) => void;
}

export const SecurityAlerts: React.FC<SecurityAlertsProps> = ({
  alerts,
  loading,
  onResolve
}) => {
  if (loading) {
    return <div className="py-2">Loading security alerts...</div>;
  }
  
  if (alerts.length === 0) {
    return null; // Don't render anything if no alerts
  }
  
  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'new_device':
        return 'New Device Detection';
      case 'impossible_travel':
        return 'Impossible Travel';
      case 'multiple_failures':
        return 'Multiple Authentication Failures';
      default:
        return 'Security Alert';
    }
  };
  
  const getAlertSeverity = (type: string): "default" | "destructive" | "outline" => {
    switch (type) {
      case 'impossible_travel':
        return 'destructive';
      case 'multiple_failures':
        return 'destructive';
      case 'new_device':
        return 'default';
      default:
        return 'outline';
    }
  };
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-4">Active Security Alerts</h3>
      <div className="space-y-4">
        {alerts.map(alert => (
          <div 
            key={alert.id}
            className="border rounded-lg p-4 bg-muted/30"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <h4 className="font-medium text-sm">
                  {getAlertTypeLabel(alert.alert_type)}
                </h4>
                <Badge variant={getAlertSeverity(alert.alert_type)}>
                  {alert.alert_type}
                </Badge>
              </div>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="flex items-center gap-1"
                onClick={() => onResolve(alert.id)}
              >
                <CheckCircle className="h-4 w-4" />
                Resolve
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
              <Clock className="h-3 w-3" />
              <span>
                {format(new Date(alert.created_at), 'PPp')}
              </span>
            </div>
            
            {alert.metadata && (
              <div className="mt-2 text-sm">
                {alert.metadata.message && (
                  <p>{alert.metadata.message}</p>
                )}
                {alert.metadata.ip_address && (
                  <p>IP Address: {alert.metadata.ip_address}</p>
                )}
                {alert.metadata.device && (
                  <p>Device: {alert.metadata.device}</p>
                )}
                {alert.metadata.location && (
                  <p>Location: {alert.metadata.location}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
