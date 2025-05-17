
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SecurityAlerts } from './SecurityAlerts';

export default function SecurityDashboard() {
  const [isResolvingAlert, setIsResolvingAlert] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['security-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*, profiles(email)')
        .is('resolved_at', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching security alerts:", error);
        toast({
          title: "Error fetching security alerts",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return data || [];
    }
  });

  // Using a direct query for security stats instead of an RPC function
  const { data: securityStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['security-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, email,
          user_sessions:user_sessions(device_hash),
          security_alerts:security_alerts(id, resolved_at)
        `)
        .order('email');
      
      if (error) {
        console.error("Error fetching security stats:", error);
        return [];
      }
      
      // Process the data to get the stats we need
      return (data || []).map(user => {
        const devices = new Set(user.user_sessions?.map((s: any) => s.device_hash) || []).size;
        const active_alerts = user.security_alerts?.filter((a: any) => a.resolved_at === null).length || 0;
        
        return {
          user_id: user.id,
          email: user.email,
          devices: devices,
          active_alerts: active_alerts
        };
      });
    }
  });

  const resolveAlert = async (alertId: string) => {
    setIsResolvingAlert(alertId);
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', alertId);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Alert resolved",
        description: "The security alert has been marked as resolved",
      });
      
      // Refetch alerts to update the list
      refetch();
    } catch (error: any) {
      toast({
        title: "Error resolving alert",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsResolvingAlert(null);
    }
  };
  
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

  if (isLoading) {
    return <div className="py-4">Loading security alerts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Security Dashboard</h2>
      </div>

      {/* Forward active alerts to the SecurityAlerts component */}
      <SecurityAlerts 
        alerts={(alerts || []).map(alert => ({
          id: alert.id,
          alert_type: alert.alert_type as any,
          metadata: alert.metadata,
          created_at: alert.created_at,
          user_id: alert.user_id
        }))} 
        loading={isLoading}
        onResolve={resolveAlert}
      />

      {/* Stats Table */}
      {securityStats && securityStats.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Security Overview by User</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Devices</TableHead>
                <TableHead>Active Alerts</TableHead>
                <TableHead>Risk Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {securityStats.map((stat: any) => (
                <TableRow key={stat.user_id}>
                  <TableCell>{stat.email}</TableCell>
                  <TableCell>{stat.devices}</TableCell>
                  <TableCell>
                    {stat.active_alerts > 0 ? (
                      <Badge variant="destructive">{stat.active_alerts}</Badge>
                    ) : (
                      <Badge variant="outline">0</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        stat.active_alerts > 1 ? "destructive" : 
                        stat.active_alerts > 0 ? "default" : "outline"
                      }
                    >
                      {stat.active_alerts > 1 ? "High" : 
                       stat.active_alerts > 0 ? "Medium" : "Low"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* All Alerts Table */}
      <div>
        <h3 className="text-lg font-medium mb-4">All Active Alerts</h3>
        {alerts && alerts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert: any) => (
                <TableRow key={alert.id}>
                  <TableCell>{alert.profiles?.email || 'Unknown'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      {getAlertTypeLabel(alert.alert_type)}
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(alert.created_at), 'PPp')}</TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center gap-1"
                      onClick={() => resolveAlert(alert.id)}
                      disabled={isResolvingAlert === alert.id}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {isResolvingAlert === alert.id ? 'Resolving...' : 'Resolve'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 bg-muted/30 rounded-md">
            <p className="text-muted-foreground">No active security alerts</p>
          </div>
        )}
      </div>
    </div>
  );
}
