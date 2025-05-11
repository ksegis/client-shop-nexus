
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { EstimateFormValues } from './schemas/estimateSchema';

export type Estimate = Database['public']['Tables']['estimates']['Row'] & {
  vehicles?: {
    make: string;
    model: string;
    year: number;
  };
  customer?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
};

interface EstimatesContextType {
  estimates: Estimate[];
  isLoading: boolean;
  error: Error | null;
  createEstimate: (estimate: EstimateFormValues) => Promise<void>;
  updateEstimate: (id: string, estimate: Partial<Estimate>) => Promise<void>;
  updateEstimateStatus: (id: string, status: Database['public']['Enums']['estimate_status']) => Promise<void>;
  deleteEstimate: (id: string) => Promise<void>;
  refreshEstimates: () => Promise<void>;
}

const EstimatesContext = createContext<EstimatesContextType | undefined>(undefined);

export function EstimatesProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  
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

  const createEstimate = async (formValues: EstimateFormValues) => {
    try {
      const { error: insertError } = await supabase
        .from('estimates')
        .insert({
          customer_id: formValues.customer_id,
          vehicle_id: formValues.vehicle_id,
          title: formValues.title,
          description: formValues.description || null,
          total_amount: formValues.total_amount || 0,
          status: formValues.status || 'pending'
        });
      
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

  const updateEstimate = async (id: string, updatedEstimate: Partial<Estimate>) => {
    try {
      const { error: updateError } = await supabase
        .from('estimates')
        .update(updatedEstimate)
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

  const updateEstimateStatus = async (id: string, status: Database['public']['Enums']['estimate_status']) => {
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

  return (
    <EstimatesContext.Provider
      value={{
        estimates,
        isLoading,
        error,
        createEstimate,
        updateEstimate,
        updateEstimateStatus,
        deleteEstimate,
        refreshEstimates
      }}
    >
      {children}
    </EstimatesContext.Provider>
  );
}

export function useEstimates() {
  const context = useContext(EstimatesContext);
  if (context === undefined) {
    throw new Error('useEstimates must be used within a EstimatesProvider');
  }
  return context;
}
