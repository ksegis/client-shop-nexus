
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Estimate, EstimateStatus, EstimateStats } from '../types';

export function useEstimatesData() {
  const [error, setError] = useState<Error | null>(null);

  const { data: estimates = [], isLoading, refetch } = useQuery({
    queryKey: ['estimates'],
    queryFn: async () => {
      try {
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
          
        if (queryError) throw queryError;
        
        return (data as Estimate[]) || [];
      } catch (error) {
        setError(error as Error);
        return [];
      }
    },
  });

  // Calculate stats from the estimates
  const stats: EstimateStats = {
    pending: { count: 0, value: 0 },
    approved: { count: 0, value: 0 },
    declined: { count: 0, value: 0 },
    completed: { count: 0, value: 0 }
  };

  if (estimates) {
    estimates.forEach(estimate => {
      if (stats[estimate.status]) {
        stats[estimate.status].count += 1;
        stats[estimate.status].value += estimate.total_amount || 0;
      }
    });
  }

  const createEstimate = async (estimate: { 
    customer_id: string;
    vehicle_id: string;
    title: string;
    description?: string;
    total_amount?: number;
    status?: EstimateStatus;
  }) => {
    try {
      const { error: insertError } = await supabase
        .from('estimates')
        .insert(estimate);
      
      if (insertError) throw insertError;
      
      await refetch();
      toast({
        title: "Success",
        description: "Estimate created successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create estimate: ${(error as Error).message}`,
      });
      throw error;
    }
  };

  const updateEstimate = async (id: string, estimate: {
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
      
      await refetch();
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
  };

  const updateEstimateStatus = async (id: string, status: EstimateStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('estimates')
        .update({ status })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      await refetch();
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
  };

  const deleteEstimate = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('estimates')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      await refetch();
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
  };

  const refreshEstimates = async () => {
    await refetch();
  };

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
