
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Check, AlertTriangle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SystemStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  lastCheck: Date;
  message?: string;
}

interface SyncStatus {
  id: string;
  service: string;
  status: 'success' | 'warning' | 'error' | 'in_progress';
  records: number;
  timestamp: string;
}

const mockPerformanceData = [
  { name: '00:00', value: 80 },
  { name: '04:00', value: 78 },
  { name: '08:00', value: 92 },
  { name: '12:00', value: 85 },
  { name: '16:00', value: 90 },
  { name: '20:00', value: 88 },
  { name: 'Now', value: 95 },
];

const SystemHealth = () => {
  const [systems, setSystems] = useState<SystemStatus[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSystemStatus();
    fetchSyncHistory();
  }, []);

  const fetchSystemStatus = async () => {
    setIsLoading(true);
    
    // This would normally be an API call to check various system statuses
    // For demo purposes, we'll use mock data
    const mockSystems: SystemStatus[] = [
      {
        name: 'Database',
        status: 'healthy',
        lastCheck: new Date(),
      },
      {
        name: 'Authentication Service',
        status: 'healthy',
        lastCheck: new Date(),
      },
      {
        name: 'GHL Integration',
        status: 'warning',
        lastCheck: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        message: 'High latency detected',
      },
      {
        name: 'Distributor API',
        status: 'healthy',
        lastCheck: new Date(),
      },
    ];
    
    setSystems(mockSystems);
    setIsLoading(false);
  };

  const fetchSyncHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('sync_history')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      setSyncHistory(data || []);
    } catch (error) {
      console.error('Error fetching sync history:', error);
      // If we can't get real data, use mock data for demonstration
      const mockSyncHistory: SyncStatus[] = [
        {
          id: '1',
          service: 'GHL Contacts',
          status: 'success',
          records: 250,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        },
        {
          id: '2',
          service: 'Distributor Inventory',
          status: 'warning',
          records: 1200,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
        },
        {
          id: '3',
          service: 'Customer Data',
          status: 'success',
          records: 320,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        },
      ];
      
      setSyncHistory(mockSyncHistory);
    }
  };

  const handleRefresh = () => {
    fetchSystemStatus();
    fetchSyncHistory();
    
    toast({
      title: "Refreshed",
      description: "System status has been updated",
    });
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    
    // This would normally be an API call to trigger a sync
    // For demo purposes, we'll simulate a delay
    setTimeout(() => {
      setIsSyncing(false);
      
      toast({
        title: "Sync Completed",
        description: "Data synchronization completed successfully",
      });
      
      // Add a new sync record to the history
      const newSync: SyncStatus = {
        id: Date.now().toString(),
        service: 'Full System Sync',
        status: 'success',
        records: Math.floor(Math.random() * 1000) + 200,
        timestamp: new Date().toISOString(),
      };
      
      setSyncHistory([newSync, ...syncHistory.slice(0, 4)]);
    }, 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Healthy</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Warning</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">System Health Dashboard</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={triggerSync} 
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : 'Sync All Data'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {systems.map((system, index) => (
                <div key={index} className="flex items-center justify-between p-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(system.status)}
                    <span className="font-medium">{system.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(system.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* System Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={mockPerformanceData}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Storage Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Database Storage</span>
                  <span className="text-sm text-muted-foreground">42% (420MB/1GB)</span>
                </div>
                <Progress value={42} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">File Storage</span>
                  <span className="text-sm text-muted-foreground">17% (1.7GB/10GB)</span>
                </div>
                <Progress value={17} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">API Requests (Monthly)</span>
                  <span className="text-sm text-muted-foreground">73% (73K/100K)</span>
                </div>
                <Progress value={73} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Syncs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Synchronizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {syncHistory.map((sync) => (
                <div key={sync.id} className="flex items-center justify-between p-2 border-b last:border-0">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(sync.status)}
                      <span className="font-medium">{sync.service}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(sync.timestamp)} • {sync.records} records
                    </span>
                  </div>
                  <div>
                    {getStatusBadge(sync.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemHealth;
