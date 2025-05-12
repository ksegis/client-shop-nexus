
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useEstimateToInvoice = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getEstimateData = async (estimateId: string) => {
    setLoading(true);
    try {
      // Fetch estimate details
      const { data: estimate, error } = await supabase
        .from('estimates')
        .select(`
          *,
          profiles:customer_id (first_name, last_name, email)
        `)
        .eq('id', estimateId)
        .single();

      if (error) throw error;

      // Fetch line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('estimate_items')
        .select('*')
        .eq('estimate_id', estimateId);

      if (lineItemsError) throw lineItemsError;

      return {
        estimate,
        lineItems: lineItems || []
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
