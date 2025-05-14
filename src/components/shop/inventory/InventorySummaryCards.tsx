
import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Box, AlertTriangle, Package, Tag, Truck } from 'lucide-react';
import { InventoryItem } from '@/pages/shop/inventory/types';

interface InventorySummaryCardsProps {
  inventory: InventoryItem[];
}

export const InventorySummaryCards = ({ inventory }: InventorySummaryCardsProps) => {
  const summaryData = useMemo(() => {
    // Calculate total items
    const totalItems = inventory.length;
    
    // Calculate total quantity
    const totalQuantity = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    // Calculate items with low stock
    const lowStockItems = inventory.filter(item => 
      (item.quantity || 0) <= (item.reorder_level || 10) && (item.quantity || 0) > 0
    ).length;
    
    // Calculate out of stock items
    const outOfStockItems = inventory.filter(item => (item.quantity || 0) <= 0).length;
    
    // Calculate total value (price * quantity)
    const totalValue = inventory.reduce((sum, item) => 
      sum + (item.price || 0) * (item.quantity || 0), 0
    );
    
    // Calculate average price
    const averagePrice = totalItems > 0 
      ? inventory.reduce((sum, item) => sum + (item.price || 0), 0) / totalItems
      : 0;
    
    return {
      totalItems,
      totalQuantity,
      lowStockItems,
      outOfStockItems,
      totalValue,
      averagePrice
    };
  }, [inventory]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <Box className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryData.totalItems}</div>
          <p className="text-xs text-muted-foreground">
            Unique inventory items
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryData.totalQuantity}</div>
          <p className="text-xs text-muted-foreground">
            Total units in inventory
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryData.lowStockItems}</div>
          <div className="flex items-center gap-1">
            <div className="text-xs text-muted-foreground">
              {summaryData.outOfStockItems} out of stock
            </div>
            {summaryData.outOfStockItems > 0 && (
              <span className="rounded-full bg-red-500 w-2 h-2"></span>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${summaryData.totalValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Avg. ${summaryData.averagePrice.toFixed(2)} per item
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
