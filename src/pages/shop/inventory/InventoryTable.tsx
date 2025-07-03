import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useInventoryContext } from './InventoryContext';
import type { InventoryItem } from './types';

interface InventoryTableProps {
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
}

export function InventoryTable({ onEdit, onDelete }: InventoryTableProps) {
  const {
    items,
    totalCount,
    isLoading,
    currentPage,
    pageSize,
    totalPages,
    setCurrentPage,
    setPageSize,
  } = useInventoryContext();

  // Defensive data handling
  const safeItems = Array.isArray(items) ? items : [];
  const safeTotalCount = typeof totalCount === 'number' ? totalCount : 0;
  const safeCurrentPage = typeof currentPage === 'number' ? Math.max(1, currentPage) : 1;
  const safePageSize = typeof pageSize === 'number' ? Math.max(1, pageSize) : 20;
  const safeTotalPages = typeof totalPages === 'number' ? Math.max(1, totalPages) : 1;

  const getStockStatus = (quantity: number, reorderLevel?: number | null) => {
    const safeQuantity = typeof quantity === 'number' ? quantity : 0;
    const safeReorderLevel = typeof reorderLevel === 'number' ? reorderLevel : null;
    
    if (safeQuantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (safeReorderLevel && safeQuantity <= safeReorderLevel) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || typeof amount !== 'number') return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    const size = parseInt(newPageSize);
    if (!isNaN(size) && size > 0 && setPageSize) {
      setPageSize(size);
      if (setCurrentPage) {
        setCurrentPage(1); // Reset to first page when changing page size
      }
    }
  };

  const goToFirstPage = () => {
    if (setCurrentPage) {
      setCurrentPage(1);
    }
  };

  const goToLastPage = () => {
    if (setCurrentPage) {
      setCurrentPage(safeTotalPages);
    }
  };

  const goToPreviousPage = () => {
    if (setCurrentPage) {
      setCurrentPage(Math.max(1, safeCurrentPage - 1));
    }
  };

  const goToNextPage = () => {
    if (setCurrentPage) {
      setCurrentPage(Math.min(safeTotalPages, safeCurrentPage + 1));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading inventory...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!safeItems || safeItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>No inventory items found.</p>
            <p className="text-sm mt-1">Add some items to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Inventory Items */}
      <div className="grid gap-4">
        {safeItems.map((item) => {
          // Defensive item data handling
          const safeItem = {
            id: item?.id || '',
            name: item?.name || 'Unknown Item',
            description: item?.description || null,
            sku: item?.sku || null,
            category: item?.category || null,
            supplier: item?.supplier || null,
            quantity: typeof item?.quantity === 'number' ? item.quantity : 0,
            price: typeof item?.price === 'number' ? item.price : 0,
            cost: typeof item?.cost === 'number' ? item.cost : null,
            reorder_level: typeof item?.reorder_level === 'number' ? item.reorder_level : null,
          };

          const stockStatus = getStockStatus(safeItem.quantity, safeItem.reorder_level);
          
          return (
            <Card key={safeItem.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {safeItem.name}
                        </h3>
                        {safeItem.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {safeItem.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          {safeItem.sku && <span>SKU: {safeItem.sku}</span>}
                          {safeItem.category && <span>{safeItem.category}</span>}
                          {safeItem.supplier && <span>Supplier: {safeItem.supplier}</span>}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 ml-4">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            Qty: {safeItem.quantity}
                          </div>
                          <Badge variant={stockStatus.variant} className="mt-1">
                            {stockStatus.label}
                          </Badge>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(safeItem.price)}
                          </div>
                          {safeItem.cost && (
                            <div className="text-sm text-gray-500">
                              Cost: {formatCurrency(safeItem.cost)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit && onEdit(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete && onDelete(safeItem.id)}
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

      {/* Pagination Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Showing {((safeCurrentPage - 1) * safePageSize) + 1} to {Math.min(safeCurrentPage * safePageSize, safeTotalCount)} of {safeTotalCount} items
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Items per page:</span>
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
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToFirstPage}
                disabled={safeCurrentPage === 1}
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={safeCurrentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-700">
                  Page {safeCurrentPage} of {safeTotalPages}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={safeCurrentPage === safeTotalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToLastPage}
                disabled={safeCurrentPage === safeTotalPages}
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InventoryTable;

