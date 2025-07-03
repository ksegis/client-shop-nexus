import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Edit,
  Trash2,
  Search,
  Loader2
} from 'lucide-react';
import { useInventoryContext } from './InventoryContext';
import type { InventoryItem } from './InventoryContext';

interface InventoryTableProps {
  onEditItem?: (item: InventoryItem) => void;
  onDeleteItem?: (item: InventoryItem) => void;
}

export function InventoryTable({ onEditItem, onDeleteItem }: InventoryTableProps) {
  const {
    items,
    totalCount,
    isLoading,
    currentPage,
    pageSize,
    totalPages,
    searchTerm,
    setCurrentPage,
    setPageSize,
    setSearchTerm,
  } = useInventoryContext();

  // Safe data handling
  const safeItems = Array.isArray(items) ? items : [];
  const safeTotalCount = typeof totalCount === 'number' ? totalCount : 0;
  const safeCurrentPage = typeof currentPage === 'number' ? currentPage : 1;
  const safePageSize = typeof pageSize === 'number' ? pageSize : 20;
  const safeTotalPages = typeof totalPages === 'number' ? totalPages : 1;
  const safeSearchTerm = typeof searchTerm === 'string' ? searchTerm : '';

  // Calculate display range
  const startItem = Math.max(1, (safeCurrentPage - 1) * safePageSize + 1);
  const endItem = Math.min(safeTotalCount, safeCurrentPage * safePageSize);

  // Safe navigation functions
  const goToFirstPage = () => {
    if (setCurrentPage && safeCurrentPage > 1) {
      setCurrentPage(1);
    }
  };

  const goToPreviousPage = () => {
    if (setCurrentPage && safeCurrentPage > 1) {
      setCurrentPage(safeCurrentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (setCurrentPage && safeCurrentPage < safeTotalPages) {
      setCurrentPage(safeCurrentPage + 1);
    }
  };

  const goToLastPage = () => {
    if (setCurrentPage && safeCurrentPage < safeTotalPages) {
      setCurrentPage(safeTotalPages);
    }
  };

  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize, 10);
    if (setPageSize && !isNaN(size) && size > 0) {
      setPageSize(size);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (setSearchTerm) {
      setSearchTerm(event.target.value);
    }
  };

  const handleEditClick = (item: InventoryItem) => {
    if (onEditItem && item) {
      onEditItem(item);
    }
  };

  const handleDeleteClick = (item: InventoryItem) => {
    if (onDeleteItem && item) {
      onDeleteItem(item);
    }
  };

  // Safe stock status calculation
  const getStockStatus = (quantity: number, reorderLevel?: number) => {
    const safeQuantity = typeof quantity === 'number' ? quantity : 0;
    const safeReorderLevel = typeof reorderLevel === 'number' ? reorderLevel : 0;
    
    if (safeQuantity === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const };
    }
    if (safeReorderLevel > 0 && safeQuantity <= safeReorderLevel) {
      return { label: 'Low Stock', variant: 'secondary' as const };
    }
    return { label: 'In Stock', variant: 'default' as const };
  };

  // Safe currency formatting
  const formatCurrency = (amount: number) => {
    const safeAmount = typeof amount === 'number' ? amount : 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(safeAmount);
  };

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search items..."
                value={safeSearchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            
            {/* Page Size Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show:</span>
              <Select value={safePageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">items</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading inventory...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && safeItems.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              {safeSearchTerm ? (
                <>
                  <p>No items found matching "{safeSearchTerm}"</p>
                  <p className="text-sm mt-1">Try adjusting your search terms</p>
                </>
              ) : (
                <>
                  <p>No inventory items found</p>
                  <p className="text-sm mt-1">Add some items to get started</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      {!isLoading && safeItems.length > 0 && (
        <div className="space-y-3">
          {safeItems.map((item) => {
            // Safe item data extraction
            const itemId = item?.id || '';
            const itemName = item?.name || 'Unknown Item';
            const itemDescription = item?.description || '';
            const itemSku = item?.sku || '';
            const itemCategory = item?.category || '';
            const itemSupplier = item?.supplier || '';
            const itemQuantity = typeof item?.quantity === 'number' ? item.quantity : 0;
            const itemPrice = typeof item?.price === 'number' ? item.price : 0;
            const itemCost = typeof item?.cost === 'number' ? item.cost : 0;
            const itemReorderLevel = typeof item?.reorder_level === 'number' ? item.reorder_level : 0;
            
            const stockStatus = getStockStatus(itemQuantity, itemReorderLevel);
            
            return (
              <Card key={itemId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {itemName}
                          </h3>
                          {itemDescription && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {itemDescription}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            {itemSku && <span>SKU: {itemSku}</span>}
                            {itemCategory && <span>{itemCategory}</span>}
                            {itemSupplier && <span>Supplier: {itemSupplier}</span>}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 ml-4">
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              Qty: {itemQuantity}
                            </div>
                            <Badge variant={stockStatus.variant} className="mt-1">
                              {stockStatus.label}
                            </Badge>
                            {itemReorderLevel > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Reorder at: {itemReorderLevel}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              {formatCurrency(itemPrice)}
                            </div>
                            {itemCost > 0 && (
                              <div className="text-sm text-gray-500">
                                Cost: {formatCurrency(itemCost)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(item)}
                              disabled={!onEditItem}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(item)}
                              disabled={!onDeleteItem}
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

      {/* Pagination Controls */}
      {!isLoading && safeTotalCount > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Status */}
              <div className="text-sm text-gray-600">
                Showing {startItem} to {endItem} of {safeTotalCount} items
                {safeSearchTerm && (
                  <span className="ml-2 text-blue-600">
                    (filtered by "{safeSearchTerm}")
                  </span>
                )}
              </div>
              
              {/* Pagination Buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={safeCurrentPage <= 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={safeCurrentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-sm text-gray-600 px-2">
                  Page {safeCurrentPage} of {safeTotalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={safeCurrentPage >= safeTotalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={safeCurrentPage >= safeTotalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default InventoryTable;

