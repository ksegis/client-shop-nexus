
import { useState } from 'react';
import { usePartsQuotation } from '@/hooks/parts/usePartsQuotation';
import { Part } from '@/types/parts';
import { useToast } from '@/hooks/use-toast';

export function useQuotationHandler() {
  const { toast } = useToast();
  const {
    quotationItems,
    addToQuotation,
    removeFromQuotation,
    clearQuotation,
    getQuotationTotal
  } = usePartsQuotation();
  
  const [isQuotationDialogOpen, setQuotationDialogOpen] = useState(false);
  
  // Add a part to the quotation
  const handleAddToQuotation = (part: Part) => {
    console.log('Adding part to quotation:', part);
    addToQuotation({
      part_id: part.id,
      quantity: 1,
      price: part.price,
      core_charge: part.core_charge || 0,
      special_order: part.is_special_order || false,
      notes: ''
    });
    
    toast({
      title: "Part added to quotation",
      description: `${part.name} has been added to your quotation.`,
    });
  };
  
  // Add part from dialog with custom quantity
  const handleAddToQuotationFromDialog = (part: Part, quantity: number = 1) => {
    console.log('Adding part to quotation from dialog:', part, 'quantity:', quantity);
    addToQuotation({
      part_id: part.id,
      quantity,
      price: part.price,
      core_charge: part.core_charge || 0,
      special_order: part.is_special_order || false,
      notes: ''
    });
    
    toast({
      title: "Part added to quotation",
      description: `${quantity}x ${part.name} added to quotation.`,
    });
  };
  
  const getQuotationItemCount = () => {
    return quotationItems.reduce((total, item) => total + item.quantity, 0);
  };

  return {
    quotationItems,
    isQuotationDialogOpen,
    setQuotationDialogOpen,
    handleAddToQuotation,
    handleAddToQuotationFromDialog,
    removeFromQuotation,
    clearQuotation,
    getQuotationItemCount,
    getQuotationTotal
  };
}
