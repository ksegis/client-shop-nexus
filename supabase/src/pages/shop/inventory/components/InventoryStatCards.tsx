
import { useMemo } from 'react';
import { InventoryItem } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Box, ListChecks, Store, ShoppingCart } from 'lucide-react';

interface InventoryStatCardsProps {
  items: InventoryItem[];
}

export const InventoryStatCards = ({ items }: InventoryStatCardsProps) => {
  // Calculate statistics from inventory items
  const stats = useMemo(() => {
    console.log('InventoryStatCards - Calculating stats for items:', items?.length || 0);
    console.log('Items data sample:', items && items.length > 0 ? items[0] : 'No items');
    
    // Default values in case items is undefined or empty
    if (!items || items.length === 0) {
      console.log('No items provided to InventoryStatCards - using default values');
      return {
        totalItems: 0,
        lowStockItems: 0,
        uniqueCategories: 0,
        uniqueSuppliers: 0
      };
    }
    
    // Count items by category
    const categoriesMap = new Map<string, number>();
    // Count items by supplier/vendor
    const suppliersMap = new Map<string, number>();
    // Count total and low stock items
    let totalItems = 0;
    let lowStockItems = 0;
    
    items.forEach(item => {
      totalItems += 1;
      
      // Check if item is low on stock
      const reorderLevel = item.reorder_level || 10;
      if (item.quantity <= reorderLevel) {
        lowStockItems += 1;
      }
      
      // Count by category
      const category = item.category || 'Uncategorized';
      categoriesMap.set(category, (categoriesMap.get(category) || 0) + 1);
      
      // Count by supplier
      const supplier = item.supplier || 'Unspecified';
      suppliersMap.set(supplier, (suppliersMap.get(supplier) || 0) + 1);
    });
    
    const result = {
      totalItems,
      lowStockItems,
      uniqueCategories: categoriesMap.size,
      uniqueSuppliers: suppliersMap.size
    };
    
    console.log('Calculated stats result:', result);
    
    return result;
  }, [items]);

  console.log('InventoryStatCards - Rendering with stats:', stats);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalItems}</div>
          <p className="text-xs text-muted-foreground">Items in inventory</p>
        </CardContent>
      </Card>
      
      <Card className={stats.lowStockItems > 0 ? "border-yellow-300" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          <Box className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.lowStockItems > 0 ? "text-yellow-600" : ""}`}>
            {stats.lowStockItems}
          </div>
          <p className="text-xs text-muted-foreground">Items below reorder level</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Categories</CardTitle>
          <ListChecks className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.uniqueCategories}</div>
          <p className="text-xs text-muted-foreground">Distinct categories</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
          <Store className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.uniqueSuppliers}</div>
          <p className="text-xs text-muted-foreground">Unique vendors</p>
        </CardContent>
      </Card>
    </div>
  );
};
