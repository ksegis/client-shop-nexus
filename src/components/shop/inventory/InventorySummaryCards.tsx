
import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Box, AlertTriangle, Package, Tag, TruckLoading } from 'lucide-react';
import { InventoryItem } from '@/pages/shop/inventory/types';

interface InventorySummaryCardsProps {
  items: InventoryItem[];
}

export const InventorySummaryCards = ({ items }: InventorySummaryCardsProps) => {
  // Calculate summary metrics from inventory data
  const summaryData = useMemo(() => {
    // Handle edge case when no items exist
    if (!items || items.length === 0) {
      return {
        totalItems: 0,
        totalQuantity: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalValue: 0
      };
    }

    // Calculate inventory metrics
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const lowStockCount = items.filter(item => 
      item.quantity > 0 && item.quantity <= (item.reorder_level || 10)
    ).length;
    const outOfStockCount = items.filter(item => item.quantity <= 0).length;
    const totalValue = items.reduce((sum, item) => 
      sum + (item.quantity || 0) * (item.price || 0), 0
    );

    return {
      totalItems,
      totalQuantity,
      lowStockCount,
      outOfStockCount,
      totalValue
    };
  }, [items]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryData.totalItems}</div>
          <p className="text-xs text-muted-foreground">Unique products in inventory</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryData.totalQuantity}</div>
          <p className="text-xs text-muted-foreground">Total units in stock</p>
        </CardContent>
      </Card>
      
      <Card className={summaryData.lowStockCount > 0 ? "border-yellow-300" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${summaryData.lowStockCount > 0 ? "text-yellow-500" : "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${summaryData.lowStockCount > 0 ? "text-yellow-600" : ""}`}>
            {summaryData.lowStockCount}
          </div>
          <p className="text-xs text-muted-foreground">Below reorder level</p>
        </CardContent>
      </Card>
      
      <Card className={summaryData.outOfStockCount > 0 ? "border-red-300" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          <Box className={`h-4 w-4 ${summaryData.outOfStockCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${summaryData.outOfStockCount > 0 ? "text-red-600" : ""}`}>
            {summaryData.outOfStockCount}
          </div>
          <p className="text-xs text-muted-foreground">Need immediate reorder</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <TruckLoading className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${summaryData.totalValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Inventory valuation</p>
        </CardContent>
      </Card>
    </div>
  );
};
