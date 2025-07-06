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
  filename: string;
  original_filename: string;
  file_size: number;
  status: string;
  total_records: number;
  processed_records: number;
  valid_records: number;
  invalid_records: number;
  corrected_records: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  updated_at: string;
}

interface ProcessingStats {
  totalSessions: number;
  activeSessions: number;
  stalledSessions: number;
  completedToday: number;
  totalRecordsProcessed: number;
  averageProcessingRate: number;
}

interface ProcessingMonitorProps {
  onClose?: () => void;
}

export function ProcessingMonitor({ onClose }: ProcessingMonitorProps) {
  const [sessions, setSessions] = useState<ProcessingSession[]>([]);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [loading, setLoading] = useState(true);
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
      
      // Load all sessions
      const { data: allSessions, error: sessionsError } = await supabase
        .from('csv_upload_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (sessionsError) throw sessionsError;
      setSessions(allSessions || []);

      // Calculate statistics
      const stats = calculateStats(allSessions || []);
      setStats(stats);

    } catch (error) {
      console.error('Error loading processing data:', error);
      toast({
        title: "Error Loading Data",
        description: "Could not load processing information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (sessions: ProcessingSession[]): ProcessingStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const activeSessions = sessions.filter(s => s.status === 'processing').length;
    const stalledSessions = sessions.filter(s => isSessionStalled(s)).length;
    const completedToday = sessions.filter(s => {
      const completedAt = s.completed_at ? new Date(s.completed_at) : null;
      return completedAt && completedAt >= today;
    }).length;
    
    const totalRecordsProcessed = sessions.reduce((sum, s) => sum + (s.processed_records || 0), 0);
    
    // Calculate average processing rate (records per minute)
    const processingRates = sessions
      .filter(s => s.status === 'completed' && s.completed_at)
      .map(s => {
        const start = new Date(s.created_at);
        const end = new Date(s.completed_at!);
        const minutes = (end.getTime() - start.getTime()) / (1000 * 60);
        return minutes > 0 ? (s.processed_records || 0) / minutes : 0;
      })
      .filter(rate => rate > 0);
    
    const averageProcessingRate = processingRates.length > 0 
      ? processingRates.reduce((sum, rate) => sum + rate, 0) / processingRates.length 
      : 0;

    return {
      totalSessions: sessions.length,
      activeSessions,
      stalledSessions,
      completedToday,
      totalRecordsProcessed,
      averageProcessingRate: Math.round(averageProcessingRate * 100) / 100
    };
  };

  const isSessionStalled = (session: ProcessingSession): boolean => {
    if (session.status !== 'processing') return false;
    
    const lastUpdate = new Date(session.updated_at);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    // Consider stalled if no update in 10 minutes and not completed
    return minutesSinceUpdate > 10 && (session.processed_records || 0) < (session.total_records || 0);
  };

  const getSessionProgress = (session: ProcessingSession): number => {
    if (session.total_records === 0) return 0;
    return Math.round(((session.processed_records || 0) / session.total_records) * 100);
  };

  const getEstimatedCompletion = (session: ProcessingSession): string => {
    if (session.status !== 'processing') return 'N/A';
    
    const start = new Date(session.created_at);
    const now = new Date();
    const elapsedMinutes = (now.getTime() - start.getTime()) / (1000 * 60);
    
    if (elapsedMinutes === 0 || !session.processed_records) return 'Calculating...';
    
    const rate = session.processed_records / elapsedMinutes;
    const remaining = (session.total_records || 0) - (session.processed_records || 0);
    
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

  const forceProcessing = async (sessionId: string) => {
    try {
      setProcessingSession(sessionId);
      
      // Update the session to trigger processing
      const { error } = await supabase
        .from('csv_upload_sessions')
        .update({
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Processing Resumed",
        description: "Session has been marked for continued processing",
      });

      // Refresh data after a delay
      setTimeout(loadProcessingData, 2000);
      
    } catch (error) {
      console.error('Error forcing processing:', error);
      toast({
        title: "Force Processing Failed",
        description: "Could not resume processing for this session",
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

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
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
                <span>Processing Monitor</span>
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

        {/* Statistics Overview */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-blue-600">{stats?.totalSessions || 0}</div>
              <div className="text-sm text-gray-500">Total Sessions</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-orange-600">{stats?.activeSessions || 0}</div>
              <div className="text-sm text-gray-500">Active</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-red-600">{stats?.stalledSessions || 0}</div>
              <div className="text-sm text-gray-500">Stalled</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-green-600">{stats?.completedToday || 0}</div>
              <div className="text-sm text-gray-500">Completed Today</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-purple-600">{stats?.totalRecordsProcessed.toLocaleString() || 0}</div>
              <div className="text-sm text-gray-500">Records Processed</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-indigo-600">{stats?.averageProcessingRate || 0}</div>
              <div className="text-sm text-gray-500">Avg Rate/min</div>
            </Card>
          </div>
        </div>

        {/* Sessions List */}
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Processing Sessions</h3>
          
          {sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card key={session.id} className={`p-4 ${isSessionStalled(session) ? 'border-red-200 bg-red-50' : ''}`}>
                  <div className="space-y-4">
                    {/* Session Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-medium">{session.original_filename}</div>
                          <div className="text-sm text-gray-500">
                            {formatFileSize(session.file_size || 0)} • Started: {formatDate(session.created_at)}
                          </div>
                        </div>
                        {getStatusBadge(session)}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isSessionStalled(session) && (
                          <Button
                            size="sm"
                            onClick={() => forceProcessing(session.id)}
                            disabled={processingSession === session.id}
                            className="flex items-center space-x-1"
                          >
                            {processingSession === session.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Zap className="h-3 w-3" />
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
                          {(session.processed_records || 0).toLocaleString()} / {session.total_records.toLocaleString()}
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
                    {isSessionStalled(session) && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Processing Stalled:</strong> This session hasn't been updated in over 10 minutes. 
                          It may need manual intervention to continue processing.
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
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No processing sessions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProcessingMonitor;

