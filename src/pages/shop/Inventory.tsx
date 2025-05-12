
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';

import { InventoryItem, InventoryFormValues } from './inventory/types';
import { InventoryTable } from './inventory/InventoryTable';
import { InventoryDialog } from './inventory/InventoryDialog';
import { SearchFilter } from './inventory/SearchFilter';
import { InventoryProvider, useInventoryContext } from './inventory/InventoryContext';

// This is the container component that uses the context
const InventoryContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const {
    inventoryItems,
    error,
    addItem,
    updateItem,
    isSubmitting
  } = useInventoryContext();

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
      updateItem({ ...values, id: editingItem.id });
    } else {
      addItem(values);
    }
    
    // Close the dialog after submission
    setShowAddDialog(false);
    setEditingItem(null);
  };

  // Handle dialog close
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setShowAddDialog(false);
      setEditingItem(null);
    }
  };

  return (
    <>
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
              <SearchFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </div>

            {error ? (
              <div className="flex items-center justify-center py-4 text-red-500">
                <AlertCircle className="mr-2 h-4 w-4" />
                Error loading inventory data
              </div>
            ) : (
              <InventoryTable onEdit={setEditingItem} />
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
        isSubmitting={isSubmitting}
      />
    </>
  );
};

// The main Inventory component that wraps everything with the provider
const Inventory = () => {
  return (
    <InventoryProvider>
      <InventoryContent />
    </InventoryProvider>
  );
};

export default function InventoryPage() {
  return (
    <Layout portalType="shop">
      <Inventory />
    </Layout>
  );
}
