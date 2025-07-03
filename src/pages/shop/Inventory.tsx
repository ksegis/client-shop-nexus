import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Basic inventory item type
interface BasicInventoryItem {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  price: number;
  cost?: number;
  category?: string;
  supplier?: string;
  reorder_level?: number;
}

// Form data type
interface InventoryFormData {
  name: string;
  description: string;
  sku: string;
  quantity: string;
  price: string;
  cost: string;
  category: string;
  supplier: string;
  reorder_level: string;
}

export default function Inventory() {
  const [items, setItems] = useState<BasicInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BasicInventoryItem | null>(null);
  const [formData, setFormData] = useState<InventoryFormData>({
    name: '',
    description: '',
    sku: '',
    quantity: '0',
    price: '0',
    cost: '0',
    category: '',
    supplier: '',
    reorder_level: '0'
  });
  const { toast } = useToast();

  // Simple fetch function - NO FILTERING
  const fetchInventory = async () => {
    try {
      console.log('🔍 Fetching inventory (working CRUD version)');
      setIsLoading(true);
      setError(null);

      // Simple query - limit to 50 items, NO filtering
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Fetch error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Safe data handling - ensure it's always an array
      const safeData = data || [];
      console.log('✅ Fetched items:', safeData.length);
      
      setItems(safeData);
    } catch (err) {
      console.error('💥 Fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchInventory();
  }, []);

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      quantity: '0',
      price: '0',
      cost: '0',
      category: '',
      supplier: '',
      reorder_level: '0'
    });
  };

  // Handle form input changes
  const handleInputChange = (field: keyof InventoryFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add new item
  const handleAddItem = async () => {
    try {
      console.log('➕ Adding new item:', formData.name);

      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Item name is required');
      }

      // Convert form data to database format
      const itemData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        sku: formData.sku.trim() || null,
        quantity: parseInt(formData.quantity) || 0,
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || null,
        category: formData.category.trim() || null,
        supplier: formData.supplier.trim() || null,
        reorder_level: parseInt(formData.reorder_level) || null,
      };

      const { data, error } = await supabase
        .from('inventory')
        .insert([itemData])
        .select()
        .single();

      if (error) {
        console.error('❌ Add error:', error);
        throw new Error(`Failed to add item: ${error.message}`);
      }

      console.log('✅ Item added:', data.id);

      // Add to local state
      setItems(prev => [data, ...prev]);
      
      // Reset form and close dialog
      resetForm();
      setIsAddDialogOpen(false);

      toast({
        title: "Success",
        description: "Item added successfully",
      });
    } catch (err) {
      console.error('❌ Add item error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Edit item
  const handleEditItem = async () => {
    if (!editingItem) return;

    try {
      console.log('🔄 Updating item:', editingItem.id);

      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Item name is required');
      }

      // Convert form data to database format
      const itemData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        sku: formData.sku.trim() || null,
        quantity: parseInt(formData.quantity) || 0,
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || null,
        category: formData.category.trim() || null,
        supplier: formData.supplier.trim() || null,
        reorder_level: parseInt(formData.reorder_level) || null,
      };

      const { data, error } = await supabase
        .from('inventory')
        .update(itemData)
        .eq('id', editingItem.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Update error:', error);
        throw new Error(`Failed to update item: ${error.message}`);
      }

      console.log('✅ Item updated:', data.id);

      // Update local state - rebuild array instead of filtering
      const updatedItems = [];
      for (const item of items) {
        if (item.id === editingItem.id) {
          updatedItems.push(data);
        } else {
          updatedItems.push(item);
        }
      }
      setItems(updatedItems);
      
      // Reset form and close dialog
      resetForm();
      setIsEditDialogOpen(false);
      setEditingItem(null);

      toast({
        title: "Success",
        description: "Item updated successfully",
      });
    } catch (err) {
      console.error('❌ Update item error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update item';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Delete item with confirmation
  const handleDelete = async (id: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting item:', id);
      
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Delete error details:', error);
        throw new Error(`Failed to delete item: ${error.message}`);
      }

      console.log('✅ Item deleted successfully');

      // Remove from local state - rebuild array instead of filtering
      const updatedItems = [];
      for (const item of items) {
        if (item.id !== id) {
          updatedItems.push(item);
        }
      }
      setItems(updatedItems);

      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    } catch (err) {
      console.error('❌ Delete error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (item: BasicInventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      sku: item.sku || '',
      quantity: item.quantity?.toString() || '0',
      price: item.price?.toString() || '0',
      cost: item.cost?.toString() || '0',
      category: item.category || '',
      supplier: item.supplier || '',
      reorder_level: item.reorder_level?.toString() || '0'
    });
    setIsEditDialogOpen(true);
  };

  // Simple stock status function
  const getStockStatus = (quantity: number, reorderLevel?: number) => {
    if (quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (reorderLevel && quantity <= reorderLevel) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  // Simple currency formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading inventory...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <h2 className="text-lg font-semibold mb-2">Error Loading Inventory</h2>
              <p>{error}</p>
              <Button onClick={fetchInventory} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Working CRUD version - {items.length} items loaded</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchInventory} variant="outline">
            Refresh
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Item name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Item description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      placeholder="SKU"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost">Cost</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => handleInputChange('cost', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      placeholder="Category"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => handleInputChange('supplier', e.target.value)}
                      placeholder="Supplier"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleAddItem} className="flex-1">
                    Add Item
                  </Button>
                  <Button onClick={() => setIsAddDialogOpen(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-green-600">✅ Working CRUD Version Active</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Add, Edit, Delete functionality working</p>
            <p>• Proper error handling</p>
            <p>• No filtering operations</p>
            <p>• Limited to 50 items</p>
            <p>• Safe CRUD operations</p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Item name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Item description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-sku">SKU</Label>
                <Input
                  id="edit-sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="SKU"
                />
              </div>
              <div>
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="edit-cost">Cost</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="Category"
                />
              </div>
              <div>
                <Label htmlFor="edit-supplier">Supplier</Label>
                <Input
                  id="edit-supplier"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  placeholder="Supplier"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleEditItem} className="flex-1">
                Update Item
              </Button>
              <Button onClick={() => setIsEditDialogOpen(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inventory Items */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <p>No inventory items found.</p>
              <p className="text-sm mt-1">Add some items to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            const stockStatus = getStockStatus(item.quantity, item.reorder_level);
            
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {item.name || 'Unknown Item'}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            {item.sku && <span>SKU: {item.sku}</span>}
                            {item.category && <span>{item.category}</span>}
                            {item.supplier && <span>Supplier: {item.supplier}</span>}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 ml-4">
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              Qty: {item.quantity || 0}
                            </div>
                            <Badge variant={stockStatus.variant} className="mt-1">
                              {stockStatus.label}
                            </Badge>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              {formatCurrency(item.price || 0)}
                            </div>
                            {item.cost && (
                              <div className="text-sm text-gray-500">
                                Cost: {formatCurrency(item.cost)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id, item.name)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-gray-600">
            Showing {items.length} items (limited to 50 for safety)
            <br />
            <span className="text-xs">Working CRUD version - Add, Edit, Delete functional</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

