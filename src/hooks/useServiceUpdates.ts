
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
  milestone?: string;
  images?: string[];
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
      // Using a mock data approach since service_updates table might not exist in schema
      // We can replace this with actual API calls once the table is created
      const mockUpdates: ServiceUpdate[] = [
        {
          id: 'mock-update-1',
          work_order_id: id,
          content: 'Initial diagnostic completed. Found issues with brake system.',
          milestone: 'Diagnostic Completed',
          milestone_completed: true,
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          updated_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'mock-update-2',
          work_order_id: id,
          content: 'Parts ordered, waiting for delivery.',
          milestone: 'Parts Ordered',
          milestone_completed: true,
          created_at: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
          updated_at: new Date(Date.now() - 43200000).toISOString()
        },
        {
          id: 'mock-update-3',
          work_order_id: id,
          content: 'Repairs in progress. Replacing brake pads and rotors.',
          milestone: 'Repair In Progress',
          milestone_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setUpdates(mockUpdates);
      
      // NOTE: Once the service_updates table is created in the database, we can uncomment and use:
      /*
      const { data, error } = await supabase
        .from('service_updates')
        .select('*')
        .eq('work_order_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setUpdates(data as ServiceUpdate[]);
      */
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
    milestone?: string;
    milestone_completed?: boolean;
    images?: File[];
  }) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to add updates');
      }
      
      // For mocked data implementation
      const mockUpdate: ServiceUpdate = {
        id: `mock-update-${Date.now()}`,
        work_order_id: newUpdate.work_order_id,
        content: newUpdate.content,
        milestone: newUpdate.milestone,
        milestone_completed: newUpdate.milestone_completed || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: newUpdate.images ? newUpdate.images.map(file => URL.createObjectURL(file)) : undefined
      };
      
      // Update the local state with the new update
      setUpdates(prev => [mockUpdate, ...prev]);
      
      toast({
        title: 'Success',
        description: 'Service update added successfully'
      });
      
      // NOTE: Once service_updates table exists, we can use:
      /*
      const { data, error } = await supabase
        .from('service_updates')
        .insert({
          work_order_id: newUpdate.work_order_id,
          content: newUpdate.content,
          milestone: newUpdate.milestone,
          milestone_completed: newUpdate.milestone_completed || false,
          // Would need to handle image uploads separately
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Update the local state with the new update
      setUpdates(prev => [data as ServiceUpdate, ...prev]);
      */
      
      return mockUpdate;
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
