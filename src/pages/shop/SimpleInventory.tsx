
import { useState } from 'react';
import { useRlsAwareInventoryData } from '@/hooks/useRlsAwareInventoryData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InventorySummaryCards } from '@/components/shop/inventory/InventorySummaryCards';
import { InventoryStatCards } from '@/pages/shop/inventory/components/InventoryStatCards';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

const SimpleInventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { 
    inventoryItems, 
    isLoading, 
    error, 
    refetch,
    isAuthenticated
  } = useRlsAwareInventoryData();

  const filteredItems = searchTerm
    ? inventoryItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : inventoryItems;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parts Inventory</h1>
          <p className="text-muted-foreground">
            Manage and view your parts inventory
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* New Summary Cards */}
      <InventorySummaryCards items={filteredItems} />

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            Search and filter your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-lg">Loading inventory data...</span>
            </div>
          ) : error ? (
            <div className="flex items-center border border-red-200 bg-red-50 p-4 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <p className="font-medium text-red-800">Error loading inventory</p>
                <p className="text-sm text-red-700">
                  {error instanceof Error ? error.message : 'Unknown error occurred'}
                </p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No inventory items found</p>
              {searchTerm && (
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search term
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="py-2 px-4 text-left">Name</th>
                    <th className="py-2 px-4 text-left">SKU</th>
                    <th className="py-2 px-4 text-left">Category</th>
                    <th className="py-2 px-4 text-right">Quantity</th>
                    <th className="py-2 px-4 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4">{item.name}</td>
                      <td className="py-2 px-4">{item.sku || '-'}</td>
                      <td className="py-2 px-4">{item.category || '-'}</td>
                      <td className={`py-2 px-4 text-right ${
                        item.quantity <= 0 
                          ? 'text-red-600' 
                          : item.quantity <= (item.reorder_level || 10)
                            ? 'text-yellow-600'
                            : ''
                      }`}>
                        {item.quantity}
                      </td>
                      <td className="py-2 px-4 text-right">${item.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleInventory;
