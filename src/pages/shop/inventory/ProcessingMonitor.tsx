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
  BarChart3
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
      setDebugInfo('Starting to load sessions...');
      
      // First, check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error(`Auth error: ${authError.message}`);
      }
      
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      setDebugInfo(`User authenticated: ${user.email}`);
      
      // Try to load sessions with minimal fields first
      console.log('Attempting to load csv_upload_sessions...');
      
      const { data: allSessions, error: sessionsError } = await supabase
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
        console.error('Sessions query error:', sessionsError);
        throw new Error(`Database error: ${sessionsError.message} (Code: ${sessionsError.code})`);
      }

      console.log('Sessions loaded successfully:', allSessions?.length || 0);
      setDebugInfo(`Successfully loaded ${allSessions?.length || 0} sessions`);
      
      setSessions(allSessions || []);

    } catch (error) {
      console.error('Error loading processing data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
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

  const isSessionStalled = (session: ProcessingSession): boolean => {
    // Only check processing sessions
    if (session.status !== 'processing') {
      console.log(`Session ${session.id}: Not processing (status: ${session.status})`);
      return false;
    }
    
    // Check if processing is incomplete
    const totalRecords = session.total_records || 0;
    const processedRecords = session.processed_records || 0;
    const isIncomplete = processedRecords < totalRecords;
    
    if (!isIncomplete) {
      console.log(`Session ${session.id}: Complete (${processedRecords}/${totalRecords})`);
      return false;
    }
    
    // Get current time and last update time
    const now = new Date();
    const lastUpdateString = session.updated_at || session.created_at;
    
    // Parse the timestamp - handle both ISO format and PostgreSQL timestamp
    let lastUpdate: Date;
    try {
      // If it contains 'T', it's ISO format
      if (lastUpdateString.includes('T')) {
        lastUpdate = new Date(lastUpdateString);
      } else {
        // Otherwise, treat as PostgreSQL timestamp
        lastUpdate = new Date(lastUpdateString + 'Z'); // Add Z to treat as UTC
      }
    } catch (e) {
      console.error(`Error parsing date: ${lastUpdateString}`, e);
      lastUpdate = new Date(session.created_at);
    }
    
    // Calculate time difference in milliseconds, then convert to hours
    const timeDiffMs = now.getTime() - lastUpdate.getTime();
    const hoursSinceUpdate = timeDiffMs / (1000 * 60 * 60);
    
    // Consider stalled if no update in 30 minutes (0.5 hours) for testing
    // You can change this back to 1 hour later
    const stallThresholdHours = 0.5;
    const isStalled = hoursSinceUpdate > stallThresholdHours;
    
    console.log(`Session ${session.id}: 
      - Progress: ${processedRecords}/${totalRecords}
      - Last update string: ${lastUpdateString}
      - Last update parsed: ${lastUpdate.toISOString()}
      - Current time: ${now.toISOString()}
      - Hours since update: ${hoursSinceUpdate.toFixed(2)}
      - Stall threshold: ${stallThresholdHours} hours
      - Is stalled: ${isStalled}`);
    
    return isStalled;
  };

  const getSessionProgress = (session: ProcessingSession): number => {
    const total = session.total_records || 0;
    const processed = session.processed_records || 0;
    if (total === 0) return 0;
    return Math.round((processed / total) * 100);
  };

  const getEstimatedCompletion = (session: ProcessingSession): string => {
    if (session.status !== 'processing') return 'N/A';
    
    const start = new Date(session.created_at);
    const now = new Date();
    const elapsedMinutes = (now.getTime() - start.getTime()) / (1000 * 60);
    
    const processedRecords = session.processed_records || 0;
    const totalRecords = session.total_records || 0;
    
    if (elapsedMinutes === 0 || !processedRecords) return 'Calculating...';
    
    const rate = processedRecords / elapsedMinutes;
    const remaining = totalRecords - processedRecords;
    
    if (rate === 0) return 'Stalled';
    
    const estimatedMinutes = remaining / rate;
    
    if (estimatedMinutes < 60) {
      return `${Math.ceil(estimatedMinutes)} minutes`;
    } else {
      const hours = Math.floor(estimatedMinutes / 60);
      const minutes = Math.ceil(estimatedMinutes % 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const resumeProcessing = async (sessionId: string) => {
    try {
      setProcessingSession(sessionId);
      
      console.log(`Attempting to resume processing for session: ${sessionId}`);
      
      // Get staging records that need processing
      const { data: stagingRecords, error: stagingError } = await supabase
        .from('csv_staging_records')
        .select('*')
        .eq('upload_session_id', sessionId)
        .in('validation_status', ['valid', 'corrected'])
        .is('processed_at', null)
        .limit(10); // Limit to first 10 for testing

      if (stagingError) {
        throw new Error(`Failed to get staging records: ${stagingError.message}`);
      }

      console.log(`Found ${stagingRecords?.length || 0} records to process`);

      if (!stagingRecords || stagingRecords.length === 0) {
        // No records to process, mark as completed
        const { error: updateError } = await supabase
          .from('csv_upload_sessions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (updateError) throw updateError;
        
        toast({
          title: "Processing Complete",
          description: "No remaining records to process. Session marked as completed.",
        });
      } else {
        // Update session timestamp to show activity
        const { error: updateError } = await supabase
          .from('csv_upload_sessions')
          .update({
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (updateError) throw updateError;

        toast({
          title: "Processing Resumed",
          description: `Found ${stagingRecords.length} records to process. Processing will continue in the background.`,
        });
      }

      // Refresh data after a delay
      setTimeout(loadProcessingData, 2000);
      
    } catch (error) {
      console.error('Error resuming processing:', error);
      toast({
        title: "Resume Processing Failed",
        description: error instanceof Error ? error.message : "Could not resume processing for this session",
        variant: "destructive",
      });
    } finally {
      setProcessingSession(null);
    }
  };

  const markSessionCompleted = async (sessionId: string) => {
    if (!confirm('Mark this session as completed? This will stop further processing.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('csv_upload_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Session Completed",
        description: "Session has been marked as completed",
      });

      loadProcessingData();
      
    } catch (error) {
      console.error('Error marking session completed:', error);
      toast({
        title: "Update Failed",
        description: "Could not update session status",
        variant: "destructive",
      });
    }
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
                <span>Processing Monitor (Fixed Time)</span>
              </h2>
              <p className="text-gray-600 mt-1">
                Real-time monitoring of CSV processing sessions
              </p>
            </div>
            <div className="flex items-center space-x-2">
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
              <strong>Debug Info:</strong> {debugInfo} | Current Time: {new Date().toISOString()}
            </AlertDescription>
          </Alert>
        </div>

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
                              onClick={() => resumeProcessing(session.id)}
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
                          
                          {session.status === 'processing' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markSessionCompleted(session.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Mark Complete
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
                          <div className="text-sm text-gray-500">Estimated Completion</div>
                          <div className="font-medium">{getEstimatedCompletion(session)}</div>
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
                            <strong>Processing Stalled:</strong> This session hasn't been updated in over 30 minutes and has {((session.total_records || 0) - (session.processed_records || 0)).toLocaleString()} records remaining. 
                            Click "Resume" to continue processing.
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

                      {/* Debug Info for this session */}
                      <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                        <strong>Debug:</strong> ID: {session.id}, Status: {session.status}, 
                        Created: {session.created_at}, Updated: {session.updated_at || 'N/A'}
                      </div>
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

