
import { Part } from '@/types/parts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface InventoryStatsCardsProps {
  parts: Part[];
}

export const InventoryStatsCards = ({ parts }: InventoryStatsCardsProps) => {
  // Calculate low stock items for dashboard
  const lowStockCount = parts.filter(part => 
    part.quantity > 0 && part.quantity <= (part.reorder_level || 10)
  ).length;
  
  // Calculate out of stock items for dashboard
  const outOfStockCount = parts.filter(part => part.quantity <= 0).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Parts</CardTitle>
          <CardDescription>Currently in inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{parts.length}</p>
        </CardContent>
      </Card>
      
      <Card className={lowStockCount > 0 ? "border-yellow-300" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Low Stock</CardTitle>
          <CardDescription>Items that need reordering</CardDescription>
        </CardHeader>
        <CardContent>
          <p className={`text-3xl font-bold ${lowStockCount > 0 ? "text-yellow-600" : ""}`}>
            {lowStockCount}
          </p>
        </CardContent>
      </Card>
      
      <Card className={outOfStockCount > 0 ? "border-red-300" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Out of Stock</CardTitle>
          <CardDescription>Items with zero inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <p className={`text-3xl font-bold ${outOfStockCount > 0 ? "text-red-600" : ""}`}>
            {outOfStockCount}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
