
import { Button } from "@/components/ui/button";
import { 
  Package2, 
  Search, 
  ShoppingCart,
  FileText,
  ClipboardList,
  ArrowLeftRight,
  FileBarChart,
} from "lucide-react";
import { useState } from "react";
import { PartNumberSearch } from "./PartNumberSearch";
import { SpecialOrderDialog } from "@/components/shared/parts/SpecialOrderDialog";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PartQuotationDialog } from "@/components/shared/parts/PartQuotationDialog";
import { CoreChargeHandler } from "@/components/shared/parts/CoreChargeHandler";
import { Part } from "@/types/parts";

interface PartsHeaderProps {
  getCartItemCount: () => number;
  getQuotationItemCount: () => number;
  setCartOpen: (open: boolean) => void;
  quotationItems: any[];
  onRemoveQuotationItem: (partId: string) => void;
  setQuotationOpen: (open: boolean) => void;
  onCheckInventory: () => Promise<void>;
  onAddSamplePart: () => Promise<void>;
  onSelectPart?: (item: any) => void;
  selectedPartForCoreReturn: Part | null;
  isCoreReturnOpen: boolean;
  setCoreReturnOpen: (open: boolean) => void;
  onProcessCoreReturn?: (refundAmount: number, condition: string) => void;
  viewMode?: 'grid' | 'table';
  onViewModeChange?: (mode: 'grid' | 'table') => void;
}

export function PartsHeader({
  getCartItemCount,
  getQuotationItemCount,
  setCartOpen,
  quotationItems,
  onRemoveQuotationItem,
  setQuotationOpen,
  onCheckInventory,
  onAddSamplePart,
  onSelectPart,
  selectedPartForCoreReturn,
  isCoreReturnOpen,
  setCoreReturnOpen,
  onProcessCoreReturn,
  viewMode,
  onViewModeChange
}: PartsHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [specialOrderOpen, setSpecialOrderOpen] = useState(false);
  
  const cartCount = getCartItemCount();
  const quotationCount = getQuotationItemCount();
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parts Desk</h1>
          <p className="text-muted-foreground">
            Search, order, and manage parts inventory
          </p>
        </div>
        
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <Button 
            variant="outline" 
            className="text-xs"
            onClick={() => setSpecialOrderOpen(true)}
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Special Order
          </Button>
          
          <Button 
            variant="outline" 
            className="text-xs relative"
            onClick={() => setQuotationOpen(true)}
          >
            <FileBarChart className="h-4 w-4 mr-2" />
            Quotation
            {quotationCount > 0 && (
              <Badge variant="secondary" className="absolute -top-2 -right-2 px-1 min-w-[1.1rem] h-[1.1rem] flex items-center justify-center text-xs">
                {quotationCount}
              </Badge>
            )}
          </Button>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => setCoreReturnOpen(true)}
                >
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Core Return
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Process core returns for parts with core charges
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            variant="outline" 
            className="text-xs"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          
          <Button 
            variant="outline" 
            className="text-xs relative"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart
            {cartCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 px-1 min-w-[1.1rem] h-[1.1rem] flex items-center justify-center text-xs">
                {cartCount}
              </Badge>
            )}
          </Button>
          
          {process.env.NODE_ENV !== 'production' && (
            <>
              <Button 
                variant="outline" 
                className="text-xs"
                onClick={onCheckInventory}
              >
                <FileText className="h-4 w-4 mr-2" />
                Check
              </Button>
              <Button 
                variant="outline" 
                className="text-xs"
                onClick={onAddSamplePart}
              >
                <Package2 className="h-4 w-4 mr-2" />
                Add Sample
              </Button>
            </>
          )}
        </div>
      </div>
      
      <PartNumberSearch 
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectPart={onSelectPart}
      />
      
      <SpecialOrderDialog
        open={specialOrderOpen}
        onOpenChange={setSpecialOrderOpen}
      />
      
      <PartQuotationDialog
        open={quotationItems.length > 0 && setQuotationOpen !== undefined}
        onOpenChange={setQuotationOpen}
        items={quotationItems}
        onRemoveItem={onRemoveQuotationItem}
      />
      
      <CoreChargeHandler
        part={selectedPartForCoreReturn}
        open={isCoreReturnOpen}
        onOpenChange={setCoreReturnOpen}
        onProcessReturn={onProcessCoreReturn}
      />
    </div>
  );
}
