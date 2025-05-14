
import { useState, useEffect } from 'react';

export interface ServiceUpdate {
  id: string;
  date: string;
  content: string;
  milestone: string;
  milestone_completed: boolean;
  created_by: {
    name: string;
  };
}

export const useServiceUpdates = (workOrderId: string) => {
  const [updates, setUpdates] = useState<ServiceUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fetch service updates - mock data
    const fetchUpdates = async () => {
      try {
        // Simulate API call
        setTimeout(() => {
          // Mock updates
          const mockUpdates = [
            {
              id: '1',
              date: new Date(Date.now() - 86400000).toISOString(),
              content: 'Initial diagnostic completed. Found excessive wear on front brake pads and rotors. Replacement recommended.',
              milestone: 'Diagnostic Completed',
              milestone_completed: true,
              created_by: {
                name: 'Mike Technician'
              }
            },
            {
              id: '2',
              date: new Date(Date.now() - 43200000).toISOString(),
              content: 'Parts ordered, waiting for delivery.',
              milestone: 'Parts Ordered',
              milestone_completed: true,
              created_by: {
                name: 'Mike Technician'
              }
            },
            {
              id: '3',
              date: new Date().toISOString(),
              content: 'Parts arrived. Repair scheduled for tomorrow morning.',
              milestone: 'Parts Received',
              milestone_completed: true,
              created_by: {
                name: 'Mike Technician'
              }
            }
          ];
          
          setUpdates(mockUpdates);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching service updates:', error);
        setError(error instanceof Error ? error : new Error('Unknown error fetching updates'));
        setLoading(false);
      }
    };
    
    fetchUpdates();
  }, [workOrderId]);

  return { updates, loading, error };
};
