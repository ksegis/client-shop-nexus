
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { Part } from '@/types/parts';
import { Progress } from '@/components/ui/progress';

interface PartsInventorySummaryProps {
  parts: Part[];
}

export const PartsInventorySummary = ({ parts }: PartsInventorySummaryProps) => {
  const stats = useMemo(() => {
    const totalParts = parts.length;
    const totalValue = parts.reduce((sum, part) => sum + part.price * part.quantity, 0);
    const lowStockCount = parts.filter(part => part.quantity > 0 && part.quantity <= (part.reorder_level || 5)).length;
    const outOfStockCount = parts.filter(part => part.quantity <= 0).length;
    
    // Calculate top categories
    const categories = parts.reduce((acc: Record<string, number>, part) => {
      const category = part.category || 'Uncategorized';
      if (!acc[category]) acc[category] = 0;
      acc[category] += 1;
      return acc;
    }, {});
    
    const topCategories = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    return {
      totalParts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      stockIssueRate: totalParts ? ((lowStockCount + outOfStockCount) / totalParts) * 100 : 0,
      topCategories
    };
  }, [parts]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Parts</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalParts}</div>
          <p className="text-xs text-muted-foreground">
            Items in parts catalog
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Total value of parts in stock
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock Issues</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold flex items-center gap-2">
            {stats.outOfStockCount + stats.lowStockCount}
            <span className="text-sm font-normal text-muted-foreground">items</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Out of stock: {stats.outOfStockCount}</span>
              <span className="text-muted-foreground">Low stock: {stats.lowStockCount}</span>
            </div>
            <Progress value={stats.stockIssueRate} className="h-1" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Categories</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.topCategories.map((category, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-xs truncate max-w-[70%]">{category.name}</span>
                <span className="text-xs font-medium">{category.count} parts</span>
              </div>
            ))}
            {stats.topCategories.length === 0 && (
              <div className="text-sm text-muted-foreground">No categories found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
