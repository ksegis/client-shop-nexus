
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

export interface ServiceUpdate {
  id: string;
  content: string;
  timestamp?: string;
  created_at: string;
  images?: string[];
  milestone?: string;
  milestoneCompleted?: boolean;
  milestone_completed?: boolean;
  work_order_id: string;
}

interface ServiceUpdatesHook {
  updates: ServiceUpdate[];
  loading: boolean;
  error: Error | null;
}

export const useServiceUpdates = (workOrderId: string): ServiceUpdatesHook => {
  const [updates, setUpdates] = useState<ServiceUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUpdates = async () => {
      if (!workOrderId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Check if this is a test/mock user or work order
        if (workOrderId.startsWith('wo-') || !user?.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          // For test/mock data
          const mockUpdates = [
            {
              id: '1',
              work_order_id: workOrderId,
              content: 'Initial inspection complete. Found worn brake pads and recommended replacement.',
              timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              milestone: 'Inspection',
              milestoneCompleted: true
            },
            {
              id: '2',
              work_order_id: workOrderId,
              content: 'Parts ordered and received. Scheduling service for tomorrow.',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              milestone: 'Parts Procurement',
              milestoneCompleted: true
            },
            {
              id: '3',
              work_order_id: workOrderId,
              content: 'Brake service in progress. Front pads replaced, working on rear brakes.',
              timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              milestone: 'Service',
              milestoneCompleted: false
            }
          ] as ServiceUpdate[];
          
          setUpdates(mockUpdates);
          setLoading(false);
          return;
        }
        
        // First verify that this workOrderId belongs to the current user
        const { data: workOrder, error: workOrderError } = await supabase
          .from('work_orders')
          .select('id, customer_id')
          .eq('id', workOrderId)
          .eq('customer_id', user?.id)
          .maybeSingle();
          
        if (workOrderError) throw workOrderError;
        
        // If no work order found or doesn't belong to this user, return empty updates
        if (!workOrder) {
          setUpdates([]);
          setLoading(false);
          return;
        }

        // Fetch updates from the service_updates table
        const { data, error } = await supabase
          .from('service_updates')
          .select('*')
          .eq('work_order_id', workOrderId)
          .order('created_at', { ascending: true });
          
        if (error) throw error;

        // Transform to match expected format
        const formattedUpdates = data.map(update => ({
          id: update.id,
          work_order_id: update.work_order_id,
          content: update.content,
          timestamp: update.created_at,
          created_at: update.created_at,
          images: update.images,
          milestone: update.milestone,
          milestoneCompleted: update.milestone_completed,
          milestone_completed: update.milestone_completed
        })) as ServiceUpdate[];
        
        setUpdates(formattedUpdates);
      } catch (error) {
        console.error('Error fetching service updates:', error);
        setError(error instanceof Error ? error : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchUpdates();
  }, [workOrderId, user?.id]);

  return { updates, loading, error };
};
