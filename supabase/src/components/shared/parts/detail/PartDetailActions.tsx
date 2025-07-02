
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShoppingCart, FileBarChart } from "lucide-react";
import { Part } from "@/types/parts";

interface PartDetailActionsProps {
  part: Part | null;
  quantity: number;
  onAddToCart?: (part: Part, quantity: number) => void;
  onAddToQuotation?: (part: Part, quantity: number) => void;
  handleClose: () => void;
}

export function PartDetailActions({ 
  part, 
  quantity, 
  onAddToCart, 
  onAddToQuotation,
  handleClose
}: PartDetailActionsProps) {
  if (!part) return null;
  
  const handleAddToCart = () => {
    if (part && onAddToCart) {
      onAddToCart(part, quantity);
      handleClose();
    }
  };

  const handleAddToQuotation = () => {
    if (part && onAddToQuotation) {
      onAddToQuotation(part, quantity);
      handleClose();
    }
  };
  
  return (
    <div className="flex gap-2">
      {onAddToCart && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={handleAddToCart} 
                disabled={part.quantity <= 0}
                className="flex-1"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {part.quantity <= 0 ? 'Out of stock' : `Add ${quantity} to cart`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {onAddToQuotation && (
        <Button 
          onClick={handleAddToQuotation} 
          variant="outline"
          className="flex-1"
        >
          <FileBarChart className="h-4 w-4 mr-2" />
          Add to Quote
        </Button>
      )}
    </div>
  );
}
