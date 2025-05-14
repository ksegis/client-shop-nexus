
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';
import { useAuth } from '@/contexts/auth';

// Define proper service update types
export type ServiceUpdate = {
  id: string;
  work_order_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  milestone_completed?: boolean;
};

export function useServiceUpdates(workOrderId?: string) {
  const [updates, setUpdates] = useState<ServiceUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Fetch service updates for a specific work order
  const fetchUpdates = async (id?: string) => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // For this table, we need to use a direct query since it's not in the type definitions
      const { data, error } = await supabase
        .from('service_updates')
        .select('*')
        .eq('work_order_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Type assertion here since we know the structure
      setUpdates(data as ServiceUpdate[]);
    } catch (err: any) {
      console.error('Error fetching service updates:', err);
      setError(err.message || 'Failed to fetch service updates');
      toast({ 
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch service updates' 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load updates when the component mounts or when workOrderId changes
  useEffect(() => {
    if (workOrderId) {
      fetchUpdates(workOrderId);
    } else {
      setUpdates([]);
    }
  }, [workOrderId]);
  
  // Add a new service update
  const addUpdate = async (newUpdate: { 
    work_order_id: string;
    content: string;
    milestone_completed?: boolean;
  }) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to add updates');
      }
      
      // For this table, we need to use a direct insert
      const { data, error } = await supabase
        .from('service_updates')
        .insert({
          work_order_id: newUpdate.work_order_id,
          content: newUpdate.content,
          milestone_completed: newUpdate.milestone_completed || false,
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Update the local state with the new update
      setUpdates(prev => [data as ServiceUpdate, ...prev]);
      
      toast({
        title: 'Success',
        description: 'Service update added successfully'
      });
      
      return data as ServiceUpdate;
    } catch (err: any) {
      console.error('Error adding service update:', err);
      toast({ 
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to add service update' 
      });
      return null;
    }
  };

  return {
    updates,
    isLoading,
    error,
    fetchUpdates,
    addUpdate
  };
}
