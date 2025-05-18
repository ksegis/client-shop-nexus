
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ShieldAlert, AlertTriangle, ClipboardCheck, Loader2 } from 'lucide-react';

interface SecurityIncident {
  id: string;
  user_id: string;
  alert_type: string;
  created_at: string;
  metadata: any;
  resolved_at: string | null;
  profiles?: { email: string };
}

export const SecurityIncidentDashboard = () => {
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  
  const { data: incidents = [], isLoading, refetch } = useQuery({
    queryKey: ['security-incidents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*, profiles:user_id(email)')
        .is('resolved_at', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SecurityIncident[];
    }
  });

  const resolveIncident = async (id: string) => {
    try {
      await supabase
        .from('security_alerts')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', id);
      
      refetch();
    } catch (error) {
      console.error('Failed to resolve incident:', error);
    }
  };

  const getPriorityBadge = (type: string) => {
    switch(type) {
      case 'recovery_requested':
      case 'admin_recovery':
      case 'impossible_travel':
        return <Badge variant="destructive">High</Badge>;
      case 'new_device':
      case 'multiple_failures':
        return <Badge variant="default" className="bg-amber-500">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const renderIncidentDetails = (incident: SecurityIncident) => {
    const { metadata } = incident;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Incident Details
          </CardTitle>
          <CardDescription>
            {formatIncidentType(incident.alert_type)} - {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm font-medium">User</p>
              <p className="text-sm text-muted-foreground">{incident.profiles?.email || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Date</p>
              <p className="text-sm text-muted-foreground">
                {new Date(incident.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Type</p>
              <p className="text-sm text-muted-foreground">{formatIncidentType(incident.alert_type)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                {incident.resolved_at ? 'Resolved' : 'Active'}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Details</p>
            <div className="bg-muted p-3 rounded-md">
              <pre className="whitespace-pre-wrap text-xs">
                {metadata && JSON.stringify(metadata, null, 2)}
              </pre>
            </div>
          </div>
          
          {!incident.resolved_at && (
            <div className="flex justify-end">
              <Button
                onClick={() => resolveIncident(incident.id)}
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Mark as Resolved
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const formatIncidentType = (type: string) => {
    switch(type) {
      case 'recovery_requested': return 'Account Recovery Request';
      case 'recovery_code_used': return 'Recovery Code Used';
      case 'recovery_attempt_failed': return 'Failed Recovery Attempt';
      case 'admin_recovery': return 'Admin Recovery Action';
      case 'impossible_travel': return 'Suspicious Location Change';
      case 'multiple_failures': return 'Multiple Failed Attempts';
      case 'new_device': return 'New Device Detected';
      default: return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Security Incidents
          </CardTitle>
          <CardDescription>
            Active security alerts requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <Alert>
              <AlertDescription>No active security incidents at this time.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.map((incident) => (
                      <TableRow 
                        key={incident.id}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => setSelectedIncident(incident)}
                      >
                        <TableCell>{formatIncidentType(incident.alert_type)}</TableCell>
                        <TableCell>{getPriorityBadge(incident.alert_type)}</TableCell>
                        <TableCell>{formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="md:col-span-2">
                {selectedIncident ? (
                  renderIncidentDetails(selectedIncident)
                ) : (
                  <div className="flex items-center justify-center h-full border rounded-lg p-8">
                    <div className="text-center text-muted-foreground">
                      <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
                      <p>Select an incident to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
