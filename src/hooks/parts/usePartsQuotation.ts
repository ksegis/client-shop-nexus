
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Part, PartOrderItem, PartQuotation } from '@/types/parts';

export interface QuotationItem extends PartOrderItem {
  part: Part;
}

export function usePartsQuotation() {
  const { toast } = useToast();
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [quotations, setQuotations] = useState<PartQuotation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Add item to quotation
  const addToQuotation = (part: Part, quantity: number = 1) => {
    setQuotationItems(prev => {
      // Check if the item is already in the quotation
      const existingItemIndex = prev.findIndex(item => item.part_id === part.id);
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const updatedItems = [...prev];
        updatedItems[existingItemIndex].quantity += quantity;
        
        toast({
          title: "Updated quotation",
          description: `Updated quantity of ${part.name} in quotation.`
        });
        
        return updatedItems;
      } else {
        // Add new item
        toast({
          title: "Added to quotation",
          description: `${part.name} added to quotation.`
        });
        
        return [
          ...prev,
          {
            part_id: part.id,
            quantity,
            price: part.price,
            core_charge: part.core_charge,
            part
          }
        ];
      }
    });
  };
  
  // Remove item from quotation
  const removeFromQuotation = (partId: string) => {
    setQuotationItems(prev => prev.filter(item => item.part_id !== partId));
  };
  
  // Clear quotation
  const clearQuotation = () => {
    setQuotationItems([]);
  };
  
  // Get item count
  const getQuotationItemCount = () => {
    return quotationItems.reduce((sum, item) => sum + item.quantity, 0);
  };
  
  // Calculate quotation total
  const getQuotationTotal = () => {
    return quotationItems.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      const coreCharge = (item.core_charge || 0) * item.quantity;
      return sum + itemTotal + coreCharge;
    }, 0);
  };
  
  // Save quotation
  const saveQuotation = (quotation: PartQuotation) => {
    setQuotations(prev => [...prev, quotation]);
    clearQuotation();
    setIsDialogOpen(false);
  };
  
  return {
    quotationItems,
    quotations,
    isDialogOpen,
    setIsDialogOpen,
    addToQuotation,
    removeFromQuotation,
    clearQuotation,
    getQuotationItemCount,
    getQuotationTotal,
    saveQuotation
  };
}
