import { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

import { InventoryItem, InventoryFormValues } from './inventory/types';
import { InventoryTable } from './inventory/InventoryTable';
import { InventoryDialog } from './inventory/InventoryDialog';
import { SearchFilter } from './inventory/SearchFilter';
import { InventoryFileUpload } from './inventory/InventoryFileUpload';
import { InventoryProvider, useInventoryContext } from './inventory/InventoryContext';

// This is the container component that uses the_context
const InventoryContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const {
    inventoryItems,
    error,
    addItem,
    updateItem,
    isSubmitting,
    refetchInventory
  } = useInventoryContext();

  // Filter items by search term (preserved existing logic + added FTP fields)
  const filteredItems = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
    // Added FTP field searches (optional, won't break if fields don't exist)
    (item.vendor_name && item.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.manufacturer_part_no && item.manufacturer_part_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.upc_code && item.upc_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle form submission (preserved existing logic)
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

  // Handle dialog close (preserved existing logic)
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setShowAddDialog(false);
      setEditingItem(null);
    }
  };

  // Handle upload completion (new functionality)
  const handleUploadComplete = (result: any) => {
    if (result.success && refetchInventory) {
      // Refresh inventory data after successful upload
      refetchInventory();
      setShowUploadDialog(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header section - preserved existing + added upload button */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
            <p className="text-muted-foreground">
              Track and manage your shop's inventory items.
            </p>
          </div>
          <div className="flex gap-2">
            {/* New upload button */}
            <Button 
              onClick={() => setShowUploadDialog(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload CSV
            </Button>
            {/* Existing add button - preserved exactly */}
            <Button onClick={() => {
              setEditingItem(null);
              setShowAddDialog(true);
            }}>
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </div>
        </div>

        {/* Upload Dialog - new functionality */}
        {showUploadDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Upload Inventory File</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowUploadDialog(false)}
                >
                  ×
                </Button>
              </div>
              <InventoryFileUpload onUploadComplete={handleUploadComplete} />
            </div>
          </div>
        )}

        {/* Main content - preserved exactly */}
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

      {/* Add/Edit Item Dialog - preserved exactly */}
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

// The main Inventory component that wraps everything with the provider - preserved exactly
const Inventory = () => {
  return (
    <InventoryProvider>
      <InventoryContent />
    </InventoryProvider>
  );
};

export default Inventory;

