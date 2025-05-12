
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useSystemStatus } from '@/hooks/admin/useSystemStatus';
import { useSyncHistory } from '@/hooks/admin/useSyncHistory';
import SystemStatusCard from './components/system/SystemStatusCard';
import PerformanceChart from './components/system/PerformanceChart';
import StorageUsageCard from './components/system/StorageUsageCard';
import SyncHistoryCard from './components/system/SyncHistoryCard';

const SystemHealth = () => {
  const { systems, isLoading, fetchSystemStatus } = useSystemStatus();
  const { syncHistory, isSyncing, fetchSyncHistory, triggerSync } = useSyncHistory();

  const handleRefresh = () => {
    fetchSystemStatus();
    fetchSyncHistory();
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
        <SystemStatusCard systems={systems} />
        
        {/* Performance Chart */}
        <PerformanceChart />
        
        {/* Storage Usage */}
        <StorageUsageCard />
        
        {/* Recent Syncs */}
        <SyncHistoryCard syncHistory={syncHistory} />
      </div>
    </div>
  );
};

export default SystemHealth;
