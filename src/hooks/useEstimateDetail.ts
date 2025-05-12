
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface LineItem {
  id: string;
  part_number?: string;
  description: string;
  quantity: number;
  price: number;
  approved: boolean;
}

interface EstimateData {
  id: string;
  date: string;
  vehicle: string;
  status: 'pending' | 'approved' | 'declined' | 'completed';
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  workOrderStatus: string | null;
}

export const useEstimateDetail = (estimateId: string) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [estimate, setEstimate] = useState<EstimateData>({
    id: estimateId || '',
    date: '',
    vehicle: '',
    status: 'pending',
    subtotal: 0,
    tax: 0,
    total: 0,
    notes: '',
    workOrderStatus: null
  });
  
  const [relatedInvoice, setRelatedInvoice] = useState<any>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [changesAllowed, setChangesAllowed] = useState(true);
  const [loading, setLoading] = useState(true);

  // Fetch the estimate and related data when the page loads
  useEffect(() => {
    if (!estimateId || !user) return;
    
    const fetchEstimateData = async () => {
      try {
        setLoading(true);
        // Fetch estimate data
        const { data: estimateData, error: estimateError } = await supabase
          .from('estimates')
          .select('*, vehicles(make, model, year)')
          .eq('id', estimateId)
          .single();
          
        if (estimateError) throw estimateError;
        
        if (!estimateData) {
          toast({
            title: "Estimate not found",
            description: "The requested estimate could not be found",
            variant: "destructive",
          });
          return;
        }
        
        // Check if the estimate belongs to the current user
        if (estimateData.customer_id !== user.id) {
          toast({
            title: "Unauthorized",
            description: "You do not have permission to view this estimate",
            variant: "destructive",
          });
          return;
        }
        
        setEstimate({
          id: estimateData.id,
          status: estimateData.status,
          date: new Date(estimateData.created_at).toISOString().split('T')[0],
          vehicle: estimateData.vehicles 
            ? `${estimateData.vehicles.year} ${estimateData.vehicles.make} ${estimateData.vehicles.model}`
            : 'Unknown',
          subtotal: estimateData.total_amount,
          tax: 0, // Tax calculation would go here
          total: estimateData.total_amount,
          notes: estimateData.description || '',
          workOrderStatus: null
        });
        
        // Fetch line items
        const { data: lineItemsData, error: lineItemsError } = await supabase
          .from('estimate_items')
          .select('*')
          .eq('estimate_id', estimateId);
          
        if (lineItemsError) throw lineItemsError;
        
        // Transform the data for our component
        const transformedItems = (lineItemsData || []).map(item => ({
          id: item.id,
          part_number: item.part_number || '',
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          approved: estimateData.status === 'approved' || estimateData.status === 'completed'
        }));
        
        setLineItems(transformedItems);
        
        // Check if there's a related work order
        // For now we're determining this by the estimate status
        const workOrderInProgress = ['approved', 'completed'].includes(estimateData.status);
        if (workOrderInProgress) {
          setEstimate(prev => ({ 
            ...prev, 
            workOrderStatus: estimateData.status === 'completed' ? 'completed' : 'started' 
          }));
          // If work order is started or later status, prevent changes
          if (workOrderInProgress) {
            setChangesAllowed(false);
          }
        }
        
        // Fetch related invoice if any
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('id, title, status')
          .eq('estimate_id', estimateId)
          .maybeSingle();
          
        if (!invoiceError && invoiceData) {
          setRelatedInvoice(invoiceData);
        }
        
      } catch (error: any) {
        console.error('Error fetching estimate data:', error);
        toast({
          title: "Error",
          description: `Failed to load estimate: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchEstimateData();
  }, [estimateId, user, toast]);
  
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
    estimate,
    lineItems,
    relatedInvoice,
    changesAllowed,
    loading,
    toggleItemApproval,
    areAllItemsApproved,
    handleApproveEstimate,
    handleRejectEstimate
  };
};
