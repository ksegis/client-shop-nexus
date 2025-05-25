
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus } from "lucide-react";
import { Part } from "@/types/parts";

interface QuantityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: Part | null;
  onConfirm: (quantity: number) => void;
  title: string;
  description: string;
}

export function QuantityDialog({
  open,
  onOpenChange,
  part,
  onConfirm,
  title,
  description
}: QuantityDialogProps) {
  const [quantity, setQuantity] = useState(1);
  
  const handleQuantityChange = (value: string) => {
    const num = parseInt(value) || 1;
    setQuantity(Math.max(1, num));
  };
  
  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };
  
  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };
  
  const handleConfirm = () => {
    onConfirm(quantity);
    setQuantity(1); // Reset for next time
    onOpenChange(false);
  };
  
  const handleCancel = () => {
    setQuantity(1); // Reset for next time
    onOpenChange(false);
  };
  
  if (!part) return null;
  
  const total = part.price * quantity;
  const coreChargeTotal = (part.core_charge || 0) * quantity;
  const grandTotal = total + coreChargeTotal;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">{part.name}</h4>
            <p className="text-sm text-muted-foreground">{part.description}</p>
            <div className="text-sm">
              <span className="font-medium">Price: ${part.price.toFixed(2)} each</span>
              {part.core_charge && part.core_charge > 0 && (
                <span className="text-muted-foreground ml-2">
                  (Core: ${part.core_charge.toFixed(2)})
                </span>
              )}
            </div>
            {part.quantity > 0 && (
              <div className="text-sm text-muted-foreground">
                Stock available: {part.quantity}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="text-center"
                min="1"
                max={part.quantity || undefined}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={incrementQuantity}
                disabled={part.quantity > 0 && quantity >= part.quantity}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-1 bg-muted p-3 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            {coreChargeTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span>Core charges:</span>
                <span>${coreChargeTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium pt-1 border-t">
              <span>Total:</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
