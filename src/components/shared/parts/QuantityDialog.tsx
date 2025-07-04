
import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
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
  
  // Reset quantity when dialog opens/closes or part changes
  useEffect(() => {
    if (open && part) {
      setQuantity(1);
    }
  }, [open, part]);
  
  const handleQuantityChange = (value: string) => {
    // Allow empty string for user to clear and retype
    if (value === '') {
      setQuantity(1);
      return;
    }
    
    const num = parseInt(value) || 1;
    if (num < 1) {
      setQuantity(1);
      return;
    }
    
    setQuantity(num);
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
  
  // Calculate totals - ensure we have valid numbers
  const partPrice = typeof part.price === 'number' ? part.price : 0;
  const partCoreCharge = typeof part.core_charge === 'number' ? part.core_charge : 0;
  
  const total = partPrice * quantity;
  const coreChargeTotal = partCoreCharge * quantity;
  const grandTotal = total + coreChargeTotal;
  
  // Calculate backlog quantity
  const availableStock = part.quantity || 0;
  const backlogQuantity = quantity > availableStock ? quantity - availableStock : 0;
  const isBackorder = backlogQuantity > 0;
  
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
              <span className="font-medium">Price: ${partPrice.toFixed(2)} each</span>
              {partCoreCharge > 0 && (
                <span className="text-muted-foreground ml-2">
                  (Core: ${partCoreCharge.toFixed(2)})
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Stock available: {availableStock}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="text-center"
              placeholder="Enter quantity"
            />
          </div>
          
          {isBackorder && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>{backlogQuantity} item(s)</strong> will be backordered as they exceed available stock.
              </AlertDescription>
            </Alert>
          )}
          
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
            {isBackorder && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Backorder qty:</span>
                <span>{backlogQuantity}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            {isBackorder ? "Confirm with Backorder" : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
