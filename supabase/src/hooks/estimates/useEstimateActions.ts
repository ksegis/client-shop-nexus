
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { EstimateData, LineItem } from './types';

export const useEstimateActions = (
  estimateId: string,
  estimate: EstimateData,
  setEstimate: (estimate: EstimateData) => void,
  lineItems: LineItem[],
  setLineItems: (items: LineItem[]) => void
) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [changesAllowed, setChangesAllowed] = useState(true);
  
  // Update changes allowed state based on estimate status
  useEffect(() => {
    if (['approved', 'declined', 'completed'].includes(estimate.status)) {
      setChangesAllowed(false);
    } else {
      // Only allow changes if work order hasn't started
      const workOrderStarted = estimate.workOrderStatus === 'started' || 
                              estimate.workOrderStatus === 'in_progress' || 
                              estimate.workOrderStatus === 'completed' || 
                              estimate.workOrderStatus === 'delivered';
      setChangesAllowed(!workOrderStarted);
    }
  }, [estimate.status, estimate.workOrderStatus]);
  
  const toggleItemApproval = (itemId: string) => {
    // Only allow changes if the estimate status is pending or the work order hasn't started
    if (!changesAllowed) {
      toast({
        title: "Changes not allowed",
        description: "This estimate cannot be modified in its current state",
        variant: "destructive",
      });
      return;
    }
    
    setLineItems(
      lineItems.map((item) =>
        item.id === itemId ? { ...item, approved: !item.approved } : item
      )
    );
  };
  
  const areAllItemsApproved = () => {
    return lineItems.every((item) => item.approved);
  };
  
  const handleApproveEstimate = async () => {
    if (!estimateId || !user) return;
    
    // Check if changes are allowed
    if (!changesAllowed) {
      toast({
        title: "Operation not allowed",
        description: "This estimate cannot be modified in its current state",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Update all line items to approved
      setLineItems(lineItems.map((item) => ({ ...item, approved: true })));
      
      // Update estimate status
      const { error } = await supabase
        .from('estimates')
        .update({ status: 'approved' })
        .eq('id', estimateId)
        .eq('customer_id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setEstimate({ ...estimate, status: 'approved' });
      setChangesAllowed(false);
      
      toast({
        title: "Estimate Approved",
        description: "Your estimate has been approved and sent to the shop.",
      });
    } catch (error: any) {
      console.error('Error approving estimate:', error);
      toast({
        title: "Error",
        description: `Failed to approve estimate: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  
  const handleRejectEstimate = async () => {
    if (!estimateId || !user) return;
    
    // Check if changes are allowed
    if (!changesAllowed) {
      toast({
        title: "Operation not allowed",
        description: "This estimate cannot be modified in its current state",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Update estimate status
      const { error } = await supabase
        .from('estimates')
        .update({ status: 'declined' })
        .eq('id', estimateId)
        .eq('customer_id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setEstimate({ ...estimate, status: 'declined' });
      setChangesAllowed(false);
      
      toast({
        title: "Estimate Rejected",
        description: "Your estimate has been rejected.",
      });
    } catch (error: any) {
      console.error('Error rejecting estimate:', error);
      toast({
        title: "Error",
        description: `Failed to reject estimate: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return {
    changesAllowed,
    toggleItemApproval,
    areAllItemsApproved,
    handleApproveEstimate,
    handleRejectEstimate
  };
};
