
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface SystemStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  lastCheck: Date;
  message?: string;
}

export const useSystemStatus = () => {
  const [systems, setSystems] = useState<SystemStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  return {
    systems,
    isLoading,
    fetchSystemStatus
  };
};
