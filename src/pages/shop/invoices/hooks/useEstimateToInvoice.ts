
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useEstimateToInvoice = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getEstimateData = async (estimateId: string) => {
    setLoading(true);
    try {
      // Fetch estimate details with line_items from JSON column
      const { data: estimate, error } = await supabase
        .from('estimates')
        .select(`
          *,
          profiles:customer_id (first_name, last_name, email)
        `)
        .eq('id', estimateId)
        .single();

      if (error) throw error;

      // Use line_items from the estimates table (JSON column)
      const lineItems = estimate.line_items || [];

      return {
        estimate,
        lineItems
      };
    } catch (error) {
      console.error('Error loading estimate data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load estimate data"
      });
      return { estimate: null, lineItems: [] };
    } finally {
      setLoading(false);
    }
  };

  return {
    getEstimateData,
    loading
  };
};
