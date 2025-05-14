
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Estimate, EstimateStatus, EstimateStats } from '../types';

export function useEstimatesData() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  // Separate data fetcher function to use with useQuery
  const fetchEstimates = async () => {
    try {
      console.log("Fetching estimates from Supabase");
      
      const { data, error: queryError } = await supabase
        .from('estimates')
        .select(`
          *,
          vehicles (
            make,
            model,
            year
          ),
          profiles!estimates_customer_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });
        
      if (queryError) {
        console.error("Supabase error:", queryError);
        throw queryError;
      }
      
      console.log("Fetched estimates:", data?.length || 0);
      return (data as Estimate[]) || [];
    } catch (error) {
      console.error("Error in fetchEstimates:", error);
      setError(error as Error);
      return [];
    }
  };

  // Use React Query to fetch and cache the data
  const { data: estimates = [], isLoading } = useQuery({
    queryKey: ['estimates'],
    queryFn: fetchEstimates
  });

  // Set up realtime subscription for estimate updates
  useEffect(() => {
    const estimatesChannel = supabase
      .channel('shop-estimates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'estimates'
        }, 
        (payload) => {
          console.log('Realtime estimate update:', payload);
          
          // Show notification for customer responses
          if (payload.eventType === 'UPDATE') {
            const newData = payload.new as any;
            const oldData = payload.old as any;
            
            // If status changed from pending to approved or declined
            if (oldData.status === 'pending' && 
                (newData.status === 'approved' || newData.status === 'declined')) {
                
              // Show toast notification
              toast({
                title: `Estimate ${newData.status === 'approved' ? 'Approved' : 'Declined'}`,
                description: `Customer has ${newData.status === 'approved' ? 'approved' : 'declined'} estimate #${newData.id.substring(0, 8)}`,
                variant: newData.status === 'approved' ? 'default' : 'destructive',
              });
              
              // Refresh data
              queryClient.invalidateQueries({ queryKey: ['estimates'] });
            }
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(estimatesChannel);
    };
  }, [queryClient, toast]);

  // Calculate stats from the estimates
  const calculateStats = useCallback(() => {
    const stats: EstimateStats = {
      pending: { count: 0, value: 0 },
      approved: { count: 0, value: 0 },
      declined: { count: 0, value: 0 },
      completed: { count: 0, value: 0 }
    };

    if (estimates && estimates.length > 0) {
      estimates.forEach(estimate => {
        if (stats[estimate.status]) {
          stats[estimate.status].count += 1;
          stats[estimate.status].value += estimate.total_amount || 0;
        }
      });
    }
    
    return stats;
  }, [estimates]);

  const stats = calculateStats();

  // Database operations
  const createEstimate = useCallback(async (estimate: { 
    customer_id: string;
    vehicle_id: string;
    title: string;
    description?: string;
    total_amount?: number;
    status?: EstimateStatus;
  }) => {
    try {
      console.log("Creating estimate:", estimate);
      
      const { error: insertError } = await supabase
        .from('estimates')
        .insert(estimate);
      
      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }
      
      await queryClient.invalidateQueries({ queryKey: ['estimates'] });
      
      toast({
        title: "Success",
        description: "Estimate created successfully",
      });
    } catch (error) {
      console.error("Error creating estimate:", error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create estimate: ${(error as Error).message}`,
      });
      throw error;
    }
  }, [toast, queryClient]);

  const updateEstimate = useCallback(async (id: string, estimate: {
    title?: string;
    description?: string;
    total_amount?: number;
    status?: EstimateStatus;
  }) => {
    try {
      const { error: updateError } = await supabase
        .from('estimates')
        .update(estimate)
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      await queryClient.invalidateQueries({ queryKey: ['estimates'] });
      
      toast({
        title: "Success",
        description: "Estimate updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update estimate: ${(error as Error).message}`,
      });
      throw error;
    }
  }, [toast, queryClient]);

  const updateEstimateStatus = useCallback(async (id: string, status: EstimateStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('estimates')
        .update({ status })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      await queryClient.invalidateQueries({ queryKey: ['estimates'] });
      
      toast({
        title: "Success",
        description: `Estimate status updated to ${status}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update estimate status: ${(error as Error).message}`,
      });
      throw error;
    }
  }, [toast, queryClient]);

  const deleteEstimate = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('estimates')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      await queryClient.invalidateQueries({ queryKey: ['estimates'] });
      
      toast({
        title: "Success",
        description: "Estimate deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete estimate: ${(error as Error).message}`,
      });
      throw error;
    }
  }, [toast, queryClient]);

  const refreshEstimates = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['estimates'] });
  }, [queryClient]);

  return {
    estimates,
    isLoading,
    error,
    stats,
    createEstimate,
    updateEstimate,
    updateEstimateStatus,
    deleteEstimate,
    refreshEstimates
  };
}
