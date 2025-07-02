
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Part } from "@/types/parts";
import { getStockBadge } from "./partDetailUtils";

interface PartDetailBodyProps {
  part: Part | null;
  isLoading: boolean;
  quantity: number;
  setQuantity: (quantity: number) => void;
  hideSupplier?: boolean;
}

export function PartDetailBody({ 
  part, 
  isLoading, 
  quantity, 
  setQuantity,
  hideSupplier = false
}: PartDetailBodyProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 py-4">
        <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  if (!part) {
    return (
      <div className="flex justify-end">
        <Button>Close</Button>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
      <div className="space-y-4">
        <AspectRatio ratio={1/1} className="bg-muted rounded-md overflow-hidden">
          <img 
            src={part.images && part.images.length > 0 ? part.images[0] : '/placeholder.svg'} 
            alt={part.name} 
            className="object-cover w-full h-full"
          />
        </AspectRatio>
        
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold">
            ${part.price.toFixed(2)}
          </div>
          {getStockBadge(part)}
        </div>
        
        {part.core_charge && part.core_charge > 0 && (
          <div className="flex items-center justify-between">
            <div>Core Charge:</div>
            <Badge variant="outline" className="border-blue-500 text-blue-500">
              ${part.core_charge.toFixed(2)}
            </Badge>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-1">Description</h3>
          <p className="text-sm text-muted-foreground">
            {part.description || "No description available"}
          </p>
        </div>
        
        {!hideSupplier && part.supplier && (
          <div>
            <h3 className="font-medium mb-1">Supplier</h3>
            <p className="text-sm">{part.supplier}</p>
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
                disabled={part.quantity <= 0}
              >
                -
              </Button>
              <Input
                id="quantity"
                className="h-8 w-14 rounded-none text-center"
                type="number"
                min="1"
                max={part.quantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(part.quantity, parseInt(e.target.value) || 1)))}
                disabled={part.quantity <= 0}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-l-none"
                onClick={() => setQuantity(Math.min(part.quantity, quantity + 1))}
                disabled={part.quantity <= 0 || quantity >= part.quantity}
              >
                +
              </Button>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground space-y-0.5">
          {part.reorder_level !== undefined && (
            <div className="flex justify-between">
              <span>Reorder Level:</span>
              <span>{part.reorder_level}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Location:</span>
            <span>{part.location || 'Not specified'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
