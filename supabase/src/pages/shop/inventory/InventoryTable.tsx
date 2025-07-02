import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { InventoryItem } from './types';
import { useInventoryContext } from './InventoryContext';
import { StockStatusBadge } from './components/StockStatusBadge';
import { StockStatusProgress } from './components/StockStatusProgress';
import { TableActions } from './components/TableActions';
import { EmptyTableRow } from './components/EmptyTableRow';
import { SortableTableHeader } from './components/SortableTableHeader';
import { CoreIndicatorBadge } from './components/CoreIndicatorBadge';

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
              <TableHead>Core</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <EmptyTableRow colSpan={7} message="No inventory items found" />
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
            <SortableTableHeader 
              field="name" 
              label="Name" 
              currentSortField={sortField} 
              onSort={handleSort} 
            />
            <TableHead>Category</TableHead>
            <SortableTableHeader 
              field="quantity" 
              label="Quantity" 
              currentSortField={sortField} 
              onSort={handleSort} 
            />
            <SortableTableHeader 
              field="price" 
              label="Price" 
              currentSortField={sortField} 
              onSort={handleSort} 
            />
            <TableHead>Stock Status</TableHead>
            <TableHead>Core</TableHead>
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
                      <StockStatusProgress 
                        quantity={item.quantity} 
                        reorderLevel={reorderLevel}
                        status={stockStatus}
                      />
                    </div>
                    <StockStatusBadge status={stockStatus} />
                  </div>
                </TableCell>
                <TableCell>
                  <CoreIndicatorBadge coreCharge={item.core_charge} />
                </TableCell>
                <TableCell className="text-right">
                  <TableActions 
                    item={item} 
                    onEdit={onEdit} 
                    onDelete={(id) => deleteItemMutation.mutate(id)} 
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
