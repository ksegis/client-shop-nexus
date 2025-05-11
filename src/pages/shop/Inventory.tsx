
import { useState } from 'react';
import { AlertCircle, Plus, Search } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { InventoryItem, InventoryFormValues } from './inventory/types';
import { InventoryTable } from './inventory/InventoryTable';
import { InventoryDialog } from './inventory/InventoryDialog';
import { useInventory } from './inventory/useInventory';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const {
    inventoryItems,
    isLoading,
    error,
    sortField,
    sortDirection,
    handleSort,
    addItemMutation,
    updateItemMutation
  } = useInventory();

  // Filter items by search term
  const filteredItems = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle form submission
  const onSubmit = (values: InventoryFormValues) => {
    if (editingItem) {
      updateItemMutation.mutate({ ...values, id: editingItem.id });
    } else {
      addItemMutation.mutate(values);
    }
  };

  // Handle dialog close
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setShowAddDialog(false);
      setEditingItem(null);
    }
  };

  return (
    <Layout portalType="shop">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
            <p className="text-muted-foreground">
              Track and manage your shop's inventory items.
            </p>
          </div>
          <Button onClick={() => {
            setEditingItem(null);
            setShowAddDialog(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
            <CardDescription>
              View and manage all items in your inventory.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory items..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {error ? (
              <div className="flex items-center justify-center py-4 text-red-500">
                <AlertCircle className="mr-2 h-4 w-4" />
                Error loading inventory data
              </div>
            ) : (
              <InventoryTable
                items={filteredItems}
                isLoading={isLoading}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                onEdit={setEditingItem}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Item Dialog */}
      <InventoryDialog
        open={showAddDialog || editingItem !== null}
        onOpenChange={handleDialogOpenChange}
        onSubmit={onSubmit}
        editingItem={editingItem}
        isSubmitting={addItemMutation.isPending || updateItemMutation.isPending}
      />
    </Layout>
  );
};

export default Inventory;
