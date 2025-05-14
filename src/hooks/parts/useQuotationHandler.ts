
import { usePartsQuotation } from '@/hooks/parts/usePartsQuotation';
import { Part } from '@/types/parts';
import { useToast } from '@/hooks/use-toast';

export function useQuotationHandler() {
  const { toast } = useToast();
  const {
    quotationItems,
    isDialogOpen,
    setIsDialogOpen,
    addToQuotation,
    removeFromQuotation,
    getQuotationItemCount,
    getQuotationTotal
  } = usePartsQuotation();
  
  // Handle adding to quotation
  const handleAddToQuotation = (part: Part) => {
    addToQuotation(part, 1);
  };
  
  // Handle adding to quotation from dialog
  const handleAddToQuotationFromDialog = (part: Part, quantity: number) => {
    addToQuotation(part, quantity);
  };

  return {
    quotationItems,
    isQuotationDialogOpen: isDialogOpen,
    setQuotationDialogOpen: setIsDialogOpen,
    handleAddToQuotation,
    handleAddToQuotationFromDialog,
    removeFromQuotation,
    getQuotationItemCount,
    getQuotationTotal
  };
}
