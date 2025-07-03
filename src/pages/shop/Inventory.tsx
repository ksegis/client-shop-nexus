import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
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

export default function Inventory() {
  const [items, setItems] = useState<BasicInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Simple fetch function - NO FILTERING
  const fetchInventory = async () => {
    try {
      console.log('🔍 Fetching inventory (basic safe version)');
      setIsLoading(true);
      setError(null);

      // Simple query - limit to 20 items, NO filtering
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ Fetch error:', error);
        throw error;
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

  // Simple delete function
  const handleDelete = async (id: string) => {
    try {
      console.log('🗑️ Deleting item:', id);
      
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Remove from local state - NO FILTERING, just rebuild array
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
          <p className="text-gray-600 mt-1">Basic safe version - {items.length} items loaded</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchInventory} variant="outline">
            Refresh
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-green-600">✅ Basic Safe Version Active</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• No filtering operations</p>
            <p>• No complex context</p>
            <p>• Simple Supabase queries</p>
            <p>• Limited to 20 items</p>
            <p>• Safe error handling</p>
          </div>
        </CardContent>
      </Card>

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
                              onClick={() => console.log('Edit:', item.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
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
            Showing {items.length} items (limited to 20 for safety)
            <br />
            <span className="text-xs">Basic version - no pagination, no search, no filtering</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

