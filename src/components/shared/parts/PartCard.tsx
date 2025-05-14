
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Part } from '@/types/parts';
import { Package, ShoppingCart } from 'lucide-react';

interface PartCardProps {
  part: Part;
  onAddToCart?: (part: Part) => void;
  onViewDetails: (partId: string) => void;
  showInventory?: boolean;
}

export const PartCard = ({ 
  part, 
  onAddToCart, 
  onViewDetails,
  showInventory = false 
}: PartCardProps) => {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(part);
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
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onViewDetails(part.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg leading-tight">{part.name}</CardTitle>
          {part.is_special_order && (
            <Badge variant="outline" className="ml-2">Special Order</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">SKU: {part.sku}</p>
      </CardHeader>
      
      <CardContent className="pb-2">
        {part.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {part.description}
          </p>
        )}
        
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xl font-semibold">${part.price.toFixed(2)}</p>
            {part.core_charge && (
              <p className="text-xs text-muted-foreground">
                + ${part.core_charge.toFixed(2)} core charge
              </p>
            )}
          </div>
          
          {showInventory && (
            <Badge variant={getStockStatusColor(part.quantity, part.reorder_level)}>
              {getStockStatusText(part.quantity, part.reorder_level)}
            </Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="w-full flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onViewDetails(part.id)}
          >
            <Package className="h-4 w-4 mr-1" /> Details
          </Button>
          
          {onAddToCart && (
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={handleAddToCart}
              disabled={part.quantity <= 0}
            >
              <ShoppingCart className="h-4 w-4 mr-1" /> Add to Cart
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
