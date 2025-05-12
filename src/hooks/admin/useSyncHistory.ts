
import { useState } from 'react';

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

  const fetchSyncHistory = async () => {
    // In a real application, this would fetch data from an API
    // For now, we'll use mock data
    
    // Explicitly type the mock data to match the SyncStatus interface
    const mockData: SyncStatus[] = [
      {
        id: '1',
        service: 'CRM Integration',
        status: 'success',
        records: 256,
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: '2',
        service: 'Inventory System',
        status: 'warning',
        records: 128,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: '3',
        service: 'Payment Gateway',
        status: 'error',
        records: 0,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      },
      {
        id: '4',
        service: 'Customer Database',
        status: 'in_progress',
        records: 512,
        timestamp: new Date().toISOString(),
      }
    ];
    
    setSyncHistory(mockData);
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    
    // Simulate an API call with a delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add a new sync record
    setSyncHistory(prev => [
      {
        id: Date.now().toString(),
        service: 'Full System Sync',
        status: 'success',
        records: 1024,
        timestamp: new Date().toISOString(),
      },
      ...prev
    ]);
    
    setIsSyncing(false);
  };

  return {
    syncHistory,
    isSyncing,
    fetchSyncHistory,
    triggerSync
  };
};
