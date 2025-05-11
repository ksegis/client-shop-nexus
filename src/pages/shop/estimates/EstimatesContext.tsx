
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
  line_items?: {
    id: string;
    description: string;
    quantity: number;
    price: number;
    part_number?: string | null;
    vendor?: string | null;
  }[];
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
        console.log("Fetching estimates with line items");
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
            ),
            estimate_items (
              id,
              description,
              quantity,
              price,
              part_number,
              vendor
            )
          `)
          .order('created_at', { ascending: false });
          
        if (queryError) throw queryError;
        
        // Process the data to have line_items property
        const processedData = data?.map(est => ({
          ...est,
          line_items: est.estimate_items || [],
          // Remove estimate_items to avoid duplicated data
          estimate_items: undefined
        }));
        
        console.log("Processed estimate data:", processedData);
        return (processedData as unknown) as Estimate[];
      } catch (error) {
        console.error("Error fetching estimates:", error);
        setError(error as Error);
        return [];
      }
    },
  });

  const createEstimate = async (formValues: EstimateFormValues) => {
    try {
      console.log("EstimatesContext - createEstimate called with:", formValues);
      
      // Validate required fields
      if (!formValues.customer_id) throw new Error("Customer is required");
      if (!formValues.vehicle_id) throw new Error("Vehicle is required");
      if (!formValues.title) throw new Error("Title is required");
      
      const newEstimate = {
        customer_id: formValues.customer_id,
        vehicle_id: formValues.vehicle_id,
        title: formValues.title,
        description: formValues.description || null,
        total_amount: formValues.total_amount || 0,
        status: formValues.status || 'pending'
      };
      
      console.log("EstimatesContext - Inserting new estimate:", newEstimate);
      
      const { error: insertError, data } = await supabase
        .from('estimates')
        .insert(newEstimate)
        .select();
      
      if (insertError) {
        console.error("EstimatesContext - Insert error:", insertError);
        throw insertError;
      }
      
      console.log("EstimatesContext - Insert successful, data:", data);
      
      // If line items exist, insert them
      if (formValues.line_items && formValues.line_items.length > 0 && data && data.length > 0) {
        const estimateId = data[0].id;
        
        const lineItems = formValues.line_items.map(item => ({
          estimate_id: estimateId,
          description: item.description,
          quantity: item.quantity || 1,
          price: item.price || 0,
          part_number: item.part_number || null,
          vendor: item.vendor || null
        }));
        
        console.log("EstimatesContext - Inserting line items:", lineItems);
        
        const { error: lineItemError } = await supabase
          .from('estimate_items')
          .insert(lineItems);
        
        if (lineItemError) {
          console.error("EstimatesContext - Line item insert error:", lineItemError);
          // We don't throw here to avoid rolling back the estimate creation
          toast({
            variant: "destructive",
            title: "Warning",
            description: "Estimate created but some line items failed to save",
          });
        }
      }
      
      await refetch();
      toast({
        title: "Success",
        description: "Estimate created successfully",
      });
    } catch (error) {
      console.error("EstimatesContext - Create estimate error:", error);
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
      // Extract line_items to handle separately
      const { line_items, ...estimateData } = updatedEstimate;
      
      // Update the estimate record
      const { error: updateError } = await supabase
        .from('estimates')
        .update(estimateData)
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Handle line items if they were updated
      if (line_items) {
        // Get existing line items to determine what to delete
        const { data: existingItems } = await supabase
          .from('estimate_items')
          .select('id')
          .eq('estimate_id', id);
        
        const existingIds = existingItems?.map(item => item.id) || [];
        const updatedIds = line_items.filter(item => item.id).map(item => item.id as string);
        
        // Items to delete (exist in database but not in the updated list)
        const idsToDelete = existingIds.filter(existId => !updatedIds.includes(existId));
        
        if (idsToDelete.length > 0) {
          await supabase
            .from('estimate_items')
            .delete()
            .in('id', idsToDelete);
        }
        
        // Update existing items and insert new ones
        for (const item of line_items) {
          if (item.id) {
            // Update existing item
            await supabase
              .from('estimate_items')
              .update({
                description: item.description,
                quantity: item.quantity,
                price: item.price,
                part_number: item.part_number || null,
                vendor: item.vendor || null
              })
              .eq('id', item.id);
          } else {
            // Insert new item
            await supabase
              .from('estimate_items')
              .insert({
                estimate_id: id,
                description: item.description,
                quantity: item.quantity,
                price: item.price,
                part_number: item.part_number || null,
                vendor: item.vendor || null
              });
          }
        }
      }
      
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
      // First delete related line items
      const { error: deleteItemsError } = await supabase
        .from('estimate_items')
        .delete()
        .eq('estimate_id', id);
      
      if (deleteItemsError) {
        console.warn("Warning: Failed to delete some estimate items:", deleteItemsError);
      }
      
      // Then delete the estimate
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
