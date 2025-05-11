
import { useState } from 'react';
import { ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { InventoryItem } from './types';
import { useInventoryContext } from './InventoryContext';

interface InventoryTableProps {
  onEdit: (item: InventoryItem) => void;
}

export const InventoryTable = ({ onEdit }: InventoryTableProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { 
    inventoryItems,
    isLoading,
    sortField,
    sortDirection,
    handleSort
  } = useInventoryContext();
  
  // Delete inventory item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Item deleted",
        description: "Inventory item has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading inventory data...</div>;
  }

  if (inventoryItems.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6">
                No inventory items found
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px] cursor-pointer" onClick={() => handleSort('name')}>
              <div className="flex items-center">
                Name
                {sortField === 'name' && (
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('quantity')}>
              <div className="flex items-center">
                Quantity
                {sortField === 'quantity' && (
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('price')}>
              <div className="flex items-center">
                Price
                {sortField === 'price' && (
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                )}
              </div>
            </TableHead>
            <TableHead>Stock Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventoryItems.map((item) => {
            // Calculate stock status
            const reorderLevel = item.reorder_level || 10;
            const stockStatus = 
              item.quantity === 0 ? 'out-of-stock' :
              item.quantity <= reorderLevel ? 'low-stock' : 'in-stock';

            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.name}</div>
                  {item.sku && (
                    <div className="text-xs text-muted-foreground">
                      SKU: {item.sku}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {item.category ? (
                    <Badge variant="outline">{item.category}</Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>${item.price.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-24">
                      <Progress
                        value={Math.min((item.quantity / (reorderLevel * 2)) * 100, 100)}
                        className={
                          stockStatus === 'out-of-stock' ? 'bg-red-200' :
                          stockStatus === 'low-stock' ? 'bg-amber-200' : ''
                        }
                      />
                    </div>
                    <Badge
                      variant={
                        stockStatus === 'out-of-stock' ? 'destructive' :
                        stockStatus === 'low-stock' ? 'outline' : 'default'
                      }
                    >
                      {stockStatus === 'out-of-stock' ? 'Out of Stock' :
                       stockStatus === 'low-stock' ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-60">
                        <div className="space-y-4">
                          <div className="font-medium">Delete Item</div>
                          <div className="text-sm text-muted-foreground">
                            Are you sure you want to delete this item? This action cannot be undone.
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm">Cancel</Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => deleteItemMutation.mutate(item.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
