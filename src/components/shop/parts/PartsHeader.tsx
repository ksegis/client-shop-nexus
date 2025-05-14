
import { Button } from '@/components/ui/button';
import { ShoppingCart, Database, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePartsCart } from '@/contexts/parts/PartsCartContext';

interface PartsHeaderProps {
  getCartItemCount: () => number;
  setCartOpen: (open: boolean) => void;
  onCheckInventory: () => void;
  onAddSamplePart: () => void;
}

export const PartsHeader = ({
  getCartItemCount,
  setCartOpen,
  onCheckInventory,
  onAddSamplePart
}: PartsHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Parts Desk</h1>
        <p className="text-muted-foreground">
          Manage inventory and process customer parts orders
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline"
          onClick={onCheckInventory}
          className="sm:self-end"
        >
          <Database className="mr-2 h-4 w-4" />
          Check Inventory
        </Button>

        <Button 
          variant="outline"
          onClick={onAddSamplePart}
          className="sm:self-end"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Sample Part
        </Button>

        <Button 
          onClick={() => setCartOpen(true)} 
          variant={getCartItemCount() > 0 ? "default" : "outline"}
          className="sm:self-end"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Sale Cart
          {getCartItemCount() > 0 && (
            <Badge variant="secondary" className="ml-2">
              {getCartItemCount()}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
};
