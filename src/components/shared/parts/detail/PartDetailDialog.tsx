
import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PartDetailHeader } from './PartDetailHeader';
import { PartDetailBody } from './PartDetailBody';
import { PartDetailActions } from './PartDetailActions';
import { usePart } from './usePart';

interface PartDetailDialogProps {
  partId: string | null;
  onClose: () => void;
  onAddToCart?: (part: any, quantity: number) => void;
  onAddToQuotation?: (part: any, quantity: number) => void;
  hideSupplier?: boolean;
  hideSku?: boolean;
}

export function PartDetailDialog({ 
  partId, 
  onClose, 
  onAddToCart,
  onAddToQuotation,
  hideSupplier = false,
  hideSku = false
}: PartDetailDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Open/close dialog based on partId
  useEffect(() => {
    if (partId) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [partId]);
  
  // Custom close handler
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Delay to allow animation
  };
  
  // Get part data using the custom hook
  const { part, isLoading, quantity, setQuantity } = usePart(partId);
  
  // Return nothing if dialog is closed
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <PartDetailHeader 
          part={part} 
          isLoading={isLoading} 
          hideSku={hideSku}
        />
        
        <PartDetailBody 
          part={part} 
          isLoading={isLoading} 
          quantity={quantity}
          setQuantity={setQuantity}
          hideSupplier={hideSupplier}
        />
        
        <PartDetailActions
          part={part}
          quantity={quantity}
          onAddToCart={onAddToCart}
          onAddToQuotation={onAddToQuotation}
          handleClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}
