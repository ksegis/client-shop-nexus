
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Temporary type for auth logs until we have a proper database schema
export interface AuthLog {
  id?: string;
  event_type: string;
  user_id?: string;
  email?: string;
  user_role?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export function AuthLogsViewer() {
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Simulate fetching logs
        setLoading(true);
        
        // Mock data for now until we have the auth_logs table
        const mockLogs: AuthLog[] = [
          {
            id: '1',
            event_type: 'sign_in',
            user_id: 'user-123',
            email: 'admin@example.com',
            user_role: 'admin',
            timestamp: new Date().toISOString(),
          },
          {
            id: '2',
            event_type: 'sign_out',
            user_id: 'user-123',
            email: 'admin@example.com',
            user_role: 'admin',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          }
        ];
        
        setLogs(mockLogs);
      } catch (error) {
        console.error('Error fetching auth logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const getEventBadgeColor = (eventType: string): string => {
    switch (eventType) {
      case 'sign_in':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sign_out':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sign_up':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'impersonation_start':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'impersonation_end':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'medium'
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Date/Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      No authentication logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline" className={getEventBadgeColor(log.event_type)}>
                          {log.event_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.email || 'Unknown'}</TableCell>
                      <TableCell>{log.user_role || 'N/A'}</TableCell>
                      <TableCell>{formatDate(log.timestamp)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
