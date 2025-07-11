import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database,
  Play,
  RefreshCw,
  TrendingUp,
  X,
  Zap,
  BarChart3,
  Settings,
  Bug
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProcessingSession {
  id: string;
  filename?: string;
  original_filename?: string;
  file_size?: number;
  status: string;
  total_records?: number;
  processed_records?: number;
  valid_records?: number;
  invalid_records?: number;
  corrected_records?: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  updated_at?: string;
}

interface ProcessingMonitorProps {
  onClose?: () => void;
}

export function ProcessingMonitor({ onClose }: ProcessingMonitorProps) {
  const [sessions, setSessions] = useState<ProcessingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [processingSession, setProcessingSession] = useState<string | null>(null);
  const [diagnosticsResults, setDiagnosticsResults] = useState<any>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProcessingData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadProcessingData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadProcessingData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      setDebugInfo('Loading sessions...');
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('csv_upload_sessions')
        .select(`
          id,
          status,
          total_records,
          processed_records,
          valid_records,
          invalid_records,
          corrected_records,
          created_at,
          updated_at,
          completed_at,
          original_filename,
          file_size,
          error_message
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (sessionsError) {
        throw sessionsError;
      }
      
      setSessions(sessions || []);
      setDebugInfo(`Successfully loaded ${sessions?.length || 0} sessions`);
      
    } catch (error: any) {
      console.error('Error loading processing data:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      setError(`Database Error: ${errorMessage}`);
      setDebugInfo(`Error: ${errorMessage}`);
      
      toast({
        title: "Error Loading Data",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const runDiagnostics = async () => {
    try {
      setShowDiagnostics(true);
      setDebugInfo('Running background processing diagnostics...');
      
      // Check for database functions
      const { data: functions, error: functionsError } = await supabase
        .rpc('sql', {
          query: `
            SELECT routine_name, routine_type
            FROM information_schema.routines 
            WHERE routine_name IN (
              'process_csv_staging_records',
              'process_all_pending_sessions', 
              'resume_stalled_session',
              'scheduled_csv_processing'
            )
          `
        });

      // Check for triggers
      const { data: triggers, error: triggersError } = await supabase
        .rpc('sql', {
          query: `
            SELECT trigger_name, event_object_table
            FROM information_schema.triggers 
            WHERE event_object_table IN ('csv_staging_records', 'csv_upload_sessions')
          `
        });

      // Check for stalled sessions
      const { data: stalledSessions, error: stalledError } = await supabase
        .rpc('sql', {
          query: `
            SELECT 
              id,
              status,
              total_records,
              processed_records,
              EXTRACT(EPOCH FROM (NOW() - updated_at))/3600 as hours_since_update
            FROM csv_upload_sessions 
            WHERE status = 'processing' 
              AND EXTRACT(EPOCH FROM (NOW() - updated_at))/3600 > 0.5
          `
        });

      setDiagnosticsResults({
        functions: functions || [],
        triggers: triggers || [],
        stalledSessions: stalledSessions || [],
        functionsError,
        triggersError,
        stalledError
      });

      setDebugInfo('Diagnostics completed. Check results below.');
      
    } catch (error: any) {
      console.error('Error running diagnostics:', error);
      setDebugInfo(`Diagnostics failed: ${error.message}`);
      toast({
        title: "Diagnostics Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resumeSessionWithFunction = async (sessionId: string) => {
    try {
      setProcessingSession(sessionId);
      
      console.log(`Resuming session using database function: ${sessionId}`);
      
      toast({
        title: "Resuming Processing",
        description: "Using database function to resume background processing...",
      });

      // Call the database function to resume processing
      const { data, error } = await supabase
        .rpc('resume_stalled_session', { session_id: sessionId });

      if (error) {
        throw error;
      }

      console.log('Resume function result:', data);

      if (data?.success) {
        toast({
          title: "Processing Resumed",
          description: "Background processing has been resumed successfully.",
        });
      } else {
        toast({
          title: "Resume Failed",
          description: data?.message || "Could not resume processing",
          variant: "destructive",
        });
      }

      // Refresh data after a delay
      setTimeout(loadProcessingData, 2000);
      
    } catch (error: any) {
      console.error('Error resuming processing:', error);
      toast({
        title: "Resume Failed",
        description: error.message || "Could not resume processing",
        variant: "destructive",
      });
    } finally {
      setProcessingSession(null);
    }
  };

  const processAllPendingSessions = async () => {
    try {
      setDebugInfo('Processing all pending sessions...');
      
      toast({
        title: "Processing All Sessions",
        description: "Running background processing for all pending sessions...",
      });

      const { data, error } = await supabase
        .rpc('process_all_pending_sessions');

      if (error) {
        throw error;
      }

      console.log('Process all result:', data);

      toast({
        title: "Batch Processing Complete",
        description: `Processed ${data?.sessions_processed || 0} sessions, ${data?.total_records_processed || 0} records.`,
      });

      setDebugInfo(`Batch processing completed: ${data?.sessions_processed || 0} sessions, ${data?.total_records_processed || 0} records`);
      
      // Refresh data
      setTimeout(loadProcessingData, 2000);
      
    } catch (error: any) {
      console.error('Error processing all sessions:', error);
      toast({
        title: "Batch Processing Failed",
        description: error.message,
        variant: "destructive",
      });
      setDebugInfo(`Batch processing failed: ${error.message}`);
    }
  };

  const isSessionStalled = (session: ProcessingSession): boolean => {
    if (session.status !== 'processing') return false;
    
    const totalRecords = session.total_records || 0;
    const processedRecords = session.processed_records || 0;
    const isIncomplete = processedRecords < totalRecords;
    
    if (!isIncomplete) return false;
    
    const now = new Date();
    const lastUpdate = new Date(session.updated_at || session.created_at);
    const timeDiffMs = now.getTime() - lastUpdate.getTime();
    const hoursSinceUpdate = timeDiffMs / (1000 * 60 * 60);
    
    return hoursSinceUpdate > 0.5; // 30 minutes
  };

  const getSessionProgress = (session: ProcessingSession): number => {
    const total = session.total_records || 0;
    const processed = session.processed_records || 0;
    if (total === 0) return 0;
    return Math.round((processed / total) * 100);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (session: ProcessingSession) => {
    if (isSessionStalled(session)) {
      return <Badge variant="destructive">Stalled</Badge>;
    }
    
    switch (session.status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{session.status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading processing data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold flex items-center space-x-2">
                <Activity className="h-6 w-6" />
                <span>Processing Monitor (Proper Fix)</span>
              </h2>
              <p className="text-gray-600 mt-1">
                Real-time monitoring with proper background processing
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={runDiagnostics}
              >
                <Bug className="h-4 w-4 mr-1" />
                Diagnostics
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={processAllPendingSessions}
              >
                <Zap className="h-4 w-4 mr-1" />
                Process All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadProcessingData}
                disabled={refreshing}
              >
                {refreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Debug Information */}
        <div className="p-6 border-b">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Status:</strong> {debugInfo}
            </AlertDescription>
          </Alert>
        </div>

        {/* Diagnostics Results */}
        {showDiagnostics && diagnosticsResults && (
          <div className="p-6 border-b">
            <h3 className="text-lg font-medium mb-4">Background Processing Diagnostics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Database Functions</CardTitle>
                </CardHeader>
                <CardContent>
                  {diagnosticsResults.functions.length > 0 ? (
                    <div className="space-y-1">
                      {diagnosticsResults.functions.map((func: any, index: number) => (
                        <div key={index} className="text-sm">
                          ✅ {func.routine_name} ({func.routine_type})
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">❌ No processing functions found</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Database Triggers</CardTitle>
                </CardHeader>
                <CardContent>
                  {diagnosticsResults.triggers.length > 0 ? (
                    <div className="space-y-1">
                      {diagnosticsResults.triggers.map((trigger: any, index: number) => (
                        <div key={index} className="text-sm">
                          ✅ {trigger.trigger_name} on {trigger.event_object_table}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">❌ No processing triggers found</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Stalled Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  {diagnosticsResults.stalledSessions.length > 0 ? (
                    <div className="space-y-1">
                      {diagnosticsResults.stalledSessions.map((session: any, index: number) => (
                        <div key={index} className="text-sm text-red-600">
                          ⚠️ {session.id.substring(0, 8)}... ({session.hours_since_update.toFixed(1)}h stalled)
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-green-600">✅ No stalled sessions detected</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-6 border-b">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Statistics Overview */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-blue-600">{sessions.length}</div>
              <div className="text-sm text-gray-500">Total Sessions</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-orange-600">
                {sessions.filter(s => s.status === 'processing').length}
              </div>
              <div className="text-sm text-gray-500">Active</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-red-600">
                {sessions.filter(s => isSessionStalled(s)).length}
              </div>
              <div className="text-sm text-gray-500">Stalled</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-green-600">
                {sessions.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </Card>
          </div>
        </div>

        {/* Sessions List */}
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Processing Sessions</h3>
          
          {sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session) => {
                const isStalled = isSessionStalled(session);
                return (
                  <Card key={session.id} className={`p-4 ${isStalled ? 'border-red-200 bg-red-50' : ''}`}>
                    <div className="space-y-4">
                      {/* Session Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-medium">{session.original_filename || 'Unknown File'}</div>
                            <div className="text-sm text-gray-500">
                              {formatFileSize(session.file_size)} • Started: {formatDate(session.created_at)}
                            </div>
                          </div>
                          {getStatusBadge(session)}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {isStalled && (
                            <Button
                              size="sm"
                              onClick={() => resumeSessionWithFunction(session.id)}
                              disabled={processingSession === session.id}
                              className="flex items-center space-x-1 bg-green-600 hover:bg-green-700"
                            >
                              {processingSession === session.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                              <span>Resume</span>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Progress Information */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Progress</div>
                          <div className="font-medium">
                            {(session.processed_records || 0).toLocaleString()} / {(session.total_records || 0).toLocaleString()}
                          </div>
                          <Progress value={getSessionProgress(session)} className="h-2 mt-1" />
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-500">Records Status</div>
                          <div className="text-sm">
                            <span className="text-green-600">Valid: {session.valid_records || 0}</span> • 
                            <span className="text-red-600 ml-1">Invalid: {session.invalid_records || 0}</span> • 
                            <span className="text-blue-600 ml-1">Corrected: {session.corrected_records || 0}</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-500">Remaining</div>
                          <div className="font-medium">
                            {((session.total_records || 0) - (session.processed_records || 0)).toLocaleString()} records
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-500">Last Updated</div>
                          <div className="font-medium">{formatDate(session.updated_at)}</div>
                        </div>
                      </div>

                      {/* Stalled Warning */}
                      {isStalled && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Processing Stalled:</strong> This session has {((session.total_records || 0) - (session.processed_records || 0)).toLocaleString()} records remaining. 
                            Click "Resume" to restart background processing using database functions.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Error Message */}
                      {session.error_message && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Error:</strong> {session.error_message}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No processing sessions found</p>
              <p className="text-sm mt-2">Check the debug info above for details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProcessingMonitor;

