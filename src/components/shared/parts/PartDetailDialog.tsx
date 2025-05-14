
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { Part } from '@/types/parts';
import { useToast } from '@/hooks/use-toast';
import { CircleMinus, CirclePlus, Loader2 } from 'lucide-react';

interface PartDetailDialogProps {
  partId: string | null;
  onClose: () => void;
  onAddToCart?: (part: Part, quantity: number) => void;
}

export const PartDetailDialog = ({ partId, onClose, onAddToCart }: PartDetailDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [part, setPart] = useState<Part | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsOpen(!!partId);
    if (partId) {
      fetchPartDetail(partId);
    } else {
      setPart(null);
      setQuantity(1);
    }
  }, [partId]);

  const fetchPartDetail = async (id: string) => {
    setIsLoading(true);
    try {
      console.log('Fetching part detail for ID:', id);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        console.log('Part detail fetched:', data);
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
          // location property removed since it doesn't exist in the schema
          is_special_order: false, // Default value since it's not in the current schema
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        setPart(partData);
      }
    } catch (err) {
      console.error('Error fetching part detail:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch part details",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    if (quantity <= reorderLevel) return "secondary"; 
    return "default";
  };
  
  const getStockStatusText = (quantity: number, reorderLevel: number = 10) => {
    if (quantity <= 0) return "Out of Stock";
    if (quantity <= reorderLevel) return "Low Stock";
    return "In Stock";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading part details...</p>
          </div>
        ) : part ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{part.name}</DialogTitle>
              <DialogDescription className="flex flex-wrap gap-2 items-center">
                {part.sku && (
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    SKU: {part.sku}
                  </span>
                )}
                <Badge variant={getStockStatusColor(part.quantity, part.reorder_level)}>
                  {getStockStatusText(part.quantity, part.reorder_level)}
                </Badge>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Part Details */}
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Price</TableCell>
                    <TableCell className="text-right">${part.price.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Category</TableCell>
                    <TableCell className="text-right">{part.category}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Supplier</TableCell>
                    <TableCell className="text-right">{part.supplier || "N/A"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Stock Quantity</TableCell>
                    <TableCell className="text-right">{part.quantity}</TableCell>
                  </TableRow>
                  {part.core_charge && (
                    <TableRow>
                      <TableCell className="font-medium">Core Charge</TableCell>
                      <TableCell className="text-right">${part.core_charge.toFixed(2)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Description */}
              {part.description && (
                <div className="space-y-2">
                  <h4 className="font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground">{part.description}</p>
                </div>
              )}

              {/* Add to Cart Controls */}
              {onAddToCart && part.quantity > 0 && (
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Quantity</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <CircleMinus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.min(part.quantity, quantity + 1))}
                        disabled={quantity >= part.quantity}
                      >
                        <CirclePlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {part.quantity} available in stock
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="font-medium">Total: ${(part.price * quantity).toFixed(2)}</span>
                    <Button onClick={handleAddToCart}>Add to Cart</Button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            Failed to load part information
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
