
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';

export interface ServiceUpdate {
  id: string;
  work_order_id: string;
  content: string;
  images?: string[];
  created_at: string;
  updated_at: string;
  milestone?: string;
  milestone_completed: boolean;
}

export const useServiceUpdates = (workOrderId?: string) => {
  const [updates, setUpdates] = useState<ServiceUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!workOrderId) return;
    
    const fetchUpdates = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('service_updates')
          .select('*')
          .eq('work_order_id', workOrderId)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        setUpdates(data || []);
      } catch (error: any) {
        console.error('Error fetching service updates:', error);
        toast({
          title: 'Error',
          description: `Failed to load updates: ${error.message}`,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUpdates();
    
    // Subscribe to realtime updates
    const updatesChannel = supabase
      .channel(`service-updates-${workOrderId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'service_updates',
          filter: `work_order_id=eq.${workOrderId}`
        }, 
        () => {
          fetchUpdates(); // Refresh updates when changes occur
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(updatesChannel);
    };
  }, [workOrderId, user, toast]);

  const addServiceUpdate = async (update: {
    content: string;
    milestone?: string;
    milestone_completed?: boolean;
    images?: File[];
  }) => {
    if (!workOrderId || !user) return;
    
    try {
      // Upload images if any
      const imageUrls: string[] = [];
      
      if (update.images && update.images.length > 0) {
        for (const file of update.images) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `service-updates/${workOrderId}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('service-images')
            .upload(filePath, file);
            
          if (uploadError) throw uploadError;
          
          // Get public URL
          const { data } = supabase.storage
            .from('service-images')
            .getPublicUrl(filePath);
            
          imageUrls.push(data.publicUrl);
        }
      }
      
      // Add update to database
      const { error } = await supabase
        .from('service_updates')
        .insert({
          work_order_id: workOrderId,
          content: update.content,
          images: imageUrls.length > 0 ? imageUrls : undefined,
          milestone: update.milestone,
          milestone_completed: update.milestone_completed
        });
        
      if (error) throw error;
      
      toast({
        title: 'Update Added',
        description: 'Service update has been shared with the customer',
      });
      
      return true;
    } catch (error: any) {
      console.error('Error adding service update:', error);
      toast({
        title: 'Error',
        description: `Failed to add update: ${error.message}`,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    updates,
    loading,
    addServiceUpdate
  };
};
