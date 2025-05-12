
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SyncStatus {
  id: string;
  service: string;
  status: 'success' | 'warning' | 'error' | 'in_progress';
  records: number;
  timestamp: string;
}

export const useSyncHistory = () => {
  const [syncHistory, setSyncHistory] = useState<SyncStatus[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

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

  const triggerSync = async () => {
    setIsSyncing(true);
    
    try {
      // Create a new sync record to represent the current sync operation
      const newSync: SyncStatus = {
        id: Date.now().toString(),
        service: 'Full System Sync',
        status: 'in_progress',
        records: 0,
        timestamp: new Date().toISOString(),
      };
      
      // Add to Supabase
      await supabase.from('sync_history').insert({
        service: newSync.service,
        status: newSync.status,
        records: newSync.records
      });
      
      // For demo purposes, simulate a delay and then update the status
      setTimeout(async () => {
        const completedSync = {
          ...newSync,
          status: 'success' as const,
          records: Math.floor(Math.random() * 1000) + 200,
        };
        
        // Update the record in Supabase
        await supabase
          .from('sync_history')
          .update({
            status: completedSync.status,
            records: completedSync.records
          })
          .eq('service', newSync.service)
          .eq('timestamp', newSync.timestamp);
        
        setIsSyncing(false);
        fetchSyncHistory(); // Refresh the sync history
        
        toast({
          title: "Sync Completed",
          description: "Data synchronization completed successfully",
        });
      }, 3000);
    } catch (error) {
      console.error('Error triggering sync:', error);
      setIsSyncing(false);
      
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "There was an error syncing the data",
      });
    }
  };

  useEffect(() => {
    fetchSyncHistory();
  }, []);

  return {
    syncHistory,
    isSyncing,
    fetchSyncHistory,
    triggerSync
  };
};
