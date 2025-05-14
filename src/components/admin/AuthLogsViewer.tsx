
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

type AuthLog = {
  id: string;
  event_type: string;
  user_id: string;
  email: string;
  user_role: string;
  created_at: string;
  ip_address: string;
  user_agent: string;
  metadata: Record<string, any>;
};

export function AuthLogsViewer() {
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('auth_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (error) throw error;
        
        setLogs(data || []);
      } catch (error) {
        console.error('Error fetching auth logs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
    
    // Set up subscription for real-time updates
    const subscription = supabase
      .channel('auth_logs')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'auth_logs' 
      }, (payload) => {
        setLogs(prev => [payload.new as AuthLog, ...prev.slice(0, 99)]);
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'sign_in':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Sign In</Badge>;
      case 'sign_out':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Sign Out</Badge>;
      case 'sign_up':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Sign Up</Badge>;
      case 'impersonation_start':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Impersonation Start</Badge>;
      case 'impersonation_end':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Impersonation End</Badge>;
      case 'password_reset':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Password Reset</Badge>;
      case 'password_update':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Password Update</Badge>;
      case 'token_refresh':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Token Refresh</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{eventType}</Badge>;
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Logs</CardTitle>
          <CardDescription>Loading authentication activity records...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication Logs</CardTitle>
        <CardDescription>Recent authentication activity across all portals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No authentication logs available
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      {getEventBadge(log.event_type)}
                    </TableCell>
                    <TableCell>{log.email || 'Unknown'}</TableCell>
                    <TableCell>
                      <span className="capitalize">{log.user_role || 'n/a'}</span>
                    </TableCell>
                    <TableCell>{log.ip_address || 'n/a'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
