
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
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [selectedPartForQuantity, setSelectedPartForQuantity] = useState<Part | null>(null);
  
  // Add a part to the quotation with quantity dialog
  const handleAddToQuotation = (part: Part) => {
    console.log('Opening quantity dialog for quotation:', part);
    setSelectedPartForQuantity(part);
    setQuantityDialogOpen(true);
  };
  
  // Handle quantity confirmation from dialog
  const handleQuotationQuantityConfirm = (quantity: number) => {
    if (selectedPartForQuantity) {
      console.log('Adding part to quotation with quantity:', selectedPartForQuantity, quantity);
      addToQuotation({
        part_id: selectedPartForQuantity.id,
        quantity,
        price: selectedPartForQuantity.price,
        core_charge: selectedPartForQuantity.core_charge || 0,
        special_order: selectedPartForQuantity.is_special_order || false,
        notes: ''
      });
      
      toast({
        title: "Part added to quotation",
        description: `${quantity}x ${selectedPartForQuantity.name} added to quotation.`,
      });
    }
    setSelectedPartForQuantity(null);
  };
  
  // Add part from dialog with custom quantity (for detail dialog)
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
    getQuotationTotal,
    quantityDialogOpen,
    setQuantityDialogOpen,
    selectedPartForQuantity,
    handleQuotationQuantityConfirm
  };
}
