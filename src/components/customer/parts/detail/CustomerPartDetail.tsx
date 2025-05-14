
import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PartDetailHeader } from "@/components/shared/parts/detail/PartDetailHeader";
import { PartDetailBody } from "@/components/shared/parts/detail/PartDetailBody";
import { PartDetailActions } from "@/components/shared/parts/detail/PartDetailActions";
import { Part } from "@/types/parts";

interface CustomerPartDetailProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPart: Part | null;
  onAddToCart: (part: Part, quantity: number) => void;
}

export function CustomerPartDetail({
  isOpen,
  onClose,
  selectedPart,
  onAddToCart
}: CustomerPartDetailProps) {
  const [quantity, setQuantity] = useState(1);
  
  // Reset quantity when dialog opens with new part
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);
  
  const handleClose = () => {
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px]">
        <PartDetailHeader 
          part={selectedPart} 
          isLoading={false}
          hideSku={true}
        />
        
        <PartDetailBody 
          part={selectedPart}
          isLoading={false}
          quantity={quantity}
          setQuantity={setQuantity}
          hideSupplier={true}
        />
        
        <PartDetailActions
          part={selectedPart}
          quantity={quantity}
          onAddToCart={onAddToCart}
          handleClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}
