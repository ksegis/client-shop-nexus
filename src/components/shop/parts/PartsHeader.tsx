
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, BarChart, Plus } from "lucide-react";
import { PartNumberSearch } from "./PartNumberSearch";
import { InventoryItem } from '@/pages/shop/inventory/types';

interface PartsHeaderProps {
  getCartItemCount: () => number;
  setCartOpen: (open: boolean) => void;
  onCheckInventory: () => Promise<void>;
  onAddSamplePart: () => Promise<void>;
  onSelectPart?: (part: InventoryItem) => void;
}

export const PartsHeader = ({
  getCartItemCount,
  setCartOpen,
  onCheckInventory,
  onAddSamplePart,
  onSelectPart
}: PartsHeaderProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parts Desk</h1>
          <p className="text-muted-foreground">
            Browse, search and order parts for your shop
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {getCartItemCount() > 0 ? (
            <Button 
              variant="outline" 
              className="relative"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Cart
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getCartItemCount()}
              </span>
            </Button>
          ) : null}
          
          <Button 
            variant="default" 
            onClick={onAddSamplePart}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Sample Part
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={onCheckInventory}
          >
            <BarChart className="h-5 w-5 mr-2" />
            Check Inventory
          </Button>
        </div>
      </div>
      
      {/* Quick part number search */}
      {onSelectPart && (
        <div className="w-full md:max-w-md">
          <PartNumberSearch onSelectPart={onSelectPart} />
        </div>
      )}
    </div>
  );
};
