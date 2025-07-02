
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PartReturn, Part } from '@/types/parts';

export function useCoreReturns() {
  const { toast } = useToast();
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [returns, setReturns] = useState<PartReturn[]>([]);
  
  const openCoreReturnDialog = (part: Part) => {
    if (!part.core_charge) {
      toast({
        title: "No core charge",
        description: "This part does not have a core charge associated with it.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedPart(part);
    setIsDialogOpen(true);
  };
  
  const processCoreReturn = (partId: string, returnData: Omit<PartReturn, 'id' | 'order_item_id' | 'return_date'>) => {
    const now = new Date();
    
    // Generate random order item ID for demo purposes
    // In a real app, this would be an actual order item ID
    const orderItemId = `OI-${Math.floor(Math.random() * 10000)}`;
    
    const newReturn: PartReturn = {
      id: `CR-${Math.floor(Math.random() * 10000)}`,
      order_item_id: orderItemId,
      return_date: now.toISOString(),
      reason: returnData.reason,
      condition: returnData.condition,
      approved: returnData.approved,
      refund_amount: returnData.refund_amount,
      processed_by: returnData.processed_by
    };
    
    setReturns(prev => [...prev, newReturn]);
    
    toast({
      title: "Core return processed",
      description: `Processed return with refund amount $${newReturn.refund_amount.toFixed(2)}.`
    });
    
    setIsDialogOpen(false);
    setSelectedPart(null);
  };
  
  return {
    selectedPart,
    isDialogOpen,
    setIsDialogOpen,
    openCoreReturnDialog,
    processCoreReturn,
    returns
  };
}
