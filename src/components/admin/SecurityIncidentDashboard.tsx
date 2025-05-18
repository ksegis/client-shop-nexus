
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useSecurityDashboard } from '@/hooks/useSecurityDashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, AlertTriangle, Shield, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define the proper SecurityIncident interface
interface SecurityIncident {
  id: string;
  user_id: string;
  alert_type: string;
  created_at: string;
  resolved_at: string | null;
  metadata: Record<string, any>;
  profiles?: {
    email: string;
  } | null;
}

export function SecurityIncidentDashboard() {
  const { activeAlerts, resolvedAlerts, isLoading, refreshData } = useSecurityDashboard();
  const { toast } = useToast();
  
  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', alertId);
        
      if (!error) {
        toast({
          title: "Alert Resolved",
          description: "The security alert has been marked as resolved.",
        });
        refreshData();
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: "An error occurred while resolving the alert.",
        variant: "destructive"
      });
    }
  };
  
  const handleSendNotification = async (alertId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-security-notification', {
        body: { alertId }
      });
      
      if (error) throw error;
      
      toast({
        title: "Notification Sent",
        description: "Security notification has been sent to the user.",
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "An error occurred while sending the notification.",
        variant: "destructive"
      });
    }
  };
  
  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'new_device':
        return <Shield className="h-5 w-5" />;
      case 'impossible_travel':
        return <AlertTriangle className="h-5 w-5" />;
      case 'multiple_failures':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };
  
  const formatAlertType = (alertType: string) => {
    return alertType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  const renderAlertTable = (alerts: SecurityIncident[], showActions: boolean) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Alert Type</th>
            <th className="text-left p-2">User</th>
            <th className="text-left p-2">Date</th>
            <th className="text-left p-2">Status</th>
            {showActions && <th className="text-right p-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {alerts.length === 0 ? (
            <tr>
              <td colSpan={showActions ? 5 : 4} className="p-4 text-center text-muted-foreground">
                No alerts found
              </td>
            </tr>
          ) : (
            alerts.map((alert) => (
              <tr key={alert.id} className="border-b">
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    {getAlertIcon(alert.alert_type)}
                    {formatAlertType(alert.alert_type)}
                  </div>
                </td>
                <td className="p-2">{alert.profiles?.email || 'Unknown'}</td>
                <td className="p-2">
                  {new Date(alert.created_at).toLocaleString()}
                </td>
                <td className="p-2">
                  {alert.resolved_at ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Resolved
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      Active
                    </Badge>
                  )}
                </td>
                {showActions && (
                  <td className="p-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSendNotification(alert.id)}
                      >
                        Notify
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Loading Security Incidents...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>Active Security Alerts</span>
            <Badge className="ml-2">{activeAlerts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderAlertTable(activeAlerts as SecurityIncident[], true)}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>Resolved Alerts</span>
            <Badge variant="outline" className="ml-2">{resolvedAlerts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderAlertTable(resolvedAlerts as SecurityIncident[], false)}
        </CardContent>
      </Card>
    </div>
  );
}
