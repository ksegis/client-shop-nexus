
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Part } from "@/types/parts";

interface PartDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPart: Part | null;
  onAddToCart: (part: Part, quantity: number) => void;
}

export function PartDetailView({
  isOpen,
  onClose,
  selectedPart,
  onAddToCart
}: PartDetailViewProps) {
  const [quantity, setQuantity] = useState(1);
  
  // Reset quantity when dialog opens with new part
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen]);
  
  const handleAddToCart = () => {
    if (selectedPart) {
      onAddToCart(selectedPart, quantity);
    }
  };
  
  if (!selectedPart) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>{selectedPart.name}</DialogTitle>
          <DialogDescription>
            {selectedPart.category || 'Uncategorized'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="bg-gray-100 rounded-md h-48 w-full flex items-center justify-center">
              {selectedPart.images && selectedPart.images.length > 0 ? (
                <img 
                  src={selectedPart.images[0]} 
                  alt={selectedPart.name}
                  className="w-full h-full object-contain rounded-md"
                />
              ) : (
                <div className="text-gray-400">No image available</div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Price</h4>
              <p className="text-2xl font-bold">${selectedPart.price.toFixed(2)}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Availability</h4>
              <p className={`font-medium ${selectedPart.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {selectedPart.quantity > 0 ? `${selectedPart.quantity} in stock` : 'Out of stock'}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Description</h4>
              <p className="text-sm">{selectedPart.description || 'No description available'}</p>
            </div>
            
            {selectedPart.compatibility && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Compatible With</h4>
                <ul className="text-sm list-disc list-inside">
                  {Array.isArray(selectedPart.compatibility) ? 
                    selectedPart.compatibility.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    )) : 
                    <li>{selectedPart.compatibility}</li>
                  }
                </ul>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="quantity">Quantity</Label>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-r-none"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={selectedPart.quantity <= 0}
                  >
                    -
                  </Button>
                  <Input
                    id="quantity"
                    className="h-8 w-14 rounded-none text-center"
                    type="number"
                    min="1"
                    max={selectedPart.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(selectedPart.quantity, parseInt(e.target.value) || 1)))}
                    disabled={selectedPart.quantity <= 0}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-l-none"
                    onClick={() => setQuantity(Math.min(selectedPart.quantity, quantity + 1))}
                    disabled={selectedPart.quantity <= 0 || quantity >= selectedPart.quantity}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            className="w-full md:w-auto" 
            onClick={handleAddToCart}
            disabled={selectedPart.quantity <= 0}
          >
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
