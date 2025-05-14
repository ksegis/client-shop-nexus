
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package, Truck } from 'lucide-react';
import { Part } from '@/types/parts';
import { supabase } from '@/integrations/supabase/client';

interface PartDetailDialogProps {
  partId: string | null;
  onClose: () => void;
  onAddToCart?: (part: Part, quantity: number) => void;
}

export const PartDetailDialog = ({
  partId,
  onClose,
  onAddToCart
}: PartDetailDialogProps) => {
  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    setIsOpen(Boolean(partId));
    
    if (partId) {
      setLoading(true);
      
      const fetchPart = async () => {
        try {
          const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('id', partId)
            .single();
            
          if (error) throw error;
          
          // Map the inventory item to the Part interface
          setPart({
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
            location: data.location || '',
            is_special_order: false, // Default value since it's not in the current schema
            created_at: data.created_at,
            updated_at: data.updated_at,
          });
        } catch (err) {
          console.error('Error fetching part details:', err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchPart();
      setQuantity(1);
    }
  }, [partId]);
  
  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };
  
  const handleAddToCart = () => {
    if (part && onAddToCart) {
      onAddToCart(part, quantity);
      handleClose();
    }
  };
  
  const getStockStatusColor = (quantity: number, reorderLevel: number = 10) => {
    if (quantity <= 0) return "destructive";
    if (quantity <= reorderLevel) return "warning";
    return "success";
  };
  
  const getStockStatusText = (quantity: number, reorderLevel: number = 10) => {
    if (quantity <= 0) return "Out of Stock";
    if (quantity <= reorderLevel) return "Low Stock";
    return "In Stock";
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : part ? (
          <>
            <DialogHeader>
              <DialogTitle>{part.name}</DialogTitle>
              <DialogDescription>SKU: {part.sku}</DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-semibold">${part.price.toFixed(2)}</p>
                  {part.core_charge && (
                    <p className="text-xs text-muted-foreground">
                      + ${part.core_charge.toFixed(2)} core charge
                    </p>
                  )}
                </div>
                
                <Badge variant={getStockStatusColor(part.quantity, part.reorder_level)}>
                  {getStockStatusText(part.quantity, part.reorder_level)}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {part.description || "No description available."}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {part.category && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Category</h4>
                    <p className="text-sm text-muted-foreground">{part.category}</p>
                  </div>
                )}
                
                {part.supplier && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Manufacturer</h4>
                    <p className="text-sm text-muted-foreground">{part.supplier}</p>
                  </div>
                )}
              </div>
              
              {part.compatibility && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Compatibility</h4>
                  <div className="flex flex-wrap gap-1">
                    {part.compatibility.map((vehicle, index) => (
                      <Badge key={index} variant="outline">{vehicle}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {part.quantity > 0 && onAddToCart && (
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Quantity:</span>
                    <Input
                      type="number"
                      min="1"
                      max={part.quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-16"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {part.quantity} available
                  </p>
                </div>
              )}
              
              {part.is_special_order && (
                <div className="rounded-md bg-blue-50 p-3 flex items-start">
                  <Truck className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">Special Order Item</h4>
                    <p className="text-xs text-blue-700">
                      This part is not regularly stocked. Special orders may require additional time for delivery.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                <Package className="mr-2 h-4 w-4" />
                Close
              </Button>
              
              {part.quantity > 0 && onAddToCart && (
                <Button onClick={handleAddToCart}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              )}
            </DialogFooter>
          </>
        ) : (
          <div className="py-6 text-center">
            <p>Part not found or could not be loaded.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
