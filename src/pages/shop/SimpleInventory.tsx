
import { useState } from 'react';
import { useInventoryData } from '@/hooks/useInventoryData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw } from 'lucide-react';
import { InventoryStatCards } from './inventory/components/InventoryStatCards';

const SimpleInventory = () => {
  const { inventoryItems, isLoading, refetch } = useInventoryData();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter items based on search term
  const filteredItems = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Debug log to check if inventory items are loaded
  console.log('SimpleInventory component - Inventory items loaded:', inventoryItems.length, inventoryItems);
  
  // Force a re-render when data changes
  console.log('Rendering SimpleInventory with data:', 
    { 
      itemCount: inventoryItems.length,
      hasData: inventoryItems.length > 0,
      firstItemQuantity: inventoryItems[0]?.quantity
    }
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parts Inventory</h1>
          <p className="text-muted-foreground">
            View available inventory items
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Always show the stats cards, even when loading or empty */}
      <InventoryStatCards items={inventoryItems} />

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory items... (type here to search)"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="text-xs text-muted-foreground mt-1">
              Search updates as you type. You can search by name, SKU, or description.
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-6">Loading inventory data...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-6">
              {inventoryItems.length === 0 ? 
                "No inventory items found in database. The table might be empty." : 
                "No items match your search criteria"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {item.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{item.category || "—"}</TableCell>
                      <TableCell>{item.sku || "—"}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleInventory;
