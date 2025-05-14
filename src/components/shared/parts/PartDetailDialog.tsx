
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, FileBarChart, ArrowLeftRight } from "lucide-react";
import { Part } from "@/types/parts";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PartDetailDialogProps {
  partId: string | null;
  onClose: () => void;
  onAddToCart?: (part: Part, quantity: number) => void;
  onAddToQuotation?: (part: Part, quantity: number) => void;
}

export function PartDetailDialog({ 
  partId, 
  onClose, 
  onAddToCart,
  onAddToQuotation
}: PartDetailDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  
  // Reset the quantity when dialog opens/closes
  useEffect(() => {
    if (partId) {
      setIsOpen(true);
      setQuantity(1);
    } else {
      setIsOpen(false);
    }
  }, [partId]);
  
  // Custom close handler
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Delay to allow animation
  };
  
  // Fetch the part details if we have a partId
  const { data: part, isLoading } = useQuery({
    queryKey: ['part-detail', partId],
    queryFn: async () => {
      // Return early if no partId
      if (!partId) return null;
      
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', partId)
        .single();
      
      if (error) throw error;
      
      // Convert to Part type
      const partData: Part = {
        id: data.id,
        sku: data.sku || '',
        name: data.name,
        description: data.description || '',
        category: data.category || 'Uncategorized',
        price: data.price || 0,
        cost: data.cost || 0,
        quantity: data.quantity || 0,
        reorder_level: data.reorder_level || 10,
        supplier: data.supplier || '',
        core_charge: data.core_charge || 0,
        location: data.location || '',
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      
      return partData;
    },
    enabled: !!partId,
  });
  
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
  
  // Determine stock status
  const getStockStatus = (part: Part) => {
    if (part.quantity <= 0) return 'out-of-stock';
    if (part.quantity <= (part.reorder_level || 5)) return 'low-stock';
    return 'in-stock';
  };
  
  // Get stock badge based on status
  const getStockBadge = (part: Part) => {
    const status = getStockStatus(part);
    
    switch (status) {
      case 'out-of-stock':
        return <Badge variant="destructive">Out of stock</Badge>;
      case 'low-stock':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Low stock: {part.quantity}</Badge>;
      default:
        return <Badge variant="outline" className="border-green-500 text-green-500">In stock: {part.quantity}</Badge>;
    }
  };
  
  // Return nothing if not open
  if (!isOpen) return null;
  
  // Loading state
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Loading part details...</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Part not found
  if (!part) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Part not found</DialogTitle>
            <DialogDescription>
              The requested part could not be found in inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={handleClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{part.name}</DialogTitle>
          <DialogDescription>
            {part.sku && `SKU: ${part.sku}`}
            {part.category && ` • ${part.category}`}
          </DialogDescription>
        </DialogHeader>
        
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
            
            {part.supplier && (
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
      </DialogContent>
    </Dialog>
  );
}
