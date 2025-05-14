
import { Button } from "@/components/ui/button";
import { 
  Package2, 
  Search, 
  ShoppingCart,
  FileText,
  ClipboardList,
  ArrowLeftRight,
  FileBarChart,
  LayoutGrid,
  LayoutList
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
  setCoreReturnOpen: (open: boolean) => void; // This now expects a boolean parameter
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
  viewMode = 'grid',
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
          {onViewModeChange && (
            <div className="border rounded-md mr-2">
              <ToggleGroup type="single" value={viewMode} onValueChange={(value: 'grid' | 'table') => onViewModeChange(value)}>
                <ToggleGroupItem value="grid" aria-label="Grid view">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="sr-only">Grid</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="table" aria-label="Table view">
                  <LayoutList className="h-4 w-4" />
                  <span className="sr-only">Table</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setSpecialOrderOpen(true)}>
                  <ClipboardList className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Special Order</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setQuotationOpen(true)}>
                  <FileBarChart className="h-4 w-4" />
                  {quotationCount > 0 && (
                    <Badge variant="secondary" className="absolute -top-2 -right-2 px-1 min-w-[1.1rem] h-[1.1rem] flex items-center justify-center text-xs">
                      {quotationCount}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create Quotation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setCoreReturnOpen(true)}>
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Process Core Return</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setSearchOpen(true)}>
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Search by Part #</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button variant="outline" size="icon" onClick={() => setCartOpen(true)} className="relative">
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 px-1 min-w-[1.1rem] h-[1.1rem] flex items-center justify-center text-xs">
                {cartCount}
              </Badge>
            )}
          </Button>
          
          {process.env.NODE_ENV !== 'production' && (
            <>
              <Button variant="outline" size="icon" onClick={onCheckInventory}>
                <FileText className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={onAddSamplePart}>
                <Package2 className="h-4 w-4" />
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
