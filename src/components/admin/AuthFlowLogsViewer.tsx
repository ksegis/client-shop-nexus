
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { RefreshCw, Eye, Filter, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { addPublicInsertPolicy } from '@/integrations/supabase/rls-helpers';

// Type for the logs retrieved from the database
interface AuthFlowLog {
  id: string;
  event_type: string;
  user_id?: string | null;
  email?: string | null;
  user_role?: string | null;
  route_path?: string | null;
  required_roles?: string[] | null;
  portal_type?: string | null;
  access_granted?: boolean | null;
  details?: Record<string, any> | null;
  client_timestamp: string;
  server_timestamp: string;
  session_id?: string;
}

export function AuthFlowLogsViewer() {
  const [logs, setLogs] = useState<AuthFlowLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [hasRlsError, setHasRlsError] = useState(false);
  const { toast } = useToast();
  
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setHasRlsError(false);
      
      // Query to get the logs, limited to recent entries to avoid performance issues
      let query = supabase
        .from('auth_flow_logs')
        .select('*')
        .order('server_timestamp', { ascending: false })
        .limit(200);
      
      // Apply filter if session ID is selected
      if (selectedSessionId) {
        query = query.eq('session_id', selectedSessionId);
      }
      
      // Apply filter based on tab
      if (activeTab !== 'all') {
        query = query.eq('event_type', activeTab);
      }
      
      const { data, error } = await query;
      
      if (error) {
        if (error.message?.includes('row-level security') || error.code === '42501') {
          setHasRlsError(true);
        }
        throw error;
      }
      
      // Convert the data to the correct type
      const typedLogs: AuthFlowLog[] = data?.map(log => ({
        ...log,
        details: log.details as Record<string, any> || null
      })) || [];
      
      setLogs(typedLogs);
    } catch (error) {
      console.error('Error fetching auth logs:', error);
      toast({
        title: "Error fetching logs",
        description: "There was an error fetching the authentication logs. You may not have permission to view them.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fixRlsPolicy = async () => {
    try {
      setLoading(true);
      const success = await addPublicInsertPolicy('auth_flow_logs');
      if (success) {
        toast({
          title: "RLS Policy Added",
          description: "Successfully added insert policy to auth_flow_logs table",
        });
        // Re-fetch logs after fixing policy
        await fetchLogs();
      } else {
        toast({
          title: "Error Adding Policy",
          description: "Failed to add insert policy to auth_flow_logs table. You might need admin privileges.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding RLS policy:', error);
      toast({
        title: "Error Adding Policy",
        description: "An error occurred while adding the RLS policy.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch logs when component mounts or filters change
  useEffect(() => {
    fetchLogs();
  }, [activeTab, selectedSessionId]);
  
  // Get unique session IDs for filtering
  const sessionIds = [...new Set(logs.map(log => log.session_id).filter(Boolean))];
  
  // Get unique event types for tab filtering
  const eventTypes = [...new Set(logs.map(log => log.event_type))];
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0');
  };
  
  // Get badge color based on event type
  const getBadgeVariant = (event: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (true) {
      case event.includes('success'):
        return 'default';
      case event.includes('error') || event.includes('denied'):
        return 'destructive';
      case event.includes('auth'):
        return 'default';
      case event.includes('redirect'):
        return 'secondary';
      case event.includes('check'):
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Selectively display details
  const renderDetails = (log: AuthFlowLog) => {
    if (!log.details) return null;
    
    // Format the details appropriately
    try {
      const details = typeof log.details === 'string' 
        ? JSON.parse(log.details) 
        : log.details;
      
      return (
        <div className="text-xs text-muted-foreground mt-1">
          {Object.entries(details).map(([key, value]) => (
            <div key={key}>
              <span className="font-semibold">{key}:</span> {JSON.stringify(value)}
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return <div className="text-xs text-muted-foreground">Error parsing details</div>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Authentication Flow Logs</CardTitle>
        <div className="flex gap-2">
          {selectedSessionId && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedSessionId(null)}
            >
              Clear Filter
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchLogs}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {hasRlsError && (
          <Alert variant="destructive" className="mb-4">
            <Shield className="h-4 w-4" />
            <AlertTitle>Row-Level Security Policy Issue</AlertTitle>
            <AlertDescription>
              <p>There is an RLS policy issue with the auth_flow_logs table. Non-admin users cannot insert logs.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={fixRlsPolicy}
              >
                <Shield className="mr-2 h-4 w-4" />
                Add Public Insert Policy
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="mb-2 flex-wrap h-auto">
            <TabsTrigger value="all">All Events</TabsTrigger>
            {eventTypes.map(type => (
              <TabsTrigger key={type} value={type}>{type}</TabsTrigger>
            ))}
          </TabsList>
          
          {sessionIds.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground py-1">Filter by session:</span>
              {sessionIds.map(id => (
                <Badge 
                  key={id} 
                  variant={id === selectedSessionId ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedSessionId(id === selectedSessionId ? null : id)}
                >
                  <Filter className="mr-1 h-3 w-3" />
                  {id?.substring(0, 8)}...
                </Badge>
              ))}
            </div>
          )}
        </Tabs>
        
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        {hasRlsError ? 
                          "RLS policy issues preventing access to logs" : 
                          "No authentication logs found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatTimestamp(log.client_timestamp)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getBadgeVariant(log.event_type)}>
                            {log.event_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.email || (log.user_id ? log.user_id.substring(0, 8) + '...' : 'Anonymous')}
                          {log.user_role && (
                            <Badge variant="outline" className="ml-2">
                              {log.user_role}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.route_path || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {log.access_granted !== undefined && (
                            <Badge variant={log.access_granted ? "default" : "destructive"}>
                              {log.access_granted ? 'Granted' : 'Denied'}
                            </Badge>
                          )}
                          {log.portal_type && (
                            <Badge variant="outline" className="ml-2">
                              {log.portal_type}
                            </Badge>
                          )}
                          {renderDetails(log)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
