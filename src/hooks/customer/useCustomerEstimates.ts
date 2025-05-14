
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Estimate = Database['public']['Tables']['estimates']['Row'];
type EstimateWithDetails = Estimate & {
  vehicles: {
    make: string;
    model: string;
    year: number;
  } | null;
  estimate_items: {
    id: string;
    description: string;
    quantity: number;
    price: number;
    part_number?: string;
    vendor?: string;
    approved: boolean;
  }[];
};

export const useCustomerEstimates = () => {
  const [estimates, setEstimates] = useState<EstimateWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch estimates for the current user
  const fetchEstimates = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('estimates')
        .select(`
          *,
          vehicles (
            make,
            model,
            year
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
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Transform the data to include approved status for items
      const transformedEstimates = (data || []).map(estimate => ({
        ...estimate,
        estimate_items: estimate.estimate_items.map(item => ({
          ...item,
          approved: estimate.status === 'approved'
        }))
      }));
      
      setEstimates(transformedEstimates);
    } catch (error: any) {
      console.error('Error fetching estimates:', error);
      toast({
        title: 'Error fetching estimates',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to realtime updates for estimates
  useEffect(() => {
    if (!user) return;
    
    fetchEstimates();
    
    // Set up realtime subscription
    const estimatesChannel = supabase
      .channel('customer-estimates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'estimates',
          filter: `customer_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Realtime estimate update:', payload);
          fetchEstimates(); // Refresh estimates when changes occur
          
          // Show notification for new estimates
          if (payload.eventType === 'INSERT') {
            toast({
              title: 'New Estimate Available',
              description: 'You have a new estimate to review',
              variant: 'default',
            });
          }
          
          // Show notification for updated estimates
          if (payload.eventType === 'UPDATE') {
            toast({
              title: 'Estimate Updated',
              description: 'An estimate has been updated',
              variant: 'default',
            });
          }
        }
      )
      .subscribe();
      
    // Also subscribe to estimate_items changes
    const itemsChannel = supabase
      .channel('customer-estimate-items')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'estimate_items'
        }, 
        () => {
          fetchEstimates(); // Refresh estimates when line items change
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(estimatesChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, [user, toast]);

  // Function to approve an estimate
  const approveEstimate = async (estimateId: string, comments?: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('estimates')
        .update({ 
          status: 'approved',
          description: comments ? `${comments}\n\n${comments}` : undefined
        })
        .eq('id', estimateId)
        .eq('customer_id', user.id);
        
      if (error) throw error;
      
      toast({
        title: 'Estimate Approved',
        description: 'Your approval has been sent to the shop',
        variant: 'default',
      });
      
      // Refresh estimates to update UI
      fetchEstimates();
      
      return true;
    } catch (error: any) {
      console.error('Error approving estimate:', error);
      toast({
        title: 'Error',
        description: `Failed to approve estimate: ${error.message}`,
        variant: 'destructive',
      });
      return false;
    }
  };
  
  // Function to reject an estimate
  const rejectEstimate = async (estimateId: string, comments?: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('estimates')
        .update({ 
          status: 'declined',
          description: comments ? `${comments}\n\n${comments}` : undefined
        })
        .eq('id', estimateId)
        .eq('customer_id', user.id);
        
      if (error) throw error;
      
      toast({
        title: 'Estimate Rejected',
        description: 'Your rejection has been sent to the shop',
        variant: 'default',
      });
      
      // Refresh estimates to update UI
      fetchEstimates();
      
      return true;
    } catch (error: any) {
      console.error('Error rejecting estimate:', error);
      toast({
        title: 'Error',
        description: `Failed to reject estimate: ${error.message}`,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    estimates,
    loading,
    approveEstimate,
    rejectEstimate,
    refreshEstimates: fetchEstimates
  };
};
